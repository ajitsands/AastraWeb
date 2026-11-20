<?php

class Controller
{
    protected function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    protected function success($data = null, string $message = 'OK', int $status = 200): void
    {
        $this->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    protected function error(string $message, int $status = 400, $details = null): void
    {
        $payload = [
            'success' => false,
            'error'   => $message,
        ];
        if ($details !== null) {
            $payload['details'] = $details;
        }
        $this->json($payload, $status);
    }

    protected function getJsonInput(): array
    {
        $raw = file_get_contents('php://input');
        if (!$raw) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    protected function requireAuth(): array
    {
        return Auth::requireAdmin();
    }
}
