-- ============================================================================
-- Performance Optimization Indexes for MVPS Database
-- ============================================================================
-- Purpose: Add missing indexes to improve query performance for high-volume data
-- Created: 2026-02-14
-- Priority: HIGH - Apply these indexes before production deployment
-- ============================================================================

USE echo_healthcare_db;

-- ============================================================================
-- 1. ORDERS TABLE - Composite Index for Multi-Column Filtering
-- ============================================================================
-- Queries filter on customer_id, order_status, payment_status, and order_date together
-- This composite index dramatically improves performance of order search queries
--
-- Query Pattern: WHERE customer_id = ? AND order_status = ? AND order_date BETWEEN ? AND ?
-- Impact: Reduces query time from O(n) to O(log n) for filtered order searches
--
CREATE INDEX IF NOT EXISTS idx_order_customer_status_date
ON orders(customer_id, order_status, order_date);

-- Additional index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_order_payment_status
ON orders(payment_status);

-- Composite index for order type and status filtering
CREATE INDEX IF NOT EXISTS idx_order_type_status
ON orders(order_type, order_status);


-- ============================================================================
-- 2. PRODUCTS_MASTER TABLE - Category and Search Optimization
-- ============================================================================
-- Many queries filter products by category, which currently requires full table scan
--
-- Query Pattern: WHERE category_id = ? AND is_active = ?
-- Impact: Essential for category filtering performance on product catalog pages
--
CREATE INDEX IF NOT EXISTS idx_product_category_active
ON products_master(category_id, is_active);

-- Improve LIKE search performance (though full-text search is recommended)
CREATE INDEX IF NOT EXISTS idx_product_generic_name
ON products_master(generic_name);

-- Full-text search indexes for better search performance
-- These replace the inefficient LIKE '%search%' pattern
ALTER TABLE products_master ADD FULLTEXT INDEX idx_product_fulltext_search (product_name, generic_name);


-- ============================================================================
-- 3. CUSTOMERS TABLE - Search and Filter Optimization
-- ============================================================================
-- Customer searches query name, email, and phone with LIKE patterns
-- Current setup has no search optimization
--
-- Query Pattern: WHERE customer_type = ? AND city = ? AND (name LIKE '%?' OR email LIKE '%?')
-- Impact: Critical for customer lookup and search functionality
--
CREATE INDEX IF NOT EXISTS idx_customer_city
ON customers(city);

CREATE INDEX IF NOT EXISTS idx_customer_type_active
ON customers(customer_type, is_active);

-- Full-text search for customers
ALTER TABLE customers ADD FULLTEXT INDEX idx_customer_fulltext_search (customer_name, email);


-- ============================================================================
-- 4. VENDOR_PRODUCTS TABLE - Multi-Column Query Optimization
-- ============================================================================
-- Vendor product queries filter on vendor_id, product_id, and availability together
-- Price comparison queries benefit from composite indexes
--
-- Query Pattern: WHERE vendor_id = ? AND product_id = ? AND is_available = ?
-- Impact: Dramatically improves vendor product lookup and price comparison queries
--
CREATE INDEX IF NOT EXISTS idx_vp_vendor_product_available
ON vendor_products(vendor_id, product_id, is_available);

-- For lowest price queries that filter on availability and sort by price
CREATE INDEX IF NOT EXISTS idx_vp_available_price
ON vendor_products(is_available, vendor_price);

-- For product-centric price comparisons
CREATE INDEX IF NOT EXISTS idx_vp_product_available_price
ON vendor_products(product_id, is_available, vendor_price);


-- ============================================================================
-- 5. ORDER_ITEMS TABLE - Order Details Query Optimization
-- ============================================================================
-- When loading order details, the system fetches all items for an order
-- The existing idx_order helps, but a composite index is more efficient
--
-- Query Pattern: SELECT * FROM order_items WHERE order_id = ? (with JOINs to product/vendor)
-- Impact: Improves order details page load time
--
CREATE INDEX IF NOT EXISTS idx_orderitem_order_product
ON order_items(order_id, product_id);

CREATE INDEX IF NOT EXISTS idx_orderitem_product
ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_orderitem_vendor_product
ON order_items(vendor_id, product_id);


-- ============================================================================
-- 6. VENDOR_ORDERS TABLE - Purchase Order Query Optimization
-- ============================================================================
-- Vendor orders queries filter on vendor_id, order_status, and dates
--
-- Query Pattern: WHERE vendor_id = ? AND order_status = ? AND order_date BETWEEN ? AND ?
-- Impact: Improves vendor order search and filtering
--
CREATE INDEX IF NOT EXISTS idx_vendor_order_vendor_status_date
ON vendor_orders(vendor_id, order_status, order_date);

CREATE INDEX IF NOT EXISTS idx_vendor_order_status
ON vendor_orders(order_status);


-- ============================================================================
-- 7. PRODUCT_CATEGORIES TABLE - Lookup Optimization
-- ============================================================================
-- Categories are frequently looked up by name for filtering
-- Currently only has primary key index
--
CREATE INDEX IF NOT EXISTS idx_category_name
ON product_categories(category_name);

CREATE INDEX IF NOT EXISTS idx_category_active
ON product_categories(is_active);


-- ============================================================================
-- Index Analysis and Maintenance
-- ============================================================================

-- After creating indexes, analyze tables to update statistics
-- This helps MySQL choose the best query execution plan
ANALYZE TABLE orders;
ANALYZE TABLE products_master;
ANALYZE TABLE customers;
ANALYZE TABLE vendor_products;
ANALYZE TABLE order_items;
ANALYZE TABLE vendor_orders;
ANALYZE TABLE product_categories;


