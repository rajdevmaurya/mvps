-- ============================================
-- ECHO HEALTHCARE - QUICK REFERENCE QUERIES
-- ============================================

-- ==========================================
-- 1. FINDING LOWEST PRICE PRODUCTS
-- ==========================================

-- Get all products with lowest price vendor
SELECT * FROM vw_lowest_price_products;

-- Get lowest price for specific product
SELECT * FROM vw_lowest_price_products 
WHERE product_name LIKE '%Paracetamol%';

-- Get lowest price products under ₹100
SELECT * FROM vw_lowest_price_products 
WHERE final_price < 100;

-- Get lowest price products with good stock (>50 units)
SELECT * FROM vw_lowest_price_products 
WHERE stock_quantity > 50;


-- ==========================================
-- 2. PRICE COMPARISON
-- ==========================================

-- Compare all vendor prices for one product
SELECT * FROM vw_product_price_comparison
WHERE product_name = 'Paracetamol 500mg';

-- See which vendors are cheapest most often
SELECT vendor_name, products_with_lowest_price
FROM vw_vendor_performance
ORDER BY products_with_lowest_price DESC;


-- ==========================================
-- 3. SEARCH PRODUCTS
-- ==========================================

-- Search by product name
SELECT * FROM vw_lowest_price_products
WHERE product_name LIKE '%Vitamin%';

-- Search by category
SELECT 
    pm.product_name,
    pc.category_name,
    vp.final_price,
    v.vendor_name
FROM products_master pm
JOIN product_categories pc ON pm.category_id = pc.category_id
JOIN vendor_products vp ON pm.product_id = vp.product_id
JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE pc.category_name = 'Medicines'
ORDER BY vp.final_price;


-- ==========================================
-- 4. VENDOR INFORMATION
-- ==========================================

-- List all active vendors
SELECT vendor_id, vendor_name, phone, email, city 
FROM vendors 
WHERE is_active = TRUE;

-- Get vendor's complete product catalog
SELECT 
    v.vendor_name,
    pm.product_name,
    vp.cost_price,
    vp.discount_percentage,
    vp.final_price,
    vp.stock_quantity
FROM vendors v
JOIN vendor_products vp ON v.vendor_id = vp.vendor_id
JOIN products_master pm ON vp.product_id = pm.product_id
WHERE v.vendor_id = 1  -- Change vendor_id as needed
ORDER BY vp.final_price;

-- Vendor performance summary
SELECT * FROM vw_vendor_performance;


-- ==========================================
-- 5. STOCK MANAGEMENT
-- ==========================================

-- Check total stock across all vendors for a product
SELECT 
    pm.product_name,
    SUM(vp.stock_quantity) as total_stock,
    COUNT(vp.vendor_id) as vendors_carrying_product,
    MIN(vp.final_price) as lowest_price
FROM products_master pm
JOIN vendor_products vp ON pm.product_id = vp.product_id
WHERE pm.product_id = 1  -- Change product_id
GROUP BY pm.product_id, pm.product_name;

-- Low stock alert (less than 50 units)
SELECT 
    pm.product_name,
    v.vendor_name,
    vp.stock_quantity,
    vp.final_price
FROM vendor_products vp
JOIN products_master pm ON vp.product_id = pm.product_id
JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE vp.stock_quantity < 50 
  AND vp.is_available = TRUE
ORDER BY vp.stock_quantity;

-- Products near expiry (within 30 days)
SELECT 
    pm.product_name,
    v.vendor_name,
    vp.stock_quantity,
    vp.expiry_date,
    DATEDIFF(vp.expiry_date, CURRENT_DATE) as days_to_expiry
FROM vendor_products vp
JOIN products_master pm ON vp.product_id = pm.product_id
JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE vp.expiry_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)
ORDER BY vp.expiry_date;


-- Stock movement history for a vendor product
SELECT 
    vsm.movement_id,
    vsm.vendor_product_id,
    pm.product_name,
    v.vendor_name,
    vsm.previous_quantity,
    vsm.new_quantity,
    vsm.change_amount,
    vsm.changed_at
