<?php

class AnalyticsController extends Controller
{
    public function track(): void
    {
        $input = $this->getJsonInput();
        $eventType = $input['event_type'] ?? 'page_view';
        if (!in_array($eventType, ['page_view', 'pdf_download', 'pdf_print'], true)) {
            $eventType = 'page_view';
        }

        $ip = $this->getClientIp();
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $parsedUa = $this->parseUserAgent($ua);

        $model = new AnalyticsModel();
        $geo = $this->resolveGeo($ip, $model);

        $id = $model->record([
            'event_type'    => $eventType,
            'page_path'     => $input['page_path'] ?? '/',
            'page_title'    => $input['page_title'] ?? null,
            'referrer'      => $input['referrer'] ?? null,
            'pdf_page_code' => $input['pdf_page_code'] ?? null,
            'pdf_title'     => $input['pdf_title'] ?? null,
            'item_code'     => $input['item_code'] ?? null,
            'ip_address'    => $ip,
            'country'       => $geo['country'] ?? null,
            'country_code'  => $geo['country_code'] ?? null,
            'region'        => $geo['region'] ?? null,
            'city'          => $geo['city'] ?? null,
            'latitude'      => $geo['latitude'] ?? null,
            'longitude'     => $geo['longitude'] ?? null,
            'isp'           => $geo['isp'] ?? null,
            'device_type'   => $parsedUa['device_type'],
            'browser'       => $parsedUa['browser'],
            'os'            => $parsedUa['os'],
            'user_agent'    => $ua,
        ]);

        $this->success(['id' => $id], 'Tracked', 201);
    }

    public function summary(): void
    {
        $this->requireAuth();
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        $model = new AnalyticsModel();
        $this->success($model->getSummary($days));
    }

    public function logs(): void
    {
        $this->requireAuth();
        $model = new AnalyticsModel();
        $this->success($model->getLogs([
            'event_type' => $_GET['type'] ?? null,
            'search'     => $_GET['q'] ?? null,
            'limit'      => $_GET['limit'] ?? 150,
        ]));
    }

    private function getClientIp(): string
    {
        $headers = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_REAL_IP',
            'HTTP_X_FORWARDED_FOR',
            'REMOTE_ADDR',
        ];
        foreach ($headers as $h) {
            if (!empty($_SERVER[$h])) {
                $raw = explode(',', $_SERVER[$h])[0];
                $ip = trim($raw);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }

    private function isPrivateIp(string $ip): bool
    {
        if ($ip === '127.0.0.1' || $ip === '::1' || $ip === '0.0.0.0') {
            return true;
        }
        return !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    }

    private function resolveGeo(string $ip, AnalyticsModel $model): array
    {
        if ($this->isPrivateIp($ip)) {
            return [
                'country'      => 'Local Network',
                'country_code' => 'LO',
                'region'       => 'Localhost',
                'city'         => 'Local',
                'latitude'     => null,
                'longitude'    => null,
                'isp'          => 'Local Development',
            ];
        }

        // Fast DB cache check first
        $cached = $model->getCachedGeo($ip);
        if ($cached) {
            return $cached;
        }

        // Lightweight external IP geolocation lookup (2s timeout, non-fatal)
        $url = "http://ip-api.com/json/" . urlencode($ip) . "?fields=status,country,countryCode,regionName,city,lat,lon,isp";
        $raw = null;

        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_CONNECTTIMEOUT => 2,
                CURLOPT_TIMEOUT        => 2,
            ]);
            $raw = @curl_exec($ch);
            curl_close($ch);
        } elseif (ini_get('allow_url_fopen')) {
            $ctx = stream_context_create(['http' => ['timeout' => 2]]);
            $raw = @file_get_contents($url, false, $ctx);
        }

        if ($raw) {
            $data = json_decode($raw, true);
            if (is_array($data) && ($data['status'] ?? '') === 'success') {
                return [
                    'country'      => $data['country'] ?? null,
                    'country_code' => $data['countryCode'] ?? null,
                    'region'       => $data['regionName'] ?? null,
                    'city'         => $data['city'] ?? null,
                    'latitude'     => $data['lat'] ?? null,
                    'longitude'    => $data['lon'] ?? null,
                    'isp'          => $data['isp'] ?? null,
                ];
            }
        }

        return [
            'country'      => 'Unknown',
            'country_code' => '',
            'region'       => '',
            'city'         => '',
            'latitude'     => null,
            'longitude'    => null,
            'isp'          => '',
        ];
    }

    private function parseUserAgent(string $ua): array
    {
        $device = 'Desktop';
        if (preg_match('/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i', $ua)) {
            $device = 'Tablet';
        } elseif (preg_match('/(mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile)/i', $ua)) {
            $device = 'Mobile';
        }

        $browser = 'Other';
        if (stripos($ua, 'Edg') !== false) $browser = 'Edge';
        elseif (stripos($ua, 'OPR') !== false || stripos($ua, 'Opera') !== false) $browser = 'Opera';
        elseif (stripos($ua, 'Chrome') !== false) $browser = 'Chrome';
        elseif (stripos($ua, 'Safari') !== false) $browser = 'Safari';
        elseif (stripos($ua, 'Firefox') !== false) $browser = 'Firefox';

        $os = 'Other';
        if (stripos($ua, 'Windows') !== false) $os = 'Windows';
        elseif (stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) $os = 'iOS';
        elseif (stripos($ua, 'Mac OS') !== false) $os = 'macOS';
        elseif (stripos($ua, 'Android') !== false) $os = 'Android';
        elseif (stripos($ua, 'Linux') !== false) $os = 'Linux';

        return [
            'device_type' => $device,
            'browser'     => $browser,
            'os'          => $os,
        ];
    }
}