-- ============================================================================
-- Performance Validation Queries
-- ============================================================================
-- Run these EXPLAIN queries to verify indexes are being used:

-- Example 1: Orders with customer filter (should use idx_order_customer_status_date)
-- EXPLAIN SELECT * FROM orders
-- WHERE customer_id = 1 AND order_status = 'confirmed'
-- AND order_date >= '2024-01-01' LIMIT 20;

-- Example 2: Product search (should use idx_product_fulltext_search)
-- EXPLAIN SELECT * FROM products_master
-- WHERE MATCH(product_name, generic_name) AGAINST('aspirin' IN BOOLEAN MODE);

-- Example 3: Vendor product price comparison (should use idx_vp_product_available_price)
-- EXPLAIN SELECT * FROM vendor_products
-- WHERE product_id = 1 AND is_available = 1
-- ORDER BY vendor_price LIMIT 10;

-- Example 4: Customer search (should use idx_customer_fulltext_search)
-- EXPLAIN SELECT * FROM customers
-- WHERE MATCH(customer_name, email) AGAINST('john' IN BOOLEAN MODE) LIMIT 20;


-- ============================================================================
-- Index Size and Impact Report
-- ============================================================================
-- Run this query to see index sizes and row counts:
/*
SELECT
    table_name,
    index_name,
    ROUND(stat_value * @@innodb_page_size / 1024 / 1024, 2) AS size_mb,
    (SELECT table_rows FROM information_schema.tables
     WHERE table_schema = 'echo_healthcare_db' AND table_name = t.table_name) AS row_count
FROM mysql.innodb_index_stats t
WHERE database_name = 'echo_healthcare_db'
  AND table_name IN ('orders', 'products_master', 'customers', 'vendor_products',
                     'order_items', 'vendor_orders', 'product_categories')
  AND stat_name = 'size'
ORDER BY table_name, index_name;
*/


-- ============================================================================
-- NOTES AND RECOMMENDATIONS
-- ============================================================================

/*
FULL-TEXT SEARCH USAGE:

After adding fulltext indexes, update repository queries to use MATCH AGAINST instead of LIKE:

OLD (slow):
WHERE product_name LIKE '%aspirin%' OR generic_name LIKE '%aspirin%'

NEW (fast):
WHERE MATCH(product_name, generic_name) AGAINST('aspirin' IN BOOLEAN MODE)

Benefits:
- 10-100x faster on large datasets
- Supports relevance ranking
- Handles word stemming and stop words
- Can search multiple columns efficiently

IMPORTANT: FULLTEXT indexes work only with MyISAM or InnoDB (MySQL 5.6+).
Verify your table engine: SHOW TABLE STATUS WHERE Name = 'products_master';
*/

/*
MONITORING INDEX USAGE:

To check if indexes are being used, run:

SELECT
    object_schema,
    object_name,
    index_name,
    count_star AS query_count,
    count_read AS rows_read,
    count_fetch AS rows_fetched
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = 'echo_healthcare_db'
ORDER BY count_star DESC;

Look for indexes with 0 count_star - those may be unnecessary.
*/

/*
ESTIMATED PERFORMANCE IMPROVEMENTS:

Based on typical query patterns:

1. Order Search:
   - Before: ~500ms for 100K orders (full table scan)
   - After: ~5ms with composite index
   - Improvement: 100x faster

2. Product Search:
   - Before: ~800ms for 50K products with LIKE
   - After: ~10ms with FULLTEXT index
   - Improvement: 80x faster

3. Customer Lookup:
   - Before: ~300ms for 10K customers
   - After: ~3ms with composite index
   - Improvement: 100x faster

4. Vendor Product Price Comparison:
   - Before: ~400ms for 200K vendor products
   - After: ~5ms with composite index
   - Improvement: 80x faster
*/


-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
/*
-- Only run this if you need to remove the indexes for any reason

DROP INDEX IF EXISTS idx_order_customer_status_date ON orders;
DROP INDEX IF EXISTS idx_order_payment_status ON orders;
DROP INDEX IF EXISTS idx_order_type_status ON orders;

DROP INDEX IF EXISTS idx_product_category_active ON products_master;
DROP INDEX IF EXISTS idx_product_generic_name ON products_master;
DROP INDEX IF EXISTS idx_product_fulltext_search ON products_master;

DROP INDEX IF EXISTS idx_customer_city ON customers;
DROP INDEX IF EXISTS idx_customer_type_active ON customers;
DROP INDEX IF EXISTS idx_customer_fulltext_search ON customers;

DROP INDEX IF EXISTS idx_vp_vendor_product_available ON vendor_products;
DROP INDEX IF EXISTS idx_vp_available_price ON vendor_products;
DROP INDEX IF EXISTS idx_vp_product_available_price ON vendor_products;

DROP INDEX IF EXISTS idx_orderitem_order_product ON order_items;
DROP INDEX IF EXISTS idx_orderitem_product ON order_items;
DROP INDEX IF EXISTS idx_orderitem_vendor_product ON order_items;

DROP INDEX IF EXISTS idx_vendor_order_vendor_status_date ON vendor_orders;
DROP INDEX IF EXISTS idx_vendor_order_status ON vendor_orders;

DROP INDEX IF EXISTS idx_category_name ON product_categories;
DROP INDEX IF EXISTS idx_category_active ON product_categories;
*/

-- ============================================================================
-- END OF PERFORMANCE INDEXES SCRIPT
-- ============================================================================
