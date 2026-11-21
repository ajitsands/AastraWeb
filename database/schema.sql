-- AASTRA Architectural Hardware Database Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.4+
-- Local DB: aastra_db | Production DB: aastra_web_db

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(160) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(40) NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Categories (Chapters & Product Families)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(140) NOT NULL,
  `slug` VARCHAR(160) NOT NULL UNIQUE,
  `section_label` VARCHAR(100) NOT NULL DEFAULT 'ACCESSORIES',
  `side_tab_label` VARCHAR(100) NOT NULL DEFAULT 'DOOR HARDWARE',
  `chapter_number` INT UNSIGNED NOT NULL DEFAULT 1,
  `description` TEXT NULL,
  `image_url` VARCHAR(500) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_categories_chapter` (`chapter_number`),
  INDEX `idx_categories_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Finishes
CREATE TABLE IF NOT EXISTS `finishes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(140) NOT NULL UNIQUE,
  `code` VARCHAR(40) NULL,
  `swatch_hex` VARCHAR(20) NOT NULL DEFAULT '#B8B8B8',
  `swatch_gradient` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_finishes_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Items (Architectural Hardware Products)
CREATE TABLE IF NOT EXISTS `items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `slug` VARCHAR(200) NOT NULL UNIQUE,
  `code` VARCHAR(80) NOT NULL,
  `subtitle` VARCHAR(220) NULL,
  `specifications` TEXT NULL,
  `footnote` VARCHAR(300) NULL DEFAULT '"Special finishes & sizes available upon request subject to minimum order quantity"',
  `material` VARCHAR(120) NULL,
  `images_json` JSON NULL COMMENT 'Array of 1-3 objects: [{url, caption, type: photo|drawing}]',
  `spec_table_json` JSON NULL COMMENT 'Dynamic table with rows, cols, and merged cells (rowSpan, colSpan, isHeader, align)',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_items_category` (`category_id`),
  INDEX `idx_items_code` (`code`),
  INDEX `idx_items_featured` (`is_featured`, `is_active`),
  CONSTRAINT `fk_items_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Item <-> Finishes (Many-to-Many)
CREATE TABLE IF NOT EXISTS `item_finishes` (
  `item_id` INT UNSIGNED NOT NULL,
  `finish_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`item_id`, `finish_id`),
  CONSTRAINT `fk_if_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_if_finish` FOREIGN KEY (`finish_id`) REFERENCES `finishes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Catalogue PDF Page Groups (e.g. AH.8.06)
CREATE TABLE IF NOT EXISTS `catalogue_groups` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `prefix` VARCHAR(16) NOT NULL DEFAULT 'AH',
  `chapter_number` VARCHAR(16) NOT NULL DEFAULT '8',
  `page_number` VARCHAR(16) NOT NULL DEFAULT '01',
  `page_code` VARCHAR(40) NOT NULL UNIQUE COMMENT 'Computed e.g. AH.8.06',
  `section_label` VARCHAR(100) NOT NULL DEFAULT 'ACCESSORIES',
  `category_badge` VARCHAR(120) NOT NULL DEFAULT 'DOOR STOPS',
  `side_tab_label` VARCHAR(100) NOT NULL DEFAULT 'DOOR HARDWARE',
  `layout_mode` ENUM('standard', 'compact') NOT NULL DEFAULT 'standard',
  `show_guarantee_seal` TINYINT(1) NOT NULL DEFAULT 1,
  `footer_website` VARCHAR(140) NOT NULL DEFAULT 'www.aastra.uk',
  `notes` TEXT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_groups_category` (`category_id`),
  CONSTRAINT `fk_groups_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Catalogue Group <-> Items (Ordered membership)
CREATE TABLE IF NOT EXISTS `catalogue_group_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` INT UNSIGNED NOT NULL,
  `item_id` INT UNSIGNED NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_group_item` (`group_id`, `item_id`),
  CONSTRAINT `fk_gi_group` FOREIGN KEY (`group_id`) REFERENCES `catalogue_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_gi_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Trade & Specification Enquiries (Replaces shopping cart)
CREATE TABLE IF NOT EXISTS `enquiries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(140) NOT NULL,
  `company` VARCHAR(160) NULL,
  `email` VARCHAR(160) NOT NULL,
  `phone` VARCHAR(60) NULL,
  `item_code` VARCHAR(80) NULL,
  `subject` VARCHAR(200) NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'reviewed', 'replied') NOT NULL DEFAULT 'new',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Visitor & PDF Download Analytics
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

SET FOREIGN_KEY_CHECKS = 1;
