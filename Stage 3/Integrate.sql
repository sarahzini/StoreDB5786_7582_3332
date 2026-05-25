-- =====================================================================
-- Integrate.sql
-- ---------------------------------------------------------------------
-- Purpose : merge DB2 (the new database) into DB1 (StoreDB).
-- Method  : DB2 has already been restored into a separate schema named
--           "db2". DB1 lives in the default "public" schema.
--           This script only runs CREATE TABLE / ALTER TABLE / INSERT
--           on DB1, reading the data from the db2 schema.
-- Run     : ONCE. The whole script is wrapped in one transaction, so if
--           any statement fails nothing is changed.
--
-- ID OFFSET
--   DB1 and DB2 each use their own ProductID / OrderId / StoreID values,
--   so the same number can exist in both databases. To avoid collisions,
--   every DB2 ProductID, OrderId and StoreID is shifted by a fixed
--   amount.
--       OFFSET = 10000
--   The same offset is applied everywhere a shifted id is reused, so the
--   links stay correct. Safe ONLY IF every id already in DB1 is below
--   10000 (checked: MAX ProductID and MAX OrderId are 1000).
--
-- ROWS THAT ARE SKIPPED ON PURPOSE (constraints are kept, bad data out)
--   * DB2 products whose ExpirationDate < DateOfManufacture are skipped
--     (they violate the check_dates constraint). Their inventory,
--     kashrut and order lines are skipped too.
--   * DB2 stores whose phone is already used (by DB1 or duplicated
--     inside DB2) are skipped (they violate unique_store_phone).
--
-- INVENTORY
--   Every inventory row is attached to an existing DB1 store
--   (round-robin), both the DB1 rows and the imported DB2 rows.
-- =====================================================================

BEGIN;

-- =====================================================================
-- PART 1 - Create the new tables coming from DB2.
--          CUSTOMER, CATEGORY and SUPPLIER did not exist in DB1.
--          SUPPLIER is a plain copy of the DB2 supplier table.
-- =====================================================================

CREATE TABLE CATEGORY (
  CategoryID   INT          NOT NULL,
  CategoryName VARCHAR(100) NOT NULL,
  PRIMARY KEY (CategoryID)
);

CREATE TABLE CUSTOMER (
  CustomerID   INT          NOT NULL,
  CustomerName VARCHAR(100) NOT NULL,
  Email        VARCHAR(100),                 -- optional in DB2
  Phone        VARCHAR(20)  NOT NULL,
  City         VARCHAR(50)  NOT NULL,
  Street       VARCHAR(100) NOT NULL,
  PRIMARY KEY (CustomerID)
);

CREATE TABLE SUPPLIER (
  SupplierID   INT          NOT NULL,
  SupplierName VARCHAR(100) NOT NULL,
  Email        VARCHAR(100),                 -- optional in DB2
  Phone        VARCHAR(20)  NOT NULL,
  City         VARCHAR(50)  NOT NULL,
  Street       VARCHAR(100) NOT NULL,
  PRIMARY KEY (SupplierID)
);

-- =====================================================================
-- PART 2 - Alter the existing DB1 tables so they can hold the new data.
--          New columns are added as NULLABLE first, because the rows
--          already in DB1 have no value for them yet. They are filled
--          in PART 3 and made mandatory in PART 5.
-- =====================================================================

-- PRODUCT gains a link to CATEGORY and a link to SUPPLIER.
-- SupplierID stays nullable on purpose: not every product has a supplier
-- (the products already in DB1 have none).
ALTER TABLE PRODUCT ADD COLUMN CategoryID INT;
ALTER TABLE PRODUCT ADD COLUMN SupplierID INT;

