# Echo Healthcare Database Guide
## Multi-Vendor Product Management System

---

## 📋 **Overview**

This database is designed for **Echo Healthcare** to manage multiple vendors selling healthcare products through online and door-to-door channels. The system automatically identifies the **lowest-price vendor** for each product.

---

## 🗂️ **Database Structure**

### **Core Tables**

1. **vendors** - Stores vendor information
2. **products_master** - Master product catalog
3. **vendor_products** - Links vendors to products with pricing
4. **product_categories** - Product categorization
5. **customers** - Customer information
6. **orders** - Customer orders
7. **order_items** - Individual items in orders
8. **vendor_orders** - Purchase orders to vendors

---

## 🔑 **Key Features**

### ✅ **Automatic Lowest Price Detection**
- The `final_price` column is auto-calculated: `cost_price × (1 - discount_percentage/100)`
- Views automatically identify the cheapest vendor for each product
- Multiple vendors can sell the same product at different prices

### ✅ **Multi-Channel Sales**
- Supports both **online** and **door-to-door** sales
- Order tracking with status management
- Customer type classification (retail, wholesale, institution)

### ✅ **Stock Management**
- Real-time stock tracking per vendor
- Expiry date tracking
- Minimum order quantity management

---

## 📊 **Important Queries**

### **1. Get Lowest Price Vendor for Each Product**

```sql
-- Use the pre-built view
SELECT * FROM vw_lowest_price_products;

-- This shows you which vendor offers the best price for each product
```

**Sample Output:**
```
product_name          | vendor_name              | final_price | stock_quantity
---------------------|--------------------------|-------------|---------------
Paracetamol 500mg    | HealthCare Distributors  | 21.16      | 800
Vitamin D3 60K       | Pharma Solutions         | 73.60      | 250
Hand Sanitizer 500ml | Pharma Solutions         | 144.50     | 300
```

---

### **2. Compare All Vendor Prices for a Product**

```sql
-- See all vendors offering a specific product
SELECT 
    product_name,
    vendor_name,
    cost_price,
    discount_percentage,
    final_price,
    stock_quantity,
    price_status
FROM vw_product_price_comparison
WHERE product_name = 'Paracetamol 500mg'
ORDER BY final_price;
```

---

### **3. Find All Products from a Specific Vendor**

```sql
SELECT 
    pm.product_name,
    vp.cost_price,
    vp.discount_percentage,
    vp.final_price,
    vp.stock_quantity
FROM vendor_products vp
JOIN products_master pm ON vp.product_id = pm.product_id
JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE v.vendor_name = 'MediSupply India Pvt Ltd'
  AND vp.is_available = TRUE
ORDER BY vp.final_price;
```

---

### **4. Get Products Below a Certain Price**

```sql
SELECT 
    product_name,
    vendor_name,
    final_price,
    stock_quantity
FROM vw_lowest_price_products
WHERE final_price < 100
ORDER BY final_price;
```

---

### **5. Vendor Performance Report**

```sql
SELECT * FROM vw_vendor_performance;
```

Shows:
- Total products per vendor
- Average price
- Total stock available
- How many products each vendor offers at the lowest price

---

### **6. Search Products by Name or Category**

```sql
SELECT 
    pm.product_name,
    pc.category_name,
    v.vendor_name,
    vp.final_price,
    vp.stock_quantity
FROM products_master pm
JOIN product_categories pc ON pm.category_id = pc.category_id
JOIN vendor_products vp ON pm.product_id = vp.product_id
JOIN vendors v ON vp.vendor_id = v.vendor_id
WHERE pm.product_name LIKE '%Paracetamol%'
   OR pc.category_name = 'Medicines'
ORDER BY vp.final_price;
```

---

### **7. Get Available Stock Summary**

```sql
SELECT 
    pm.product_name,
    SUM(vp.stock_quantity) as total_stock_all_vendors,
    COUNT(DISTINCT vp.vendor_id) as number_of_vendors,
    MIN(vp.final_price) as lowest_price,
    MAX(vp.final_price) as highest_price
FROM products_master pm
JOIN vendor_products vp ON pm.product_id = vp.product_id
WHERE vp.is_available = TRUE
GROUP BY pm.product_id, pm.product_name
ORDER BY total_stock_all_vendors DESC;
```

---

## 🛒 **Creating an Order (Automated Lowest Price Selection)**

### **Step 1: Customer wants to buy products**

```sql
-- Find lowest price for products customer wants
SELECT 
    vendor_product_id,
    product_id,
    vendor_id,
    product_name,
    vendor_name,
    final_price,
    stock_quantity
FROM vw_lowest_price_products
WHERE product_id IN (1, 3, 8)  -- Products customer wants
  AND stock_quantity >= 10;     -- Required quantity
```

### **Step 2: Create the order**

