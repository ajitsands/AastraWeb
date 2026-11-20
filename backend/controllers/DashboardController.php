<?php

class DashboardController extends Controller
{
    public function stats(): void
    {
        $this->requireAuth();
        $db = Database::getConnection();

        $counts = [
            'categories' => (int)$db->query('SELECT COUNT(*) FROM categories')->fetchColumn(),
            'finishes'   => (int)$db->query('SELECT COUNT(*) FROM finishes')->fetchColumn(),
            'items'      => (int)$db->query('SELECT COUNT(*) FROM items')->fetchColumn(),
            'groups'     => (int)$db->query('SELECT COUNT(*) FROM catalogue_groups')->fetchColumn(),
            'enquiries'  => (int)$db->query("SELECT COUNT(*) FROM enquiries WHERE status = 'new'")->fetchColumn(),
        ];

        $this->success($counts);
    }
}
