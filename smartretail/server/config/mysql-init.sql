-- server/config/mysql-init.sql
CREATE DATABASE IF NOT EXISTS smartretail_tx;
USE smartretail_tx;

CREATE TABLE IF NOT EXISTS transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tx_id       VARCHAR(36) NOT NULL UNIQUE,
  terminal_id VARCHAR(20) NOT NULL,
  zone        VARCHAR(50),
  total       DECIMAL(10,2) NOT NULL,
  items_count INT DEFAULT 1,
  payment_method ENUM('cash','card','upi','wallet') DEFAULT 'card',
  cashier_id  VARCHAR(20),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_terminal (terminal_id),
  INDEX idx_created  (created_at)
);

CREATE TABLE IF NOT EXISTS sales_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tx_id          VARCHAR(36) NOT NULL,
  sku            VARCHAR(50) NOT NULL,
  product_name   VARCHAR(120) NOT NULL,
  category       VARCHAR(50),
  quantity       INT DEFAULT 1,
  unit_price     DECIMAL(10,2) NOT NULL,
  discount_pct   DECIMAL(5,2)  DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tx   (tx_id),
  INDEX idx_sku  (sku),
  FOREIGN KEY    (tx_id) REFERENCES transactions(tx_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS staff (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    VARCHAR(20) NOT NULL UNIQUE,
  name        VARCHAR(80) NOT NULL,
  role        ENUM('cashier','floor','security','supervisor','manager') DEFAULT 'floor',
  zone        VARCHAR(50),
  shift       ENUM('morning','afternoon','night') DEFAULT 'morning',
  status      ENUM('active','break','off') DEFAULT 'active',
  clock_in    TIMESTAMP NULL,
  clock_out   TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pricing_rules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  sku         VARCHAR(50) NOT NULL,
  base_price  DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  rule_type   ENUM('competitor','demand','clearance','promo') DEFAULT 'promo',
  valid_until TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO staff (staff_id, name, role, zone, shift, status, clock_in) VALUES
  ('S001','Arjun Sharma','cashier','Checkout','morning','active',NOW()),
  ('S002','Priya Nair','floor','Electronics','morning','active',NOW()),
  ('S003','Ravi Kumar','supervisor','Entrance','morning','active',NOW()),
  ('S004','Meena Patel','cashier','Checkout','afternoon','off',NULL),
  ('S005','Suresh Iyer','security','Exit','morning','active',NOW());