```sql
-- Insert customer order
INSERT INTO orders (
    customer_id, 
    order_number, 
    order_type, 
    total_amount, 
    final_amount,
    order_status
) VALUES (
    1,                          -- customer_id
    'ORD-2026-001',            -- order_number
    'online',                  -- order_type
    500.00,                    -- total_amount
    500.00,                    -- final_amount
    'pending'                  -- order_status
);

-- Get the order_id
SET @order_id = LAST_INSERT_ID();

-- Add order items (automatically from lowest price vendors)
INSERT INTO order_items (
    order_id,
    vendor_product_id,
    product_id,
    vendor_id,
    quantity,
    unit_price,
    line_total
)
SELECT 
    @order_id,
    vendor_product_id,
    product_id,
    vendor_id,
    10,                        -- quantity
    final_price,               -- unit_price
    final_price * 10           -- line_total
FROM vw_lowest_price_products
WHERE product_id IN (1, 3, 8);
```

---

## 📈 **Adding New Vendors and Products**

### **Add a New Vendor**

```sql
INSERT INTO vendors (
    vendor_name, 
    contact_person, 
    email, 
    phone, 
    city, 
    state, 
    gst_number
) VALUES (
    'New Healthcare Supplier',
    'Suresh Kumar',
    'suresh@newhealthcare.com',
    '9876543213',
    'Bangalore',
    'Karnataka',
    '29AABCU9603R1ZY'
);
```

### **Add Products for This Vendor**

```sql
-- Get the new vendor_id
SET @new_vendor_id = LAST_INSERT_ID();

-- Add products with pricing
INSERT INTO vendor_products (
    vendor_id,
    product_id,
    vendor_sku,
    cost_price,
    mrp,
    discount_percentage,
    stock_quantity,
    is_available
) VALUES
(@new_vendor_id, 1, 'V4-PAR500', 22.00, 30.00, 10, 1000, TRUE),
(@new_vendor_id, 2, 'V4-THERM', 270.00, 350.00, 8, 150, TRUE),
-- Add more products...
;
```

---

## 🎯 **Sales Strategy: Always Sell Lowest Price First**

### **Automatic Approach**
The database views (`vw_lowest_price_products`) automatically show the lowest price vendor. When creating orders, simply query this view.

### **Manual Verification**
```sql
-- Before placing order, verify you're getting best price
SELECT 
    product_name,
    vendor_name,
    final_price,
    'BEST DEAL' as status
FROM vw_lowest_price_products
WHERE product_id IN (1, 2, 3, 4, 5);
```

---

## 📊 **Reports for Business Analysis**

### **Daily Sales Report**

```sql
SELECT 
    DATE(o.order_date) as sale_date,
    COUNT(o.order_id) as total_orders,
    SUM(o.final_amount) as total_revenue,
    o.order_type
FROM orders o
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY DATE(o.order_date), o.order_type
ORDER BY sale_date DESC;
```

### **Vendor Purchase Report**

```sql
SELECT 
    v.vendor_name,
    COUNT(DISTINCT oi.order_id) as orders_fulfilled,
    SUM(oi.quantity) as total_units_sold,
    SUM(oi.line_total) as total_revenue_from_vendor
FROM order_items oi
JOIN vendors v ON oi.vendor_id = v.vendor_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY v.vendor_id, v.vendor_name
ORDER BY total_revenue_from_vendor DESC;
```

### **Top Selling Products**

```sql
SELECT 
    pm.product_name,
    COUNT(oi.order_item_id) as times_ordered,
    SUM(oi.quantity) as total_quantity_sold,
    SUM(oi.line_total) as total_revenue
FROM order_items oi
JOIN products_master pm ON oi.product_id = pm.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY pm.product_id, pm.product_name
ORDER BY total_revenue DESC
LIMIT 10;
```

---

## 🔧 **Maintenance Tasks**

### **Update Stock Quantity**

```sql
UPDATE vendor_products
SET stock_quantity = stock_quantity - 10  -- Reduce after sale
WHERE vendor_product_id = 1;
```

### **Update Vendor Pricing**

```sql
UPDATE vendor_products
SET cost_price = 24.50,
    discount_percentage = 12
WHERE vendor_id = 1 AND product_id = 1;
```

### **Mark Products as Unavailable**

```sql
UPDATE vendor_products
SET is_available = FALSE
WHERE expiry_date < CURRENT_DATE
   OR stock_quantity = 0;
```

---

## 🚀 **Best Practices**

1. **Always check stock** before confirming orders
2. **Update pricing regularly** to stay competitive
3. **Monitor expiry dates** for medical products
4. **Track vendor performance** monthly
5. **Maintain accurate GST records** for all vendors
6. **Use the views** for quick lowest-price lookups
7. **Archive old orders** periodically for performance

---

## 📞 **Contact & Support**

For any database-related queries or modifications, please document requirements clearly including:
- What data you need to add/modify
- Which vendors/products are involved
- Expected output format

---

**Database Version:** 1.0  
**Created for:** Echo Healthcare  
**Last Updated:** February 2026
