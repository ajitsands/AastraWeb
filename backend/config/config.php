<?php
/**
 * AASTRA Architectural Hardware — Environment & Database Configuration
 * Auto-detects Local (localhost) vs Production (aastra.uk)
 */

$host = $_SERVER['HTTP_HOST'] ?? '';
$isProduction = (stripos($host, 'aastra.uk') !== false)
    || (stripos(__DIR__, '/home/aastra') !== false)
    || (function_exists('get_current_user') && get_current_user() === 'aastra')
    || (getenv('APP_ENV') === 'production');

if ($isProduction) {
    define('APP_ENV', 'production');
    define('APP_URL', 'https://aastra.uk');
    define('DB_HOST', 'localhost');
    define('DB_PORT', '3306');
    define('DB_NAME', 'aastra_web_db');
    define('DB_USER', 'aastra_web_user');
    define('DB_PASS', 'S@nds1@b');
} else {
    define('APP_ENV', 'local');
    define('APP_URL', 'http://localhost:8000');
    define('DB_HOST', 'localhost');
    define('DB_PORT', '3306');
    define('DB_NAME', 'aastra_db');
    define('DB_USER', 'root');
    define('DB_PASS', 'S@nds1@b');
}

define('JWT_SECRET', 'AASTRA_HW_SECRET_KEY_2026_UK_9f8e7d6c5b4a');
define('JWT_EXPIRY_SECONDS', 86400 * 7); // 7 days
define('UPLOAD_DIR', dirname(__DIR__) . '/public/uploads/');
define('MAX_UPLOAD_SIZE', 8 * 1024 * 1024); // 8MB