-- "ORDER" gains PaymentMethod, Status and a link to CUSTOMER.
-- An order can now belong to a Store OR to a Customer, so StoreID and
-- DriverID must stop being mandatory.
ALTER TABLE "ORDER" ADD COLUMN PaymentMethod VARCHAR(50);
ALTER TABLE "ORDER" ADD COLUMN Status        VARCHAR(50);
ALTER TABLE "ORDER" ADD COLUMN CustomerID    INT;
ALTER TABLE "ORDER" ALTER COLUMN StoreID  DROP NOT NULL;
ALTER TABLE "ORDER" ALTER COLUMN DriverID DROP NOT NULL;

-- CONTAINS gains the extra fields that DB2 kept in its orderitem table.
ALTER TABLE CONTAINS ADD COLUMN SubTotal        DECIMAL(10,2);
ALTER TABLE CONTAINS ADD COLUMN InOnSale        BOOLEAN;
ALTER TABLE CONTAINS ADD COLUMN SaleDescription VARCHAR(255);

-- INVENTORY gains a link to STORE. Added nullable first; filled in
-- PART 3 (for DB1 rows) and PART 4 (for DB2 rows).
ALTER TABLE INVENTORY ADD COLUMN StoreID INT;

-- =====================================================================
-- PART 3 - Fill in the missing values for the DATA ALREADY IN DB1.
-- =====================================================================

-- Every DB1 product needs a category. Create one default category
-- (id 0 is assumed to be unused by DB2 categories)...
INSERT INTO CATEGORY (CategoryID, CategoryName)
VALUES (0, 'no category');

-- ...and assign it to every product currently in DB1.
UPDATE PRODUCT
SET CategoryID = 0
WHERE CategoryID IS NULL;

-- All current DB1 orders are marked as paid in cash.
UPDATE "ORDER"
SET PaymentMethod = 'Cash'
WHERE PaymentMethod IS NULL;

-- For the CONTAINS rows already in DB1, compute the missing fields:
--   SubTotal = Quantity * unit price of the product
--   InOnSale = FALSE (no sale information existed)
--   SaleDescription stays NULL (it is an optional field)
UPDATE CONTAINS c
SET SubTotal = c.Quantity * p.Price,
    InOnSale = FALSE
FROM PRODUCT p
WHERE c.ProductID = p.ProductID
  AND c.SubTotal IS NULL;

-- DB1 inventory rows have no store. Attach each one to an existing DB1
-- store, spread evenly over all stores (round-robin):
--   inventory rows are numbered 0,1,2,...   stores are numbered 0,1,2,...
--   inventory row i goes to store number (i mod store_count).
WITH inv_numbered AS (
    SELECT ProductID,
           ROW_NUMBER() OVER (ORDER BY ProductID) - 1 AS rn
    FROM INVENTORY
),
store_numbered AS (
    SELECT StoreID,
           ROW_NUMBER() OVER (ORDER BY StoreID) - 1 AS rn
    FROM STORE
    WHERE StoreID < 10000                    -- DB1 stores only
)
UPDATE INVENTORY i
SET StoreID = sn.StoreID
FROM inv_numbered inv
JOIN store_numbered sn
  ON inv.rn % (SELECT COUNT(*) FROM STORE WHERE StoreID < 10000) = sn.rn
WHERE i.ProductID = inv.ProductID;

-- =====================================================================
-- PART 4 - Import the DB2 data into DB1.
--          Order matters: a table is filled only after the tables it
--          points to are already filled.
-- =====================================================================

-- 4.1 CATEGORY - brand new table, ids kept unchanged.
INSERT INTO CATEGORY (CategoryID, CategoryName)
SELECT categoryid, categoryname
FROM db2.category;

-- 4.2 SUPPLIER - brand new table, plain copy, ids kept unchanged.
INSERT INTO SUPPLIER (SupplierID, SupplierName, Email, Phone, City, Street)
SELECT supplierid, suppliername, email, phone, city, street
FROM db2.supplier;

-- 4.3 CUSTOMER - brand new table, ids kept unchanged.
INSERT INTO CUSTOMER (CustomerID, CustomerName, Email, Phone, City, Street)
SELECT customerid, customername, email, phone, city, street
FROM db2.customer;

