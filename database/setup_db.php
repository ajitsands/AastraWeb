<?php
/**
 * One-command MySQL Database Setup & Seeder for AASTRA Architectural Hardware
 * Usage: php database/setup_db.php
 */

require_once dirname(__DIR__) . '/backend/config/config.php';

echo "Connecting to MySQL at " . DB_HOST . " as " . DB_USER . "...\n";

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;port=%s;charset=utf8mb4', DB_HOST, DB_PORT),
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");
    echo "Database `" . DB_NAME . "` ready.\n";

    $schema = file_get_contents(__DIR__ . '/schema.sql');
    $pdo->exec($schema);
    echo "Schema imported successfully.\n";

    $seed = file_get_contents(__DIR__ . '/seed.sql');
    $pdo->exec($seed);
    echo "Sample data seeded successfully!\n";
    echo "Default Admin Login: admin@aastra.uk / Aastra@2026\n";
} catch (PDOException $e) {
    fwrite(STDERR, "Setup failed: " . $e->getMessage() . "\n");
    exit(1);
}
