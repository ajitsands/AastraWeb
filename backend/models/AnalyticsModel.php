<?php

class AnalyticsModel extends Model
{
    public function ensureTable(): void
    {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS `analytics_events` (
              `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              `event_type` ENUM('page_view', 'pdf_download', 'pdf_print') NOT NULL DEFAULT 'page_view',
              `page_path` VARCHAR(500) NOT NULL,
              `page_title` VARCHAR(220) NULL,
              `referrer` VARCHAR(500) NULL,
              `pdf_page_code` VARCHAR(60) NULL,
              `pdf_title` VARCHAR(200) NULL,
              `item_code` VARCHAR(80) NULL,
              `ip_address` VARCHAR(64) NOT NULL,
              `country` VARCHAR(100) NULL,
              `country_code` VARCHAR(10) NULL,
              `region` VARCHAR(120) NULL,
              `city` VARCHAR(120) NULL,
              `latitude` DECIMAL(10, 6) NULL,
              `longitude` DECIMAL(10, 6) NULL,
              `isp` VARCHAR(180) NULL,
              `device_type` VARCHAR(30) NOT NULL DEFAULT 'Desktop',
              `browser` VARCHAR(60) NULL,
              `os` VARCHAR(60) NULL,
              `user_agent` VARCHAR(500) NULL,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              INDEX `idx_analytics_type_date` (`event_type`, `created_at`),
              INDEX `idx_analytics_ip` (`ip_address`),
              INDEX `idx_analytics_pdf` (`pdf_page_code`),
              INDEX `idx_analytics_country` (`country`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function getCachedGeo(string $ip): ?array
    {
        $stmt = $this->db->prepare("
            SELECT country, country_code, region, city, latitude, longitude, isp
            FROM analytics_events
            WHERE ip_address = ? AND country IS NOT NULL AND country != ''
            ORDER BY id DESC
            LIMIT 1
        ");
        $stmt->execute([$ip]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function record(array $data): int
    {
        $this->ensureTable();
        $stmt = $this->db->prepare("
            INSERT INTO analytics_events (
                event_type, page_path, page_title, referrer,
                pdf_page_code, pdf_title, item_code,
                ip_address, country, country_code, region, city, latitude, longitude, isp,
                device_type, browser, os, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['event_type'],
            substr((string)$data['page_path'], 0, 500),
            isset($data['page_title']) ? substr((string)$data['page_title'], 0, 220) : null,
            isset($data['referrer']) ? substr((string)$data['referrer'], 0, 500) : null,
            $data['pdf_page_code'] ?? null,
            $data['pdf_title'] ?? null,
            $data['item_code'] ?? null,
            $data['ip_address'],
            $data['country'] ?? null,
            $data['country_code'] ?? null,
            $data['region'] ?? null,
            $data['city'] ?? null,
            $data['latitude'] ?? null,
            $data['longitude'] ?? null,
            $data['isp'] ?? null,
            $data['device_type'] ?? 'Desktop',
            $data['browser'] ?? 'Unknown',
            $data['os'] ?? 'Unknown',
            isset($data['user_agent']) ? substr((string)$data['user_agent'], 0, 500) : null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function getSummary(int $days = 30): array
    {
        $this->ensureTable();
        $since = date('Y-m-d H:i:s', strtotime("-{$days} days"));

        $kpiStmt = $this->db->prepare("
            SELECT
                SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS total_views,
                SUM(CASE WHEN event_type IN ('pdf_download', 'pdf_print') THEN 1 ELSE 0 END) AS total_downloads,
                COUNT(DISTINCT ip_address) AS unique_visitors
            FROM analytics_events
            WHERE created_at >= ?
        ");
        $kpiStmt->execute([$since]);
        $kpis = $kpiStmt->fetch() ?: ['total_views' => 0, 'total_downloads' => 0, 'unique_visitors' => 0];

        $topPages = $this->db->prepare("
            SELECT page_path, COUNT(*) AS views, COUNT(DISTINCT ip_address) AS unique_ips
            FROM analytics_events
            WHERE event_type = 'page_view' AND created_at >= ?
            GROUP BY page_path
            ORDER BY views DESC
            LIMIT 12
        ");
        $topPages->execute([$since]);

        $topPdfs = $this->db->prepare("
            SELECT
                COALESCE(NULLIF(pdf_page_code, ''), item_code, 'Datasheet') AS code,
                COALESCE(NULLIF(pdf_title, ''), page_path) AS title,
                COUNT(*) AS downloads,
                COUNT(DISTINCT ip_address) AS unique_downloaders,
                MAX(created_at) AS last_downloaded
            FROM analytics_events
            WHERE event_type IN ('pdf_download', 'pdf_print') AND created_at >= ?
            GROUP BY code, title
            ORDER BY downloads DESC
            LIMIT 15
        ");
        $topPdfs->execute([$since]);

        $locations = $this->db->prepare("
            SELECT
                COALESCE(NULLIF(country, ''), 'Unknown') AS country,
                COALESCE(NULLIF(country_code, ''), '') AS country_code,
                COALESCE(NULLIF(city, ''), '—') AS city,
                COUNT(*) AS hits,
                SUM(CASE WHEN event_type IN ('pdf_download', 'pdf_print') THEN 1 ELSE 0 END) AS downloads,
                COUNT(DISTINCT ip_address) AS unique_ips
            FROM analytics_events
            WHERE created_at >= ?
            GROUP BY country, country_code, city
            ORDER BY hits DESC
            LIMIT 15
        ");
        $locations->execute([$since]);

        $devices = $this->db->prepare("
            SELECT device_type, COUNT(*) AS count
            FROM analytics_events
            WHERE created_at >= ?
            GROUP BY device_type
            ORDER BY count DESC
        ");
        $devices->execute([$since]);

        return [
            'days'            => $days,
            'total_views'     => (int)($kpis['total_views'] ?? 0),
            'total_downloads' => (int)($kpis['total_downloads'] ?? 0),
            'unique_visitors' => (int)($kpis['unique_visitors'] ?? 0),
            'top_pages'       => $topPages->fetchAll(),
            'top_pdfs'        => $topPdfs->fetchAll(),
            'locations'       => $locations->fetchAll(),
            'devices'         => $devices->fetchAll(),
        ];
    }

    public function getLogs(array $filters = []): array
    {
        $this->ensureTable();
        $conditions = [];
        $params = [];

        if (!empty($filters['event_type']) && in_array($filters['event_type'], ['page_view', 'pdf_download', 'pdf_print'])) {
            $conditions[] = 'event_type = ?';
            $params[] = $filters['event_type'];
        }
        if (!empty($filters['search'])) {
            $conditions[] = '(ip_address LIKE ? OR country LIKE ? OR city LIKE ? OR page_path LIKE ? OR pdf_page_code LIKE ? OR pdf_title LIKE ?)';
            $q = '%' . trim($filters['search']) . '%';
            array_push($params, $q, $q, $q, $q, $q, $q);
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $limit = max(10, min(500, (int)($filters['limit'] ?? 150)));

        $stmt = $this->db->prepare("
            SELECT *
            FROM analytics_events
            $where
            ORDER BY created_at DESC
            LIMIT $limit
        ");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}