-- 4.4 STORE - existing table -> shift StoreID by the offset.
-- Two things are handled so the DB1 constraints are never violated:
--   * Rating: DB1 wants an integer 1..5. The DB2 decimal rating is
--     rounded and clamped into 1..5. A NULL rating is kept as NULL
--     (the CASE is needed because GREATEST/LEAST ignore NULLs).
--   * Phone: STORE has a UNIQUE constraint on phone. DB2 stores whose
--     phone is already used by a DB1 store, or duplicated inside DB2,
--     are skipped. For a duplicated phone only the lowest storeid kept.
INSERT INTO STORE (StoreID, StoreName, Phone, Rating, WebSiteUrl)
SELECT d.storeid + 10000,
       d.storename,
       d.phone,
       CASE WHEN d.rating IS NULL THEN NULL
            ELSE GREATEST(1, LEAST(5, ROUND(d.rating)))::INT END,
       d.websiteurl
FROM db2.store d
WHERE d.phone NOT IN (SELECT Phone FROM STORE)
  AND d.storeid = (SELECT MIN(d2.storeid)
                   FROM db2.store d2
                   WHERE d2.phone = d.phone);

-- 4.5 PRODUCT - existing table -> shift ProductID by the offset.
-- DB2 products whose expiration date is before the manufacture date
-- violate the check_dates constraint, so they are skipped.
INSERT INTO PRODUCT (ProductID, ProductName, Price,
                     DateOfManufacture, ExpirationDate, CategoryID, SupplierID)
SELECT productid + 10000, productname, price,
       dateofmanufacture, expirationdate, categoryid, supplierid
FROM db2.product
WHERE expirationdate >= dateofmanufacture;

-- 4.6 PRODUCT_KASHRUT - kashrut of each DB2 product, copied here.
-- Same date filter, so it only covers products that were imported.
INSERT INTO PRODUCT_KASHRUT (ProductID, Kashrut)
SELECT productid + 10000, kashrut
FROM db2.product
WHERE kashrut IS NOT NULL
  AND expirationdate >= dateofmanufacture;

-- 4.7 "ORDER" - existing table -> shift OrderId by the offset.
-- DB2 orders belong to a customer (never a store/driver), so StoreID,
-- DriverID and DeliveryDate are left empty. DB2 totalamount maps to the
-- Price column of DB1.
INSERT INTO "ORDER" (OrderId, Price, OrderDate, DeliveryDate,
                     PaymentMethod, Status, StoreID, DriverID, CustomerID)
SELECT orderid + 10000, totalamount, orderdate, NULL,
       paymentmethod, orderstatus, NULL, NULL, customerid
FROM db2.orders;

-- 4.8 INVENTORY - import DB2 inventory. ProductID is shifted by the
-- offset so it matches the products imported in step 4.5. Only the
-- inventory of imported (valid-date) products is kept. Each row is
-- attached to an existing DB1 store (round-robin), like in PART 3.
INSERT INTO INVENTORY (ProductID, Quantity, MinimumStock, StoreID)
SELECT inv.productid + 10000, inv.quantity, inv.minimumstock, st.StoreID
FROM (
        SELECT productid, quantity, minimumstock,
               ROW_NUMBER() OVER (ORDER BY productid) - 1 AS rn
        FROM db2.inventory
        WHERE productid IN (
            SELECT productid FROM db2.product
            WHERE expirationdate >= dateofmanufacture
        )
     ) AS inv
JOIN (
        SELECT StoreID,
               ROW_NUMBER() OVER (ORDER BY StoreID) - 1 AS rn
        FROM STORE
        WHERE StoreID < 10000                -- DB1 stores only
     ) AS st
  ON inv.rn % (SELECT COUNT(*) FROM STORE WHERE StoreID < 10000) = st.rn;

