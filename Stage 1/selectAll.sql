-- ==========================================================
-- SELECT ALL FROM LOGISTICS DATABASE (RAMI LEVY)
-- ==========================================================

-- 1. Products and Inventory
SELECT * FROM PRODUCT;
SELECT * FROM INVENTORY;
SELECT * FROM PRODUCT_KASHRUT;

-- 2. Warehouses and Localization
SELECT * FROM WAREHOUSE;
SELECT * FROM WAREHOUSE_WAREHOUSEMANAGER;
SELECT * FROM LOCATED;

-- 3. Delivery Companies and Transport
SELECT * FROM DELIVERYCOMPAGNY;
SELECT * FROM DELIVERYCOMPAGNY_REGIONSERVED;
SELECT * FROM TRUCK;

-- 4. Stores and Orders
SELECT * FROM STORE;
SELECT * FROM "ORDER"; -- Double quotes are mandatory as ORDER is a reserved keyword
SELECT * FROM CONTAINS;