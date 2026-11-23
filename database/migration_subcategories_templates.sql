-- AASTRA Architectural Hardware — Sub Categories & PDF Specification Templates Migration
-- Safe to run on existing local (aastra_db) or production (aastra_web_db) databases

SET NAMES utf8mb4;

-- 1. Sub Categories Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