-- 4.9 CONTAINS - DB2 keeps its order lines in the orderitem table.
-- CONTAINS uses (OrderId, ProductID) as its key, while orderitem allowed
-- the same product several times inside one order. To respect the key,
-- lines sharing the same (order, product) are merged:
--   Quantity and SubTotal are summed,
--   InOnSale is TRUE if any merged line was on sale,
--   SaleDescription keeps one of the descriptions.
-- Only lines whose product was imported (valid date) are kept.
INSERT INTO CONTAINS (OrderId, ProductID, Quantity,
                      SubTotal, InOnSale, SaleDescription)
SELECT orderid + 10000,
       productid + 10000,
       SUM(quantity),
       SUM(subtotal),
       bool_or(inonsale),
       MAX(saledescription)
FROM db2.orderitem
WHERE productid IN (
    SELECT productid FROM db2.product
    WHERE expirationdate >= dateofmanufacture
)
GROUP BY orderid + 10000, productid + 10000;

-- =====================================================================
-- PART 5 - Lock the new structure: make columns mandatory where the data
--          now allows it, and add the foreign keys for the new links.
-- =====================================================================

-- Every product has a category, every order has a payment method, every
-- CONTAINS line has a subtotal and a sale flag, every inventory row has
-- a store. SupplierID is NOT made mandatory: a product may have no
-- supplier.
ALTER TABLE PRODUCT   ALTER COLUMN CategoryID    SET NOT NULL;
ALTER TABLE "ORDER"   ALTER COLUMN PaymentMethod SET NOT NULL;
ALTER TABLE CONTAINS  ALTER COLUMN SubTotal      SET NOT NULL;
ALTER TABLE CONTAINS  ALTER COLUMN InOnSale      SET NOT NULL;
ALTER TABLE INVENTORY ALTER COLUMN StoreID       SET NOT NULL;

-- Foreign keys for the new links.
ALTER TABLE PRODUCT
  ADD CONSTRAINT fk_product_category
  FOREIGN KEY (CategoryID) REFERENCES CATEGORY(CategoryID);

ALTER TABLE PRODUCT
  ADD CONSTRAINT fk_product_supplier
  FOREIGN KEY (SupplierID) REFERENCES SUPPLIER(SupplierID);

ALTER TABLE "ORDER"
  ADD CONSTRAINT fk_order_customer
  FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID);

ALTER TABLE INVENTORY
  ADD CONSTRAINT fk_inventory_store
  FOREIGN KEY (StoreID) REFERENCES STORE(StoreID);

-- An order must belong to at least one side: a store or a customer.
ALTER TABLE "ORDER"
  ADD CONSTRAINT chk_order_owner
  CHECK (StoreID IS NOT NULL OR CustomerID IS NOT NULL);

COMMIT;

-- =====================================================================
-- PART 6 - verification. We run these by hand AFTER the commit.
-- =====================================================================
-- SELECT COUNT(*) FROM PRODUCT;
-- SELECT COUNT(*) FROM "ORDER";
-- SELECT COUNT(*) FROM CONTAINS;
-- SELECT COUNT(*) FROM INVENTORY;
-- SELECT COUNT(*) FROM STORE;
-- SELECT COUNT(*) FROM CUSTOMER;
-- SELECT COUNT(*) FROM SUPPLIER;
-- SELECT COUNT(*) FROM CATEGORY;
-- DB2 products skipped because of bad dates:
-- SELECT COUNT(*) FROM db2.product WHERE expirationdate < dateofmanufacture;
-- DB2 stores skipped because of duplicate phones:
-- SELECT COUNT(*) FROM db2.store d WHERE d.phone IN (SELECT Phone FROM STORE WHERE StoreID < 10000)
--    OR d.storeid <> (SELECT MIN(d2.storeid) FROM db2.store d2 WHERE d2.phone = d.phone);
-- Every inventory row should point to a real store (should return 0 rows):
-- SELECT * FROM INVENTORY i LEFT JOIN STORE s ON i.StoreID = s.StoreID WHERE s.StoreID IS NULL;
