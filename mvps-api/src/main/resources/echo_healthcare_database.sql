-- Echo Healthcare Database Schema
-- Multi-Vendor Product Management System

-- ============================================
-- 1. VENDORS TABLE
-- ============================================
CREATE TABLE vendors (
    vendor_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gst_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vendor_active (is_active),
    INDEX idx_vendor_name (vendor_name)
);

-- ============================================
-- 2. PRODUCT CATEGORIES TABLE
-- ============================================
CREATE TABLE product_categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_category_id) REFERENCES product_categories(category_id),
    INDEX idx_category_name (category_name)
);

-- ============================================
-- 3. PRODUCTS MASTER TABLE
-- ============================================
CREATE TABLE products_master (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category_id INT,
    description TEXT,
    manufacturer VARCHAR(255),
    hsn_code VARCHAR(20),
    unit_of_measure VARCHAR(50), -- e.g., 'box', 'strip', 'bottle', 'piece'
    prescription_required BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(category_id),
    INDEX idx_product_name (product_name),
    INDEX idx_active (is_active)
);

-- ============================================
-- 4. VENDOR PRODUCTS TABLE (Core pricing table)
-- ============================================
CREATE TABLE vendor_products (
    vendor_product_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    product_id INT NOT NULL,
    vendor_sku VARCHAR(100), -- Vendor's own product code
    cost_price DECIMAL(10,2) NOT NULL, -- Price vendor charges you
    mrp DECIMAL(10,2), -- Maximum Retail Price
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) GENERATED ALWAYS AS (cost_price * (1 - discount_percentage/100)) STORED,
    minimum_order_quantity INT DEFAULT 1,
    stock_quantity INT DEFAULT 0,
    expiry_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    delivery_time_days INT DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    FOREIGN KEY (product_id) REFERENCES products_master(product_id),
    UNIQUE KEY unique_vendor_product (vendor_id, product_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_product (product_id),
    INDEX idx_final_price (final_price),
    INDEX idx_available (is_available)
);

-- ============================================
-- 5. CUSTOMERS TABLE
-- ============================================
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    customer_type ENUM('retail', 'wholesale', 'institution') DEFAULT 'retail',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_phone (phone),
    INDEX idx_customer_type (customer_type)
);

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    order_type ENUM('online', 'door_to_door') NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'partial', 'failed') DEFAULT 'pending',
    order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    INDEX idx_order_number (order_number),
    INDEX idx_order_date (order_date),
    INDEX idx_order_status (order_status)
);

-- ============================================
-- 7. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    vendor_product_id INT NOT NULL,
    product_id INT NOT NULL,
    vendor_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(vendor_product_id),
    FOREIGN KEY (product_id) REFERENCES products_master(product_id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    INDEX idx_order (order_id),
    INDEX idx_vendor (vendor_id)
);

-- ============================================
-- 8. VENDOR ORDERS TABLE (Purchase Orders)
-- ============================================
CREATE TABLE vendor_orders (
    vendor_order_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'received', 'cancelled') DEFAULT 'pending',
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id),
    INDEX idx_vendor (vendor_id),
    INDEX idx_status (status)
);

-- ============================================
-- 9. VENDOR STOCK MOVEMENTS TABLE (Audit log)
-- ============================================
CREATE TABLE vendor_stock_movements (
    movement_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_product_id INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    change_amount INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(vendor_product_id),
    INDEX idx_vendor_product (vendor_product_id),
    INDEX idx_changed_at (changed_at)
);

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert sample vendors
INSERT INTO vendors (vendor_name, contact_person, email, phone, city, state, gst_number, is_active) VALUES
('MediSupply India Pvt Ltd', 'Rajesh Kumar', 'rajesh@medisupply.com', '9876543210', 'Mumbai', 'Maharashtra', '27AABCU9603R1ZV', TRUE),
('HealthCare Distributors', 'Priya Sharma', 'priya@healthcare.com', '9876543211', 'Delhi', 'Delhi', '07AABCU9603R1ZW', TRUE),
('Pharma Solutions', 'Amit Patel', 'amit@pharmasol.com', '9876543212', 'Pune', 'Maharashtra', '27AABCU9603R1ZX', TRUE);