FROM vendor_stock_movements vsm
JOIN vendor_products vp ON vsm.vendor_product_id = vp.vendor_product_id
JOIN products_master pm ON vp.product_id = pm.product_id
JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE vsm.vendor_product_id = 1
ORDER BY vsm.changed_at DESC;


-- ==========================================
-- 6. PLACING ORDERS
-- ==========================================

-- Step 1: Find best prices for required products
SELECT 
    vendor_product_id,
    product_id,
    vendor_id,
    product_name,
    vendor_name,
    final_price,
    stock_quantity
FROM vw_lowest_price_products
WHERE product_id IN (1, 2, 3)  -- Products customer wants
  AND stock_quantity >= 10;     -- Minimum quantity needed

-- Step 2: Create order (replace values as needed)
INSERT INTO orders (
    customer_id, 
    order_number, 
    order_type, 
    total_amount, 
    final_amount,
    payment_status,
    order_status
) VALUES (
    1,                      -- customer_id
    'ORD-2026-001',        -- order_number (make unique)
    'online',              -- 'online' or 'door_to_door'
    500.00,                -- total_amount
    500.00,                -- final_amount
    'pending',             -- payment_status
    'pending'              -- order_status
);

-- Step 3: Add items to order
SET @order_id = LAST_INSERT_ID();

INSERT INTO order_items (
    order_id, vendor_product_id, product_id, vendor_id, 
    quantity, unit_price, line_total
)
VALUES
(@order_id, 1, 1, 1, 10, 25.00, 250.00),
(@order_id, 3, 2, 1, 5, 280.00, 1400.00);


-- ==========================================
-- 7. ORDER TRACKING
-- ==========================================

-- View order details
SELECT 
    o.order_number,
    o.order_date,
    c.customer_name,
    c.phone,
    o.order_type,
    o.final_amount,
    o.payment_status,
    o.order_status
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_number = 'ORD-2026-001';

-- View order items with product and vendor details
SELECT 
    o.order_number,
    pm.product_name,
    v.vendor_name,
    oi.quantity,
    oi.unit_price,
    oi.line_total
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN products_master pm ON oi.product_id = pm.product_id
JOIN vendors v ON oi.vendor_id = v.vendor_id
WHERE o.order_number = 'ORD-2026-001';

-- Update order status
UPDATE orders 
SET order_status = 'delivered',
    payment_status = 'paid'
WHERE order_number = 'ORD-2026-001';


-- ==========================================
-- 8. SALES REPORTS
-- ==========================================

-- Today's sales
SELECT 
    COUNT(*) as total_orders,
    SUM(final_amount) as total_revenue,
    AVG(final_amount) as avg_order_value
FROM orders
WHERE DATE(order_date) = CURRENT_DATE;

-- Sales by order type (last 7 days)
SELECT 
    order_type,
    COUNT(*) as orders,
    SUM(final_amount) as revenue
FROM orders
WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
GROUP BY order_type;

-- Top 10 selling products (last 30 days)
SELECT 
    pm.product_name,
    SUM(oi.quantity) as units_sold,
    SUM(oi.line_total) as revenue
FROM order_items oi
JOIN products_master pm ON oi.product_id = pm.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY pm.product_id, pm.product_name
ORDER BY revenue DESC
LIMIT 10;

-- Revenue by vendor (last 30 days)
SELECT 
    v.vendor_name,
    COUNT(DISTINCT oi.order_id) as orders,
    SUM(oi.quantity) as units_sold,
    SUM(oi.line_total) as revenue
FROM order_items oi
JOIN vendors v ON oi.vendor_id = v.vendor_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY v.vendor_id, v.vendor_name
ORDER BY revenue DESC;


-- ==========================================
-- 9. CUSTOMER MANAGEMENT
-- ==========================================

-- Add new customer
INSERT INTO customers (
    customer_name, email, phone, address, 
    city, state, pincode, customer_type
) VALUES (
    'Rahul Verma',
    'rahul@email.com',
    '9876543220',
    '123 MG Road',
    'Pune',
    'Maharashtra',
    '411001',
    'retail'
);

-- View customer order history
SELECT 
    o.order_number,
    o.order_date,
    o.final_amount,
    o.order_status,
    o.payment_status
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.phone = '9876543220'
ORDER BY o.order_date DESC;

