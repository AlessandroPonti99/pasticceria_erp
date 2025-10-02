
CREATE DATABASE IF NOT EXISTS pasticceria_erp;
USE pasticceria_erp;

-- Utenti
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'base') DEFAULT 'base'
);

-- Prodotti
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  category VARCHAR(50),
  unit_price DECIMAL(10,2),
  unit VARCHAR(20)
);

-- Movimenti di magazzino
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  movement_type ENUM('IN', 'OUT'),
  quantity DECIMAL(10,2),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Vendite
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  quantity INT,
  sale_date DATE,
  total_price DECIMAL(10,2),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Fornitori
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  contact_info TEXT
);

-- Ordini di acquisto
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT,
  order_date DATE,
  status ENUM('ordered', 'received') DEFAULT 'ordered',
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT,
  product_id INT,
  quantity INT,
  unit_price DECIMAL(10,2),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Transazioni contabili
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense'),
  amount DECIMAL(10,2),
  category VARCHAR(100),
  date DATE,
  description TEXT
);

-- Ricette di produzione
CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT,
  ingredient_id INT,
  quantity DECIMAL(10,2),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id),
  FOREIGN KEY (ingredient_id) REFERENCES products(id)
);

-- Log produzione
CREATE TABLE IF NOT EXISTS production_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT,
  quantity INT,
  production_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Dipendenti e HR
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  role VARCHAR(100),
  hire_date DATE,
  hourly_rate DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  shift_date DATE,
  start_time TIME,
  end_time TIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT,
  date DATE,
  status ENUM('present', 'absent', 'sick', 'vacation'),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