-- Insert product categories
INSERT INTO product_categories (category_name, description) VALUES
('Medicines', 'Pharmaceutical medicines and drugs'),
('Medical Devices', 'Medical equipment and devices'),
('Supplements', 'Health supplements and vitamins'),
('Personal Care', 'Personal healthcare products'),
('Surgical Items', 'Surgical instruments and supplies');

-- Insert sample products
INSERT INTO products_master (product_name, generic_name, category_id, manufacturer, unit_of_measure, prescription_required) VALUES
('Paracetamol 500mg', 'Paracetamol', 1, 'Cipla Ltd', 'strip', FALSE),
('Digital Thermometer', 'Thermometer', 2, 'Omron', 'piece', FALSE),
('Vitamin D3 60K', 'Cholecalciferol', 3, 'Sun Pharma', 'capsule', FALSE),
('Blood Pressure Monitor', 'BP Monitor', 2, 'Dr. Morepen', 'piece', FALSE),
('Dolo 650mg', 'Paracetamol', 1, 'Micro Labs', 'strip', FALSE),
('Insulin Syringe', 'Disposable Syringe', 5, 'BD', 'piece', TRUE),
('Multivitamin Tablets', 'Multivitamin', 3, 'HealthVit', 'bottle', FALSE),
('Hand Sanitizer 500ml', 'Sanitizer', 4, 'Dettol', 'bottle', FALSE),
('Surgical Mask N95', 'Face Mask', 4, '3M', 'piece', FALSE),
('Glucometer Kit', 'Blood Glucose Monitor', 2, 'Accu-Chek', 'piece', FALSE);

-- Insert vendor products (with different prices from different vendors)
-- Vendor 1 products (10 products)
INSERT INTO vendor_products (vendor_id, product_id, vendor_sku, cost_price, mrp, discount_percentage, stock_quantity, is_available) VALUES
(1, 1, 'V1-PAR500', 25.00, 30.00, 5, 500, TRUE),
(1, 2, 'V1-THERM', 280.00, 350.00, 10, 100, TRUE),
(1, 3, 'V1-VITD', 85.00, 100.00, 0, 200, TRUE),
(1, 4, 'V1-BPM', 1200.00, 1500.00, 15, 50, TRUE),
(1, 5, 'V1-DOL650', 28.00, 35.00, 0, 300, TRUE),
(1, 6, 'V1-INSYR', 8.00, 10.00, 10, 1000, TRUE),
(1, 7, 'V1-MULTI', 350.00, 400.00, 5, 150, TRUE),
(1, 8, 'V1-SANI', 180.00, 200.00, 10, 200, TRUE),
(1, 9, 'V1-MASK', 45.00, 50.00, 0, 500, TRUE),
(1, 10, 'V1-GLUC', 950.00, 1200.00, 12, 80, TRUE);

-- Vendor 2 products (Same products but different prices - competition)
INSERT INTO vendor_products (vendor_id, product_id, vendor_sku, cost_price, mrp, discount_percentage, stock_quantity, is_available) VALUES
(2, 1, 'V2-PAR500', 23.00, 30.00, 8, 800, TRUE),  -- CHEAPER than Vendor 1
(2, 2, 'V2-THERM', 295.00, 350.00, 5, 80, TRUE),   -- More expensive
(2, 3, 'V2-VITD', 82.00, 100.00, 5, 300, TRUE),    -- CHEAPER
(2, 4, 'V2-BPM', 1250.00, 1500.00, 10, 60, TRUE),  -- More expensive
(2, 5, 'V2-DOL650', 26.00, 35.00, 5, 500, TRUE),   -- CHEAPER
(2, 6, 'V2-INSYR', 7.50, 10.00, 8, 1500, TRUE),    -- CHEAPER
(2, 7, 'V2-MULTI', 360.00, 400.00, 8, 120, TRUE),  -- More expensive
(2, 8, 'V2-SANI', 175.00, 200.00, 12, 250, TRUE),  -- CHEAPER
(2, 9, 'V2-MASK', 42.00, 50.00, 5, 600, TRUE),     -- CHEAPER
(2, 10, 'V2-GLUC', 980.00, 1200.00, 10, 70, TRUE); -- More expensive

