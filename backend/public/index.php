<?php
/**
 * AASTRA Architectural Hardware — PHP MVC REST API Front Controller
 */

declare(strict_types=1);

// CORS headers for React frontend (local dev & production)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Serve static uploaded files directly when using PHP built-in dev server
$reqPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
if (str_starts_with($reqPath, '/uploads/')) {
    $filePath = __DIR__ . $reqPath;
    if (is_file($filePath)) {
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mimeMap = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'svg' => 'image/svg+xml',
        ];
        header('Content-Type: ' . ($mimeMap[$ext] ?? 'application/octet-stream'));
        readfile($filePath);
        exit;
    }
}

require_once dirname(__DIR__) . '/config/config.php';
require_once dirname(__DIR__) . '/config/Database.php';
require_once dirname(__DIR__) . '/core/Auth.php';
require_once dirname(__DIR__) . '/core/Model.php';
require_once dirname(__DIR__) . '/core/Controller.php';
require_once dirname(__DIR__) . '/core/Router.php';

// Autoload models & controllers
spl_autoload_register(function (string $class) {
    $base = dirname(__DIR__);
    foreach (['/models/', '/controllers/'] as $dir) {
        $file = $base . $dir . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

$router = new Router();

// Health check
$router->get('/api/health', 'HealthController', 'check');

// Auth
$router->post('/api/auth/login', 'AuthController', 'login');
$router->get('/api/auth/me', 'AuthController', 'me');
$router->post('/api/auth/change-password', 'AuthController', 'changePassword');

// Dashboard
$router->get('/api/dashboard/stats', 'DashboardController', 'stats');

// Categories
$router->get('/api/categories', 'CategoryController', 'index');
$router->get('/api/categories/{id}', 'CategoryController', 'show');
$router->post('/api/categories', 'CategoryController', 'store');
$router->put('/api/categories/{id}', 'CategoryController', 'update');
$router->delete('/api/categories/{id}', 'CategoryController', 'destroy');

// Finishes
$router->get('/api/finishes', 'FinishController', 'index');
$router->get('/api/finishes/{id}', 'FinishController', 'show');
$router->post('/api/finishes', 'FinishController', 'store');
$router->put('/api/finishes/{id}', 'FinishController', 'update');
$router->delete('/api/finishes/{id}', 'FinishController', 'destroy');

// Items
$router->get('/api/items', 'ItemController', 'index');
$router->get('/api/items/{id}', 'ItemController', 'show');
$router->post('/api/items', 'ItemController', 'store');
$router->put('/api/items/{id}', 'ItemController', 'update');
$router->delete('/api/items/{id}', 'ItemController', 'destroy');

// Catalogue PDF Page Groups (e.g. AH.8.06)
$router->get('/api/groups', 'GroupController', 'index');
$router->get('/api/groups/{id}', 'GroupController', 'show');
$router->post('/api/groups', 'GroupController', 'store');
$router->put('/api/groups/{id}', 'GroupController', 'update');
$router->delete('/api/groups/{id}', 'GroupController', 'destroy');

// Uploads
$router->post('/api/upload', 'UploadController', 'upload');

// Enquiries
$router->post('/api/enquiries', 'EnquiryController', 'store');
$router->get('/api/enquiries', 'EnquiryController', 'index');
$router->put('/api/enquiries/{id}', 'EnquiryController', 'updateStatus');

// Inline lightweight HealthController
class HealthController extends Controller
{
    public function check(): void
    {
        $this->success([
            'status' => 'healthy',
            'env'    => APP_ENV,
            'db'     => DB_NAME,
            'time'   => date('c'),
        ]);
    }
}

$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
