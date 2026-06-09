CREATE DATABASE IF NOT EXISTS nac_wifi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE nac_wifi_db;

CREATE TABLE IF NOT EXISTS ads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  target_url VARCHAR(500),
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_id INT NULL,
  mac_address VARCHAR(100),
  ip_address VARCHAR(100),
  access_type ENUM('free','premium') DEFAULT 'free',
  package_name VARCHAR(100),
  amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS guest_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NULL,
  organization VARCHAR(150) NULL,
  contact VARCHAR(150) NOT NULL,
  mac_address VARCHAR(100) NULL,
  ip_address VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  minutes INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0
);

INSERT INTO access_plans (name, minutes, amount, is_active, sort_order) VALUES
('1 Hour', 60, 5.00, 1, 1),
('3 Hours', 180, 10.00, 1, 2),
('1 Day', 1440, 20.00, 1, 3);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT,
  provider VARCHAR(50) DEFAULT 'manual',
  package_name VARCHAR(100),
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  reference_no VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_views (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad_id INT NOT NULL,
  guest_id INT NULL,
  device_ref VARCHAR(150),
  ip_address VARCHAR(100),
  started_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  duration_seconds INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'started',
  token VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_grants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  guest_id INT NULL,
  access_type ENUM('free','premium') NOT NULL,
  ssid VARCHAR(100) NOT NULL,
  wifi_password VARCHAR(100) NOT NULL,
  access_username VARCHAR(100) NOT NULL,
  access_password VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL,
  reference_no VARCHAR(150) NULL,
  expires_at DATETIME NOT NULL,
  token VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wifi_access_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  access_type ENUM('free','premium') NOT NULL,
  ssid VARCHAR(100) NOT NULL,
  wifi_password VARCHAR(100) NOT NULL,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mikrotik_hotspot_contexts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(128) NOT NULL,
  client_mac VARCHAR(32) NULL,
  client_ip VARCHAR(64) NULL,
  link_login TEXT NULL,
  link_login_only TEXT NULL,
  link_orig TEXT NULL,
  error_text TEXT NULL,
  chap_id VARCHAR(64) NULL,
  chap_challenge VARCHAR(255) NULL,
  raw_context LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_session_id (session_id),
  KEY idx_session_id (session_id),
  KEY idx_client_mac (client_mac)
);

INSERT INTO app_settings(setting_key, setting_value) VALUES
('access_provider', 'mikrotik_hotspot'),
('portal_ssid', 'NAC-WiFi-Portal'),
('controller_mode', 'mikrotik_hotspot'),
('controller_admin_url', 'http://192.168.56.254'),
('controller_enforcement_status', 'not_integrated'),
('admin_username', 'admin'),
('admin_password_hash', ''),
('portal_scheme', 'https'),
('local_portal_host', '192.168.88.133:8443'),
('local_portal_path', '/nac_wifi_xampp'),
('portal_logo_path', ''),
('mikrotik_hotspot_username', 'demo'),
('mikrotik_hotspot_password', '1234'),
('unifi_controller_url', ''),
('unifi_api_key', ''),
('unifi_site_id', 'default'),
('free_wifi_ssid', 'NAC-Free'),
('free_wifi_password', 'ChangeMe-Free'),
('premium_wifi_ssid', 'NAC-Premium'),
('premium_wifi_password', 'ChangeMe-VIP'),
('free_access_minutes', '30'),
('access_instructions', 'Your access has been approved. If this page was opened through a MikroTik HotSpot redirect, the router will now authorize this device.')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO ads (title, description, image_url, target_url) VALUES
('Discover PNG', 'Your adventure awaits. Explore Papua New Guinea.', 'assets/ad-png.svg', 'https://www.google.com'),
('Airport Services', 'Fast, simple, and reliable passenger services.', 'assets/ad-airport.svg', 'https://www.google.com');