-- Vendor 3 products (subset with competitive pricing)
INSERT INTO vendor_products (vendor_id, product_id, vendor_sku, cost_price, mrp, discount_percentage, stock_quantity, is_available) VALUES
(3, 1, 'V3-PAR500', 24.00, 30.00, 10, 600, TRUE),  -- Middle pricing
(3, 3, 'V3-VITD', 80.00, 100.00, 8, 250, TRUE),    -- CHEAPEST
(3, 5, 'V3-DOL650', 27.00, 35.00, 7, 400, TRUE),   -- Middle pricing
(3, 8, 'V3-SANI', 170.00, 200.00, 15, 300, TRUE),  -- CHEAPEST
(3, 9, 'V3-MASK', 40.00, 50.00, 10, 700, TRUE);    -- CHEAPEST

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Query 1: Get lowest price vendor for each product
CREATE VIEW vw_lowest_price_products AS
SELECT 
    pm.product_id,
    pm.product_name,
    pm.generic_name,
    vp.vendor_product_id,
    v.vendor_id,
    v.vendor_name,
    vp.cost_price,
    vp.discount_percentage,
    vp.final_price,
    vp.stock_quantity,
    vp.is_available
FROM products_master pm
INNER JOIN vendor_products vp ON pm.product_id = vp.product_id
INNER JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE vp.is_available = TRUE 
  AND v.is_active = TRUE
  AND vp.stock_quantity > 0
  AND vp.final_price = (
      SELECT MIN(vp2.final_price)
      FROM vendor_products vp2
      WHERE vp2.product_id = pm.product_id
        AND vp2.is_available = TRUE
        AND vp2.stock_quantity > 0
  )
ORDER BY pm.product_name;

-- Query 2: Get all products with all vendor prices (for comparison)
CREATE VIEW vw_product_price_comparison AS
SELECT 
    pm.product_id,
    pm.product_name,
    v.vendor_id,
    v.vendor_name,
    vp.cost_price,
    vp.discount_percentage,
    vp.final_price,
    vp.stock_quantity,
    vp.is_available,
    CASE 
        WHEN vp.final_price = (
            SELECT MIN(vp2.final_price)
            FROM vendor_products vp2
            WHERE vp2.product_id = pm.product_id
              AND vp2.is_available = TRUE
        ) THEN 'LOWEST PRICE'
        ELSE ''
    END AS price_status
FROM products_master pm
LEFT JOIN vendor_products vp ON pm.product_id = vp.product_id
LEFT JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE vp.is_available = TRUE
ORDER BY pm.product_name, vp.final_price;

-- Query 3: Vendor performance summary
CREATE VIEW vw_vendor_performance AS
SELECT 
    v.vendor_id,
    v.vendor_name,
    COUNT(vp.vendor_product_id) AS total_products,
    AVG(vp.final_price) AS avg_price,
    SUM(vp.stock_quantity) AS total_stock,
    COUNT(CASE WHEN vp.final_price = (
        SELECT MIN(vp2.final_price)
        FROM vendor_products vp2
        WHERE vp2.product_id = vp.product_id
    ) THEN 1 END) AS products_with_lowest_price
FROM vendors v
LEFT JOIN vendor_products vp ON v.vendor_id = vp.vendor_id
WHERE v.is_active = TRUE AND vp.is_available = TRUE
GROUP BY v.vendor_id, v.vendor_name;

