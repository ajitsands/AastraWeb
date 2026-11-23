<?php

class SubCategoryModel extends Model
{
    public function ensureSchema(): void
    {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS `sub_categories` (
              `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
              `category_id` INT UNSIGNED NOT NULL,
              `name` VARCHAR(160) NOT NULL,
              `slug` VARCHAR(180) NOT NULL UNIQUE,
              `description` TEXT NULL,
              `image_url` VARCHAR(500) NULL,
              `sort_order` INT NOT NULL DEFAULT 0,
              `is_active` TINYINT(1) NOT NULL DEFAULT 1,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              INDEX `idx_subcat_category` (`category_id`),
              INDEX `idx_subcat_active` (`is_active`, `sort_order`),
              CONSTRAINT `fk_subcat_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");

        $this->addColumnIfMissing('items', 'sub_category_id', 'INT UNSIGNED NULL AFTER `category_id`');
        $this->addColumnIfMissing('items', 'pdf_template', "VARCHAR(50) NOT NULL DEFAULT 'standard' AFTER `spec_table_json`");
        $this->addColumnIfMissing('items', 'template_data_json', 'JSON NULL AFTER `pdf_template`');
        $this->addColumnIfMissing('catalogue_groups', 'sub_category_id', 'INT UNSIGNED NULL AFTER `category_id`');
        $this->addColumnIfMissing('catalogue_groups', 'pdf_template', "VARCHAR(50) NOT NULL DEFAULT 'standard' AFTER `layout_mode`");
    }

    private function addColumnIfMissing(string $table, string $column, string $definition): void
    {
        $stmt = $this->db->prepare("
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
            LIMIT 1
        ");
        $stmt->execute([$table, $column]);
        if (!$stmt->fetch()) {
            $this->db->exec("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
        }
    }

    public function getAll(array $filters = []): array
    {
        $this->ensureSchema();
        $conditions = [];
        $params = [];

        if (!empty($filters['only_active'])) {
            $conditions[] = 's.is_active = 1';
        }
        if (!empty($filters['category_id'])) {
            $conditions[] = 's.category_id = ?';
            $params[] = (int)$filters['category_id'];
        }
        if (!empty($filters['category_slug'])) {
            $conditions[] = 'c.slug = ?';
            $params[] = $filters['category_slug'];
        }

        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $sql = "
            SELECT s.*, c.name AS category_name, c.slug AS category_slug, c.chapter_number,
                   (SELECT COUNT(*) FROM items i WHERE i.sub_category_id = s.id AND i.is_active = 1) AS item_count
            FROM sub_categories s
            INNER JOIN categories c ON c.id = s.category_id
            $where
            ORDER BY c.chapter_number ASC, c.sort_order ASC, s.sort_order ASC, s.name ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findByIdOrSlug($identifier): ?array
    {
        $this->ensureSchema();
        $sql = "
            SELECT s.*, c.name AS category_name, c.slug AS category_slug, c.chapter_number
            FROM sub_categories s
            INNER JOIN categories c ON c.id = s.category_id
            WHERE " . (is_numeric($identifier) ? 's.id = ?' : 's.slug = ?') . "
            LIMIT 1
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([is_numeric($identifier) ? (int)$identifier : $identifier]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): array
    {
        $this->ensureSchema();
        $slug = !empty($data['slug']) ? $this->slugify($data['slug']) : $this->slugify($data['name']);
        $slug = $this->ensureUniqueSlug($slug);

        $stmt = $this->db->prepare('
            INSERT INTO sub_categories (category_id, name, slug, description, image_url, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            (int)$data['category_id'],
            trim($data['name']),
            $slug,
            $data['description'] ?? null,
            $data['image_url'] ?? null,
            (int)($data['sort_order'] ?? 0),
            isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
        ]);

        return $this->findByIdOrSlug((int)$this->db->lastInsertId());
    }

    public function update(int $id, array $data): ?array
    {
        $this->ensureSchema();
        $existing = $this->findByIdOrSlug($id);
        if (!$existing) {
            return null;
        }

        $name = isset($data['name']) ? trim($data['name']) : $existing['name'];
        $slug = !empty($data['slug']) ? $this->slugify($data['slug']) : $existing['slug'];
        if ($slug !== $existing['slug']) {
            $slug = $this->ensureUniqueSlug($slug, $id);
        }

        $stmt = $this->db->prepare('
            UPDATE sub_categories
            SET category_id = ?, name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?, is_active = ?
            WHERE id = ?
        ');
        $stmt->execute([
            (int)($data['category_id'] ?? $existing['category_id']),
            $name,
            $slug,
            array_key_exists('description', $data) ? $data['description'] : $existing['description'],
            array_key_exists('image_url', $data) ? $data['image_url'] : $existing['image_url'],
            (int)($data['sort_order'] ?? $existing['sort_order']),
            array_key_exists('is_active', $data) ? (int)(bool)$data['is_active'] : $existing['is_active'],
            $id,
        ]);

        return $this->findByIdOrSlug($id);
    }

    public function delete(int $id): bool
    {
        $this->ensureSchema();
        $stmt = $this->db->prepare('DELETE FROM sub_categories WHERE id = ?');
        return $stmt->execute([$id]);
    }

    private function ensureUniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = $slug;
        $i = 1;
        while (true) {
            $sql = $ignoreId
                ? 'SELECT id FROM sub_categories WHERE slug = ? AND id != ? LIMIT 1'
                : 'SELECT id FROM sub_categories WHERE slug = ? LIMIT 1';
            $stmt = $this->db->prepare($sql);
            $stmt->execute($ignoreId ? [$slug, $ignoreId] : [$slug]);
            if (!$stmt->fetch()) {
                return $slug;
            }
            $slug = $base . '-' . (++$i);
        }
    }
}
