<?php

class DashboardController extends Controller
{
    public function stats(): void
    {
        $this->requireAuth();
        $db = Database::getConnection();

        $analytics = new AnalyticsModel();
        $analyticsSummary = $analytics->getSummary(30);

        $counts = [
            'categories'      => (int)$db->query('SELECT COUNT(*) FROM categories')->fetchColumn(),
            'finishes'        => (int)$db->query('SELECT COUNT(*) FROM finishes')->fetchColumn(),
            'items'           => (int)$db->query('SELECT COUNT(*) FROM items')->fetchColumn(),
            'groups'          => (int)$db->query('SELECT COUNT(*) FROM catalogue_groups')->fetchColumn(),
            'enquiries'       => (int)$db->query("SELECT COUNT(*) FROM enquiries WHERE status = 'new'")->fetchColumn(),
            'page_views'      => $analyticsSummary['total_views'],
            'pdf_downloads'   => $analyticsSummary['total_downloads'],
            'unique_visitors' => $analyticsSummary['unique_visitors'],
        ];

        $this->success($counts);
    }
}
