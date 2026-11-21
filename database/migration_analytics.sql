-- AASTRA Architectural Hardware — Visitor & PDF Download Analytics Table
-- Safe to run on existing local (aastra_db) or production (aastra_web_db) databases

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