-- Top customers (by revenue)
SELECT 
    c.customer_name,
    c.phone,
    c.customer_type,
    COUNT(o.order_id) as total_orders,
    SUM(o.final_amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id
ORDER BY total_spent DESC
LIMIT 10;


-- ==========================================
-- 10. ADDING NEW DATA
-- ==========================================

-- Add new vendor
INSERT INTO vendors (
    vendor_name, contact_person, email, phone, 
    city, state, gst_number, is_active
) VALUES (
    'ABC Medical Suppliers',
    'Vijay Kumar',
    'vijay@abc.com',
    '9876543299',
    'Chennai',
    'Tamil Nadu',
    '33AABCU9603R1ZZ',
    TRUE
);

-- Add new product to master
INSERT INTO products_master (
    product_name, generic_name, category_id, 
    manufacturer, unit_of_measure, prescription_required
) VALUES (
    'Azithromycin 500mg',
    'Azithromycin',
    1,  -- Medicine category
    'Alkem Laboratories',
    'strip',
    TRUE
);

-- Link product to vendor with pricing
INSERT INTO vendor_products (
    vendor_id, product_id, vendor_sku, 
    cost_price, mrp, discount_percentage, 
    stock_quantity, is_available
) VALUES (
    1,          -- vendor_id
    11,         -- product_id (new product)
    'V1-AZITH500',
    120.00,     -- cost_price
    150.00,     -- mrp
    10,         -- discount_percentage
    200,        -- stock_quantity
    TRUE
);


-- ==========================================
-- 11. PRICE UPDATES
-- ==========================================

-- Update vendor product price
UPDATE vendor_products
SET cost_price = 22.00,
    discount_percentage = 12
WHERE vendor_id = 1 AND product_id = 1;

-- Bulk discount update for a vendor
UPDATE vendor_products
SET discount_percentage = 15
WHERE vendor_id = 2;


-- ==========================================
-- 12. MAINTENANCE QUERIES
-- ==========================================

-- Mark expired products as unavailable
UPDATE vendor_products
SET is_available = FALSE
WHERE expiry_date < CURRENT_DATE;

-- Mark out-of-stock products as unavailable
UPDATE vendor_products
SET is_available = FALSE
WHERE stock_quantity = 0;

-- Deactivate inactive vendors
UPDATE vendors
SET is_active = FALSE
WHERE vendor_id = 5;  -- Replace with actual vendor_id


-- ==========================================
-- 13. USEFUL AGGREGATIONS
-- ==========================================

-- Product availability count
SELECT 
    pm.product_name,
    COUNT(DISTINCT vp.vendor_id) as number_of_vendors,
    MIN(vp.final_price) as lowest_price,
    MAX(vp.final_price) as highest_price,
    AVG(vp.final_price) as avg_price
FROM products_master pm
LEFT JOIN vendor_products vp ON pm.product_id = vp.product_id
WHERE vp.is_available = TRUE
GROUP BY pm.product_id, pm.product_name
ORDER BY number_of_vendors DESC;

-- Category-wise inventory
SELECT 
    pc.category_name,
    COUNT(DISTINCT pm.product_id) as unique_products,
    SUM(vp.stock_quantity) as total_stock,
    AVG(vp.final_price) as avg_price
FROM product_categories pc
JOIN products_master pm ON pc.category_id = pm.category_id
JOIN vendor_products vp ON pm.product_id = vp.product_id
WHERE vp.is_available = TRUE
GROUP BY pc.category_id, pc.category_name;


-- ==========================================
-- 14. VENDOR COMPARISON
-- ==========================================

-- Which vendor offers most competitive prices?
SELECT 
    v.vendor_name,
    COUNT(*) as total_products,
    AVG(vp.final_price) as avg_price,
    SUM(CASE WHEN vp.final_price = (
        SELECT MIN(vp2.final_price)
        FROM vendor_products vp2
        WHERE vp2.product_id = vp.product_id
          AND vp2.is_available = TRUE
    ) THEN 1 ELSE 0 END) as times_cheapest
FROM vendors v
JOIN vendor_products vp ON v.vendor_id = vp.vendor_id
WHERE vp.is_available = TRUE
GROUP BY v.vendor_id, v.vendor_name
ORDER BY times_cheapest DESC;

