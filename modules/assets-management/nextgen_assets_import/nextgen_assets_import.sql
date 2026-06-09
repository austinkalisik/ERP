-- Nextgen Assets Management System database import
-- Import this into an EMPTY MySQL database using phpMyAdmin.

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `asset_logs`;
DROP TABLE IF EXISTS `assignments`;
DROP TABLE IF EXISTS `assets`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `migrations`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `receivers`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `system_notifications`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'staff',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `suppliers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `suppliers_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `default_useful_life_years` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `departments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `description` text,
  `category_id` bigint unsigned NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `asset_tag` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `quantity` int unsigned NOT NULL DEFAULT 1,
  `unit_of_measurement` varchar(50) NOT NULL DEFAULT 'unit',
  `reorder_level` int unsigned NOT NULL DEFAULT 5,
  `unit_cost` decimal(12,2) DEFAULT NULL,
  `is_depreciable` tinyint(1) NOT NULL DEFAULT 0,
  `depreciation_method` varchar(255) DEFAULT NULL,
  `useful_life_years` int unsigned DEFAULT NULL,
  `salvage_value` decimal(12,2) DEFAULT NULL,
  `depreciation_start_date` date DEFAULT NULL,
  `status` enum('available','maintenance','lost','retired') NOT NULL DEFAULT 'available',
  `retired_at` timestamp NULL DEFAULT NULL,
  `disposal_value` decimal(12,2) DEFAULT NULL,
  `disposal_reason` varchar(1000) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `items_sku_unique` (`sku`),
  UNIQUE KEY `items_asset_tag_unique` (`asset_tag`),
  UNIQUE KEY `items_serial_number_unique` (`serial_number`),
  KEY `items_category_id_foreign` (`category_id`),
  KEY `items_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `items_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `receivers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receivers_department_id_name_unique` (`department_id`,`name`),
  CONSTRAINT `receivers_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `receiver_id` bigint unsigned DEFAULT NULL,
  `receiver_name` varchar(255) DEFAULT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `quantity` int unsigned NOT NULL DEFAULT 1,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `returned_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignments_item_id_foreign` (`item_id`),
  KEY `assignments_user_id_foreign` (`user_id`),
  KEY `assignments_receiver_id_foreign` (`receiver_id`),
  KEY `assignments_department_id_foreign` (`department_id`),
  CONSTRAINT `assignments_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assignments_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignments_receiver_id_foreign` FOREIGN KEY (`receiver_id`) REFERENCES `receivers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `asset_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `action` varchar(255) NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_logs_item_id_foreign` (`item_id`),
  KEY `asset_logs_user_id_foreign` (`user_id`),
  CONSTRAINT `asset_logs_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `asset_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `priority` varchar(20) NOT NULL DEFAULT 'normal',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `url` varchar(255) DEFAULT NULL,
  `source_type` varchar(255) DEFAULT NULL,
  `source_id` bigint unsigned DEFAULT NULL,
  `data` json DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `system_notifications_user_id_read_at_index` (`user_id`,`read_at`),
  KEY `system_notifications_source_type_source_id_index` (`source_type`,`source_id`),
  KEY `system_notifications_user_id_priority_read_at_index` (`user_id`,`priority`,`read_at`),
  KEY `system_notifications_user_id_type_read_at_index` (`user_id`,`type`,`read_at`),
  CONSTRAINT `system_notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_movements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL,
  `type` enum('IN','OUT','ADJUSTMENT','RETURN','TRANSFER') NOT NULL DEFAULT 'IN',
  `quantity` int NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `supplier_id` bigint unsigned DEFAULT NULL,
  `notes` text,
  `user_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_movements_item_id_type_index` (`item_id`,`type`),
  KEY `stock_movements_created_at_index` (`created_at`),
  KEY `stock_movements_supplier_id_foreign` (`supplier_id`),
  KEY `stock_movements_user_id_foreign` (`user_id`),
  CONSTRAINT `stock_movements_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_movements_supplier_id_foreign` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `stock_movements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) NOT NULL,
  `value` longtext,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `assets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `remember_token`, `created_at`, `updated_at`, `profile_photo`) VALUES
(1, 'System Administrator', 'admin@nextgen.net', NULL, '$2y$10$4iBv0Mvm8OI4iJbLgQd1veyOzz92jank8nXcA/6Po66fu9NebBAUW', 'admin', NULL, NOW(), NOW(), NULL);

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_03_23_060928_create_suppliers_table', 1),
(5, '2026_03_25_012645_create_categories_table', 1),
(6, '2026_03_25_054901_create_departments_table', 1),
(7, '2026_03_26_100000_create_items_table', 1),
(8, '2026_03_26_230921_create_settings_table', 1),
(9, '2026_03_31_225337_create_assignments_table', 1),
(10, '2026_04_04_053332_create_asset_logs_table', 1),
(11, '2026_04_08_225706_create_system_notifications_table', 1),
(12, '2026_04_10_043836_add_assigned_department_id_to_assignments_table', 1),
(13, '2026_04_13_032128_add_profile_photo_to_users_table', 1),
(14, '2026_04_14_025350_add_notes_to_asset_logs_table', 1),
(15, '2026_04_16_053154_add_address_to_suppliers_table', 1),
(16, '2026_04_16_060752_add_sku_to_items_table', 1),
(17, '2026_04_16_220525_add_description_to_departments_table', 1),
(18, '2026_04_20_000001_create_stock_movements_table', 1),
(19, '2026_04_20_000002_add_fields_to_items_table', 1),
(20, '2026_04_20_062327_add_quantity_and_receiver_name_to_assignments_table', 1),
(21, '2026_04_20_062932_remove_department_id_from_items_table', 1),
(22, '2026_04_21_000509_add_profile_photo_column_to_users_table', 1),
(23, '2026_04_21_050639_make_user_id_nullable_on_assignments_table', 1),
(24, '2026_04_22_224916_create_assets_table', 1),
(25, '2026_04_23_000001_upgrade_system_notifications_table', 1),
(26, '2026_04_24_120000_add_depreciation_fields_to_items_table', 1),
(27, '2026_04_27_000001_add_financial_lifecycle_fields', 1),
(28, '2026_04_27_000002_create_receivers_table', 1),
(29, '2026_04_27_000003_add_unit_of_measurement_to_items_table', 1),
(30, '2026_04_27_000004_normalize_non_depreciable_items', 1),
(31, '2026_05_21_070000_add_role_to_users_if_missing', 1);

SET FOREIGN_KEY_CHECKS = 1;
