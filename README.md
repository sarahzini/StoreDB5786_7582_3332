# Logistics & Inventory Management System (Rami Levy)

Project by **Sara Heymann 2254681 and Sarah Sebaoun 345887582**

## Table of Contents
- [Phase 1: Design and Build the Database](#phase-1-design-and-build-the-database)
  - [Introduction](#introduction)
  - [ERD (Entity-Relationship Diagram)](#erd-entity-relationship-diagram)
  - [DSD (Data Structure Diagram)](#dsd-data-structure-diagram)
  - [SQL Scripts](#sql-scripts)
  - [Data Population Methods](#data-population-methods)
  - [Backup & Restore](#backup--restore)
- [Phase 2: Queries and Constraints](#phase-2-queries-and-constraints)
  - [Introduction](#phase-2-introduction)
  - [1. SELECT Queries](#1-select-queries)
  - [2. COMMIT & ROLLBACK](#2-commit--rollback)
  - [3. UPDATE Queries](#3-update-queries)
  - [4. DELETE Queries](#4-delete-queries)
  - [5. Constraints (ALTER TABLE)](#5-constraints-alter-table)
  - [6. Indexes](#6-indexes)
  - [7. Backup](#7-backup-1)
- [Phase 3: System Integration](#phase-3-system-integration)
  - [Introduction](#phase-3-introduction)
  - [Step 1 - Reverse Engineering: from SQL to ERD](#step-1---reverse-engineering-from-sql-to-erd)
  - [Step 2 - DSD of the Received Department](#step-2---dsd-of-the-received-department)
  - [Step 3 - The Two ERDs](#step-3---the-two-erds)
  - [Step 4 - Integrated ERD & Design Decisions](#step-4---integrated-erd--design-decisions)
  - [Step 5 - DSD After Integration](#step-5---dsd-after-integration)
  - [Step 6 - Schema Changes (Integrate.sql)](#step-6---schema-changes-integratesql)
  - [Step 7 - Data Verification](#step-7---data-verification)
  - [Step 8 - Backup (backup3)](#step-8---backup-backup3)
  - [Views](#views)
- [Phase 4: Programming (PL/pgSQL)](#phase-4-programming-plpgsql)
  - [Introduction](#phase-4-introduction)
  - [1. Functions](#1-functions)
  - [2. Procedures](#2-procedures)
  - [3. Triggers](#3-triggers)
  - [4. Main Programs](#4-main-programs)
  - [5. Backup](#5-backup)
- [Phase 5: Full-Stack Web Application](#phase-5-full-stack-web-application)
  - [Overview](#phase-5-overview)
  - [Architecture](#architecture)
  - [Prerequisites](#prerequisites)
  - [Project Structure](#project-structure)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
  - [API Reference](#api-reference)
  - [Frontend Pages & Features](#frontend-pages--features)
  - [Database Schema](#database-schema-key-tables)
  - [Key Design Decisions](#key-design-decisions)


---

## Phase 1: Design and Build the Database

### Introduction
The **Logistics Management System** is designed to efficiently manage the complex supply chain of a retail giant like **Rami Levy**. It tracks the journey of products from large-scale warehouses to individual store shelves through a coordinated transportation network.

#### Purpose of the System
- **Inventory Tracking**: Real-time monitoring of stock across different warehouse locations.
- **Store Orders**: Handling automated and manual product requests from stores.
- **Logistics & Fleet**: Managing trucks, driver schedules, and working hours.
- **Regional Distribution**: Connecting delivery companies to specific geographical sectors.

#### UI Prototypes (Google AI Studio)
*To visualize the system's interface, we generated various prototype pages using Google AI Studio:*

| Dashboard Overview | Inventory Management | Order Tracking | Delivery Schedule |
| :---: | :---: | :---: | :---: |
| ![AI Studio 1](images/Stage%201/GoogleAI1.png) | ![AI Studio 2](images/Stage%201/GoogleAI2.png) | ![AI Studio 3](images/Stage%201/GoogleAI3.png) | ![AI Studio 4](images/Stage%201/GoogleAI4.png) |

### ERD (Entity-Relationship Diagram)
The ERD illustrates the logical architecture of the database, showing how Stores, Warehouses, and Trucks interact.
![ERD Diagram](Stage%201/ERD.png)

### DSD (Data Structure Diagram)
The DSD details the physical schema, including primary/foreign keys and field constraints.
![DSD Diagram](Stage%201/DSD.png)

### SQL Scripts
- 📜 **[Create Tables](Stage%201/createTables.sql)**: Schema definition.
- 📜 **[Drop Tables](Stage%201/dropTables.sql)**: Table cleanup script.
- 📜 **[Select All](Stage%201/selectAll.sql)**: Data verification queries.

---

### Data Population Methods
We utilized three distinct strategies to populate the database with over 2,000 rows of realistic data:

#### 1. Manual CSV Import
Static reference data, such as warehouse locations and fixed regional codes, were imported via standard CSV files.
- 📂 **[Data Import Files](Stage%201/DataImportFiles/)**

#### 2. Automated Python Generation
For dynamic entities requiring specific logic (like unique store IDs or formatted phone numbers starting with "02"), we used Python scripts. This allowed for the generation of 300+ unique stores with professional naming conventions.
- 🐍 **Script:** [generator.py](Stage%201/Programing/generator.py)

#### 3. Mockaroo (Synthetic Data)
To simulate a high volume of transactions and products, we used [Mockaroo](https://www.mockaroo.com/). This was essential for populating the `PRODUCT` and `CONTAINS` tables with valid dates and price ranges.

![Mockaroo Setup](images/Stage%201/Mockaroo.png)

---

### Backup & Restore
Data safety is guaranteed through a complete SQL dump of the database.
- 💾 **[Database Backup File](databaseBackup.sql)**

We successfully performed a database restore to verify data persistence. The image below confirms the `contains` table was fully recovered in the pgAdmin environment:

![Restore Confirmation](images/Stage%201/Restore.png)



---

## Phase 2: Queries and Constraints

### Phase 2 Introduction
In this phase, we query the database to extract meaningful insights and enforce business rules through constraints and indexes. 

All SQL query files for this phase can be found in the designated code directory: [Queries Folder](Stage%202/Queries/).

---

### 1. SELECT Queries

#### Double Versions (Comparing Efficiency: A vs B)

**Query 1: Products Below Minimum Stock**
- **Description:** Provide a global report of all products currently below their minimum stock threshold across all company warehouses.

**Version A (Multiple JOINs):** 
```sql
-- This scans all warehouses and links products to their current stock status.
SELECT 
    w.WarehouseID, 
    w.Region AS WarehouseName, 
    p.ProductName, 
    i.Quantity, 
    i.MinimumStock
FROM PRODUCT p
JOIN INVENTORY i ON p.ProductID = i.ProductID
JOIN LOCATED l ON p.ProductID = l.ProductID
JOIN WAREHOUSE w ON l.WarehouseID = w.WarehouseID
WHERE i.Quantity < i.MinimumStock
ORDER BY w.WarehouseID, p.ProductName; -- Organized by warehouse for clarity
```

**Version B (Subqueries):**
```sql
-- This calculates stock and warehouse names for each product individually.
SELECT 
    l.WarehouseID,
    (SELECT Region FROM WAREHOUSE WHERE WarehouseID = l.WarehouseID) AS WarehouseName,
    p.ProductName,
    (SELECT Quantity FROM INVENTORY WHERE ProductID = p.ProductID) AS Qty,
    (SELECT MinimumStock FROM INVENTORY WHERE ProductID = p.ProductID) AS MinStock
FROM PRODUCT p
JOIN LOCATED l ON p.ProductID = l.ProductID
WHERE p.ProductID IN (
      SELECT ProductID FROM INVENTORY WHERE Quantity < MinimumStock
)
ORDER BY l.WarehouseID;
```
**Comparison (Why Version A is better):** Version A uses standard JOINs to build a single result set, allowing the database engine to utilize indexes efficiently in one pass. Version B relies on multiple correlated subqueries in the SELECT clause, forcing a repetitive row-by-row lookup. This makes Version A significantly more efficient and the professional choice.

**Execution & Result:**  
![Query 1 Result](images/Stage%202/Query1.png)


**Query 2: Delivery Performance by Company**
- **Description:** Analyzes the delivery performance and financial volume handled by different delivery companies within the current month.

**Version A (Direct Grouping):**
```sql
-- Direct grouping after join
SELECT dc.DeliveryCieName, COUNT(o.OrderId) as TotalOrders, SUM(o.Price) as TotalValue
FROM DELIVERYCOMPAGNY dc
JOIN TRUCK t ON dc.DeliveryCieID = t.DeliveryCieID
JOIN "ORDER" o ON t.DriverID = o.DriverID
WHERE EXTRACT(MONTH FROM o.OrderDate) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY dc.DeliveryCieName;
```

**Version B (CTE):**
```sql
-- Breaking down steps for clarity
WITH MonthlyOrders AS (
    SELECT DriverID, OrderId, Price 
    FROM "ORDER" 
    WHERE EXTRACT(MONTH FROM OrderDate) = EXTRACT(MONTH FROM CURRENT_DATE)
)
SELECT dc.DeliveryCieName, COUNT(mo.OrderId), SUM(mo.Price)
FROM DELIVERYCOMPAGNY dc
JOIN TRUCK t ON dc.DeliveryCieID = t.DeliveryCieID
JOIN MonthlyOrders mo ON t.DriverID = mo.DriverID
GROUP BY dc.DeliveryCieName;
```
**Comparison (When to use which):** For this specific, straightforward aggregation, Version A is generally faster. Modern query optimizers handle simple JOIN and GROUP BY operations extremely well. However, Version B introduces a Common Table Expression (CTE). While slightly heavier here, this method becomes vastly more efficient if the logic defining `MonthlyOrders` needs to be reused multiple times within a much larger, complex script.

**Execution & Result:**  
![Query 2 Result](images/Stage%202/Query2.png)


**Query 3: Premium Stores Analysis**
- **Description:** Identifies high-rated stores (Rating >= 4) whose average order value exceeds the company-wide average to highlight top-performing locations.

**Version A (HAVING + Subquery):**
```sql
-- This is efficient because it groups data first and compares the aggregate.
SELECT 
    s.StoreID, 
    s.StoreName, 
    s.Rating, 
    ROUND(AVG(o.Price), 2) AS Store_Avg_Order
FROM STORE s
JOIN "ORDER" o ON s.StoreID = o.StoreID
WHERE s.Rating >= 4
GROUP BY s.StoreID, s.StoreName, s.Rating
HAVING AVG(o.Price) > (SELECT AVG(Price) FROM "ORDER") -- Comparing vs Global Average
ORDER BY Store_Avg_Order DESC;
```

**Version B (Correlated Subqueries):**
```sql
-- More complex structure but less efficient due to repeated executions.
SELECT 
    s.StoreName, 
    s.Rating,
    (SELECT ROUND(AVG(Price), 2) FROM "ORDER" WHERE StoreID = s.StoreID) AS Avg_Order
FROM STORE s
WHERE s.Rating >= 4 
AND (SELECT AVG(Price) FROM "ORDER" WHERE StoreID = s.StoreID) > 
    (SELECT AVG(Price) FROM "ORDER"); -- Nested comparison
```
**Comparison (Why Version A is better):** Version A is vastly superior in performance. It groups the data first and calculates the company-wide average exactly once. Version B utilizes highly inefficient correlated subqueries, forcing the database to recalculate the average order value for every single store multiple times. 

**Execution & Result:**  
![Query 3 Result](images/Stage%202/Query3.png)


**Query 4: Expiring Products Breakdown (2026)**
- **Description:** Decomposes the expiration date into separate year, month, and day fields for products expiring in 2026, comparing two filtering methods to demonstrate SQL performance optimization.

**Version A (Non-SARGable):**
```sql
/* Version A: Extracting parts individually for the SELECT 
   and using EXTRACT in the WHERE clause (Less efficient). */
SELECT 
    p.ProductName, 
    w.Region,
    EXTRACT(YEAR FROM p.ExpirationDate) as ExpYear,
    EXTRACT(MONTH FROM p.ExpirationDate) as ExpMonth,
    EXTRACT(DAY FROM p.ExpirationDate) as ExpDay,
    p.ExpirationDate -- Kept for visual reference
FROM PRODUCT p
JOIN LOCATED l ON p.ProductID = l.ProductID
JOIN WAREHOUSE w ON l.WarehouseID = w.WarehouseID
WHERE EXTRACT(YEAR FROM p.ExpirationDate) = 2026
ORDER BY ExpMonth ASC, ExpDay ASC;
```

**Version B (SARGable):**
```sql
/* Version B: Using a Subquery to filter 2026 products efficiently 
   using a SARGable range before joining other tables. */
SELECT 
    p_sub.ProductName, 
    w.Region,
    EXTRACT(YEAR FROM p_sub.ExpirationDate) as ExpYear,
    EXTRACT(MONTH FROM p_sub.ExpirationDate) as ExpMonth,
    EXTRACT(DAY FROM p_sub.ExpirationDate) as ExpDay,
    p_sub.ExpirationDate
FROM (
    -- Subquery: Filter products by date range first
    SELECT ProductID, ProductName, ExpirationDate
    FROM PRODUCT
    WHERE ExpirationDate BETWEEN '2026-01-01' AND '2026-12-31'
) AS p_sub
JOIN LOCATED l ON p_sub.ProductID = l.ProductID
JOIN WAREHOUSE w ON l.WarehouseID = w.WarehouseID
ORDER BY p_sub.ExpirationDate;
```

**Comparison (Why Version B is better):**  Version B is the optimized approach for production environments, ensuring fast response times even as the PRODUCT and ORDER tables grow to thousands of rows.

**Execution & Result:**  
![Query 4 Result](images/Stage%202/Query4.png)


#### Single Versions (Complex Queries)

**Query 5: Full Order Breakdown**
- **Description:** Retrieves all products within a specific order (3) with detailed attributes (including Kashrut certification and line total).
```sql
SELECT 
    (SELECT o.OrderId FROM "ORDER" o WHERE o.OrderId = c.OrderId) AS OrderId,
    (SELECT p.ProductName FROM PRODUCT p WHERE p.ProductID = c.ProductID) AS ProductName,
    (SELECT pk.Kashrut FROM PRODUCT_KASHRUT pk WHERE pk.ProductID = c.ProductID) AS Kashrut,
    c.Quantity,
    (c.Quantity * (SELECT p.Price FROM PRODUCT p WHERE p.ProductID = c.ProductID)) AS LineTotal
FROM 
    CONTAINS c
WHERE 
    c.OrderId = 3
ORDER BY 
    ProductName;
```
**Execution & Result:**  
![Query 5 Result](images/Stage%202/Query5.png)


**Query 6: Driver Workload Summary**
- **Description:** Summarizes the delivery performance of each driver by displaying their name, company, and total count of successfully completed orders.
```sql
SELECT t.DriverID, dc.DeliveryCieName, COUNT(o.OrderId) as DeliveredCount
FROM TRUCK t
JOIN DELIVERYCOMPAGNY dc ON t.DeliveryCieID = dc.DeliveryCieID
LEFT JOIN "ORDER" o ON t.DriverID = o.DriverID
WHERE o.DeliveryDate IS NOT NULL
GROUP BY t.DriverID, dc.DeliveryCieName
HAVING COUNT(o.OrderId) > 0;
```
**Execution & Result:**  
![Query 6 Result](images/Stage%202/Query6.png)


**Query 7: Available Drivers by Current Capacity**
- **Description:** Counts how many active orders (DeliveryDate is NULL) each driver currently has and compares it to their truck's capacity to find remaining slots.
```sql
/* We count how many active orders (DeliveryDate is NULL) 
   each driver currently has and compare it to their truck's capacity. */
SELECT 
    t.DriverID, 
    dc.DeliveryCieName, 
    t.Capacity AS Max_Capacity,
    COUNT(o.OrderId) AS Current_Active_Orders,
    (t.Capacity - COUNT(o.OrderId)) AS Remaining_Slots
FROM TRUCK t
JOIN DELIVERYCOMPAGNY dc ON t.DeliveryCieID = dc.DeliveryCieID
LEFT JOIN "ORDER" o ON t.DriverID = o.DriverID AND o.DeliveryDate IS NULL
WHERE t.Active = 1  -- Only active drivers
GROUP BY t.DriverID, dc.DeliveryCieName, t.Capacity
HAVING COUNT(o.OrderId) < t.Capacity  -- Only those who can still take orders
ORDER BY Remaining_Slots DESC;
```
**Execution & Result:**  
![Query 7 Result](images/Stage%202/Query7.png)


**Query 8: Regional Logistics & Profitability Analysis**
- **Description:** Uses a CTE to calculate regional stats and a subquery to link warehouses to products nearing expiration.
```sql
/* This query uses a CTE to calculate regional stats and a subquery to 
   link warehouses to products nearing expiration. */
WITH RegionalSales AS (
    SELECT 
        dcrs.RegionServed,
        dc.DeliveryCieName,
        SUM(o.Price) OVER(PARTITION BY dcrs.RegionServed) as TotalRegionalRevenue,
        COUNT(o.OrderId) OVER(PARTITION BY dcrs.RegionServed, dc.DeliveryCieID) as OrdersByCompany
    FROM DELIVERYCOMPAGNY dc
    JOIN DELIVERYCOMPAGNY_REGIONSERVED dcrs ON dc.DeliveryCieID = dcrs.DeliveryCieID
    JOIN TRUCK t ON dc.DeliveryCieID = t.DeliveryCieID
    JOIN "ORDER" o ON t.DriverID = o.DriverID
    WHERE o.OrderDate >= CURRENT_DATE - INTERVAL '6 months'
)
SELECT DISTINCT
    rs.RegionServed,
    rs.TotalRegionalRevenue,
    -- Identifies the top performing company in each region
    (SELECT dc2.DeliveryCieName 
     FROM RegionalSales rs2 
     JOIN DELIVERYCOMPAGNY dc2 ON rs2.DeliveryCieName = dc2.DeliveryCieName
     WHERE rs2.RegionServed = rs.RegionServed 
     ORDER BY rs2.OrdersByCompany DESC LIMIT 1) as Leading_Cie,
    -- Counts critical expiring products in the region's warehouses
    (SELECT COUNT(p.ProductID)
     FROM PRODUCT p
     JOIN LOCATED l ON p.ProductID = l.ProductID
     JOIN WAREHOUSE w ON l.WarehouseID = w.WarehouseID
     WHERE w.Region = rs.RegionServed 
     AND p.ExpirationDate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as Critical_Exp_Count
FROM RegionalSales rs
ORDER BY rs.TotalRegionalRevenue DESC;
```
**Execution & Result:**  
![Query 8 Result](images/Stage%202/Query8.png)


---

### 2. COMMIT & ROLLBACK

#### ROLLBACK
```sql
BEGIN; -- Starts the transaction

-- 1. SHOW STATE BEFORE
-- Check drivers with more than 50 orders to see their current status
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);
```
![State Before Update](images/Stage%202/RollBack1.png)

```sql
-- 2. EXECUTE MAINTENANCE UPDATE
-- Changes status to 'Required' for overloaded drivers
UPDATE TRUCK
SET MaintenanceStatus = 'Required'
WHERE DriverID IN (
    SELECT DriverID FROM "ORDER" 
    GROUP BY DriverID 
    HAVING COUNT(*) > 50
);

-- 3. SHOW STATE AFTER UPDATE BUT BEFORE ROLLBACK
-- You should now see 'Required' for these drivers
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);
```
![State After Update](images/Stage%202/RollBack2.png)

```sql
ROLLBACK; -- Undo all changes!

-- 4. SHOW THAT STATE RETURNED TO INITIAL VALUES
-- Statuses should be back to 'Good', 'Fair', etc.
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);
```
![State After Rollback](images/Stage%202/RollBack3.png)


#### COMMIT
```sql
BEGIN; -- Starts the transaction

-- 1. EXECUTE THE UPDATE
-- Set status to 'Required' based on order count
UPDATE TRUCK
SET MaintenanceStatus = 'Required'
WHERE DriverID IN (
    SELECT DriverID FROM "ORDER" 
    GROUP BY DriverID 
    HAVING COUNT(*) > 50
);

-- 2. SHOW MODIFIED STATE 
-- Confirm the change is visible within the current transaction
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);

COMMIT; -- Permanently save the changes to the database

-- 3. SHOW STATE AFTER COMMIT 
-- Status remains 'Required' because the transaction was finalized
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);
```
![Commit Confirmation 1](images/Stage%202/Commit.png)


---

### 3. UPDATE Queries

**1. Restock Based on Minimum:**
**Description:** Adding 100 units to the inventory for all products that have fallen below their minimum stock threshold.
```sql
UPDATE INVENTORY
SET Quantity = Quantity + 100
WHERE Quantity < MinimumStock;
```
**Result (Before / Execution / After):**  
![Before](images/Stage%202/InventoryUpdate1.png)  
![Execution](images/Stage%202/InventoryUpdate2.png)  
![After](images/Stage%202/InventoryUpdate3.png)


**2. Truck Maintenance Status:**
**Description:** Updating the maintenance status to 'Required' for drivers/trucks that have completed more than 50 orders.
```sql
UPDATE TRUCK
SET MaintenanceStatus = 'Required'
WHERE DriverID IN (
    SELECT DriverID 
    FROM "ORDER" 
    GROUP BY DriverID 
    HAVING COUNT(*) > 50
);
```
**Result (Before / Execution / After):**  
![Before](images/Stage%202/DriverUpdate1.jpeg)  
![Execution](images/Stage%202/DriverUpdate2.png)  
![After](images/Stage%202/DriverUpdate3.png)


**3. Seasonal Discount:**
**Description:** Applying a 10% price reduction to products manufactured before 2024 to encourage sales.
```sql
UPDATE PRODUCT
SET Price = Price * 0.9
WHERE DateOfManufacture < '2024-01-01';
```
**Result (Before / Execution / After):**  
![Before](images/Stage%202/ProductUpdate1.png)  
![Execution](images/Stage%202/ProductUpdate2.png.png)  
![After](images/Stage%202/ProductUpdate3.png.png)


---

### 4. DELETE Queries

**1. Remove Old Empty Orders:**
**Description:** Deleting orders from previous years that do not contain any items (to clean up the system).
```sql
DELETE FROM "ORDER"
WHERE OrderDate < '2025-01-01'
AND OrderId NOT IN (SELECT OrderId FROM CONTAINS);
```
**Result (Execution / After):** 
 ![Before](images/Stage%202/DeleteOrder1.png) 
![Execution](images/Stage%202/DeleteOrder2.png)  
![After](images/Stage%202/DeleteOrder3.png)


**2. Remove an unused or specific Kashrut certification:**
**Description:** Removing a kashrut type that is no longer supported or needed.
```sql
DELETE FROM PRODUCT_KASHRUT 
WHERE Kashrut = 'OU';
```
**Result (Before & Execution / After):**  
![Before](images/Stage%202/DeleteK1.png)  
![Execution](images/Stage%202/DeleteK3.png)
![After](images/Stage%202/Deletek2.png)


**3. Remove Inactive Trucks with No Order History:**
**Description:** Deleting trucks/drivers that are marked as inactive and have never been assigned to any order to keep the fleet database clean.
```sql
DELETE FROM TRUCK
WHERE Active = 0 
AND DriverID NOT IN (SELECT DriverID FROM "ORDER");
```
**Result (Before / Execution / After):**  
![Before](images/Stage%202/DeleteTruck1.png)  
![Execution](images/Stage%202/DeleteTruck2.png)  
![After](images/Stage%202/DeleteTruck3.png)


---

### 5. Constraints (ALTER TABLE)

**🚨 Important Note:** A significant portion of our database constraints (Primary Keys, Foreign Keys, `NOT NULL`, and basic checks) were already thoroughly defined directly during the table creation phase. Because of this solid foundation, the new constraints added here via `ALTER TABLE` are specifically targeted at advanced business rules, keeping them simple and effective. You can view our extensive initial constraint setup in our original script: [createTables.sql](Stage%201/createTables.sql).

**1. URL Format Constraint:**
**Description:** Ensures the website URL always starts with 'http' to maintain data consistency.
```sql
ALTER TABLE STORE 
ADD CONSTRAINT check_url_format CHECK (WebSiteUrl LIKE 'http%');

-- Attempting to update a store with an invalid URL format (missing 'http')
-- This will trigger the 'check_url_format' constraint error.
UPDATE STORE 
SET WebSiteUrl = 'www.ramilevy.co.il' 
WHERE StoreID = 1;
```
![Constraint Error](images/Stage%202/Constraint.png)

**2. Logic Stock Constraint:**
**Description:** Prevents errors by ensuring MinimumStock never exceeds a logical maximum (e.g., 10,000).
```sql
ALTER TABLE INVENTORY 
ADD CONSTRAINT check_min_stock_limit CHECK (MinimumStock <= 10000);
```

**3. Contact Uniqueness Constraint:**
**Description:** Ensures that no two stores share the same phone number.
```sql
ALTER TABLE STORE 
ADD CONSTRAINT unique_store_phone UNIQUE (Phone);
```


---

### 6. Indexes

**INDEX 1: Optimizing Product Name searches (Textual search)**
**Description:** Useful for customer-facing search bars.
```sql
EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ProductName = 'Coconut - Creamed, Pure';
```
![Index Before](images/Stage%202/IndexBefore.png)
```sql
CREATE INDEX idx_product_name ON PRODUCT(ProductName);

EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ProductName = 'Coconut - Creamed, Pure';
```
![Index After](images/Stage%202/IndexAfter.png)


**INDEX 2: Optimizing Expiration Date queries (Date filtering)**
**Description:** Specifically improves Query 4 performance regarding stock rotation.
```sql
EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ExpirationDate BETWEEN '2026-01-01' AND '2026-12-31';

CREATE INDEX idx_expiration_date ON PRODUCT(ExpirationDate);

EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ExpirationDate BETWEEN '2026-01-01' AND '2026-12-31';
```


**INDEX 3: Optimizing Order Price analysis (Numeric range)**
**Description:** Vital for financial reporting on the 1,000+ orders now in the database.
```sql
EXPLAIN ANALYZE SELECT * FROM "ORDER" WHERE Price > 400;

CREATE INDEX idx_order_price ON "ORDER"(Price);

EXPLAIN ANALYZE SELECT * FROM "ORDER" WHERE Price > 400;
```


---

### 7. Backup
An updated backup file encompassing all Phase 2 modifications (new table states, constraints, indexes, and test data) has been generated.

💾 **Phase 2 Database Backup File:** [Backup2](Stage%202/Backup2.sql)

---

## Phase 3: System Integration

### Phase 3 Introduction
In this phase we merge our Logistics system with the database of **another team**. Each team receives a backup of another team's project and must integrate the two databases into a **single unified database**.

We applied **Integration Method A** (the *merge* approach): the received database is not kept as a separate system — its structure and data are absorbed into our existing database using only `CREATE TABLE` and `ALTER TABLE` commands. **No existing table is ever recreated from scratch.**

The full integration workflow:
1. Receive the other team's `CREATE TABLE` script and database backup.
2. **Reverse-engineer** an **ERD** from their `CREATE TABLE` script, then draw the matching **DSD**.
3. Place the two ERDs (ours + theirs) side by side.
4. Design a single **integrated ERD**, documenting every design decision.
5. Derive the new schema from the integrated ERD and apply it with `ALTER`/`CREATE` only — see `Integrate.sql`.
6. Populate every table with data from **both** databases.
7. Re-run the Phase 2 queries on the integrated database to confirm they still work.

The received database is a **retail / orders system**: customers, product categories, suppliers, products, orders, order items, inventory and stores.

---

### Step 1 - Reverse Engineering: from SQL to ERD and DSD

We received two files from the other team: their **`createTables.sql`** script and a **database backup**. They serve two different purposes in our workflow:

- the **`createTables.sql`** script is the input read by our reverse-engineering algorithm to automatically rebuild their ERD and DSD — this is the step described below;
- the **database backup** (`backup2_01_25_26.sql`) is used only later, to restore their actual data into pgAdmin inside a separate `db2` schema (see Step 6).

The assignment requires a **reverse-engineering algorithm**: a documented procedure that takes the received system's tables and produces its conceptual and logical diagrams. We implemented this algorithm as a single Python program that generates **both images simultaneously**.

- 🐍 **Algorithm code:** [txt_to_graphviz.py](Stage%203/txt_to_graphviz.py)

#### How the algorithm works

The program reads the received `createTables.sql` file and rebuilds the diagrams step by step:

**1. Parse the SQL.** Comments are stripped, then a regular expression isolates every `CREATE TABLE name ( ... );` block.

**2. Extract the structure of each table.** For every table the algorithm collects:
* the **primary-key** columns (from a `PRIMARY KEY (...)` clause or an inline declaration);
* the **foreign-key** columns and the table each one references (from `FOREIGN KEY (...) REFERENCES ...`);
* the remaining **normal columns**.

**3. Apply the reverse-engineering rules** — this is the core logic that turns a physical schema back into a conceptual diagram:

| What is found in the SQL | What it becomes in the ERD / DSD |
| :--- | :--- |
| A foreign-key column that is **part of the primary key** | An **identifying relationship** → the table is a **weak entity** (drawn with a double rectangle in ERD) |
| A column **without** `NOT NULL` | An **optional attribute**, marked `(O)` |
| A foreign-key column **not** in the primary key | A normal **N : 1 relationship** (the table holding the FK is the "many" side, the referenced table is the "one" side) |
| A `PRIMARY KEY` column | A **key attribute**, drawn underlined |

**4. Build the diagrams (DOT Language).** The script translates these rules into two separate Graphviz descriptions:
* **For the ERD:** Uses Chen notation (rectangles for entities, ellipses for attributes, diamonds for relationships).
* **For the DSD:** Generates HTML-like tables mirroring the **ERDPlus** style (primary keys placed above a separator line, foreign keys tagged with `[FK]`).

**5. Render the images.** The algorithm sends both DOT codes to a public Graphviz API (`quickchart.io/graphviz`), which automatically downloads and saves the final PNG images directly into our project folder.

#### Result — ERD of the received department

Running the script automatically produced `erd_new.png`:

![ERD of the New Department (reverse engineered)](Stage%203/erd_new.png)

---

### Step 2 - DSD of the Received Department

Thanks to our Python script, the **DSD (Relational Schema)** of the received department (their 8 tables: `customer`, `category`, `supplier`, `product`, `orders`, `orderitem`, `inventory`, `store`) was generated automatically alongside the ERD, perfectly formatted for our report:

![DSD of the New Department](Stage%203/dsd_new.png)
---

### Step 3 - The Two ERDs

At this point we hold **two** ERDs:

- **Our original ERD** — the Logistics system (warehouses, trucks, delivery companies, stores, orders), shown earlier in [Phase 1](#erd-entity-relationship-diagram).
- **The received ERD** — the retail/orders system reconstructed in Step 2 (`erd_new.png`).

These two diagrams are the input for the design-level integration of the next step.

---

### Step 4 - Integrated ERD & Design Decisions

We merged the two ERDs into a single **integrated ERD** using ERDPlus:

![Integrated ERD](Stage%203/erd_integration.png)

Designing the combined model required several decisions, documented here:

- **New entities adopted from the received system:** `CUSTOMER`, `CATEGORY` and `SUPPLIER` are added as new tables.
- **`PRODUCT` gains two links:** a mandatory link to `CATEGORY` and an **optional** link to `SUPPLIER`. The link to a supplier is optional on purpose — products from our original system have no supplier, so not every product is required to have one.
- **`ORDER` can now belong to a Store *or* a Customer:** the received system attaches orders to customers, while our system attaches them to stores and drivers. In the integrated model `StoreID`, `DriverID` and the new `CustomerID` all become optional, and a rule guarantees that every order is linked to **at least one** of the two sides.
- **`ORDER` gains `PaymentMethod` and `Status`** from the received system.
- **`CONTAINS` absorbs the received `orderitem`:** it gains `SubTotal`, `InOnSale` and `SaleDescription`.
- **`INVENTORY` gains a link to `STORE`:** the received inventory is tracked per store, so an inventory row is now attached to a store.
- **`WAREHOUSE_WAREHOUSEMANAGER` is kept**, alongside the new `SUPPLIER` table.
- **`INVENTORY` stays a regular entity:** although it could be drawn as a weak entity, both source schemas define its primary key as `ProductID` alone, so it is kept as a regular entity in the final model.

---

### Step 5 - DSD After Integration

From the integrated ERD we derived the **DSD of the integrated database**:

![DSD After Integration](Stage%203/dsd_integration.png)

This DSD is the physical blueprint that `Integrate.sql` builds — but, crucially, it is built by **altering the existing tables**, never by dropping and recreating them.

---

### Step 6 - Schema Changes (Integrate.sql)

All structural and data changes are applied by a single script, executed once inside one transaction (`BEGIN ... COMMIT`) so that any failure rolls everything back.

- 📜 **Integration script:** [Integrate.sql](Stage%203/Integrate.sql)

#### Preparing the data source

The received backup was a UTF-16 dump that used `COPY ... FROM stdin`, which the pgAdmin Query Tool cannot run. We converted it to a UTF-8 file using standard `INSERT` statements, and restored it into a **separate schema named `db2`** inside the same database. Our original tables stay in the `public` schema. `Integrate.sql` then reads the received data from `db2` and writes it into `public`.

#### What Integrate.sql takes into account

**ID offset.** Both databases use their own `ProductID`, `OrderId` and `StoreID` values, so the same number can exist in both. Every received id is shifted by **+10000** before insertion, and the same offset is reused everywhere a shifted id appears (inventory, order items), so all links stay consistent.

**Part 1 - New tables.** `CATEGORY`, `CUSTOMER` and `SUPPLIER` are created.

**Part 2 - Altering existing tables.** New columns are added (`PRODUCT.CategoryID`, `PRODUCT.SupplierID`, `ORDER.PaymentMethod`, `ORDER.Status`, `ORDER.CustomerID`, `CONTAINS.SubTotal`, `CONTAINS.InOnSale`, `CONTAINS.SaleDescription`, `INVENTORY.StoreID`). They are added as nullable first, since existing rows have no value yet. `ORDER.StoreID` and `ORDER.DriverID` lose their `NOT NULL` so an order may instead belong to a customer.

**Part 3 - Filling our existing rows.** Existing products receive a default `'no category'`; existing orders receive `PaymentMethod = 'Cash'`; existing `CONTAINS` rows get a computed `SubTotal` (`Quantity × Price`) and `InOnSale = FALSE`; existing inventory rows are attached to one of our stores.

**Part 4 - Importing the received data.** Categories, suppliers and customers are copied directly. Products, orders, inventory and order items are imported with the +10000 offset. The received `orderitem` is merged into `CONTAINS`, summing quantities of duplicated (order, product) lines.

**Data-quality handling — constraints are kept, invalid rows are skipped.** Rather than weakening any constraint, rows that would violate one are filtered out: received products whose `ExpirationDate` is earlier than `DateOfManufacture` are skipped (with their dependent inventory and order lines), received stores with a duplicate phone number are skipped, and store ratings are clamped into the valid 1–5 range.

**`INVENTORY` and stores.** Every inventory row — ours and the imported ones — is attached to an existing store using a round-robin distribution, so the `StoreID` link is always valid.

**Part 5 - Locking the schema.** Once data is in place, columns are made `NOT NULL` where the data allows it, and the new foreign keys (`fk_product_category`, `fk_product_supplier`, `fk_order_customer`, `fk_inventory_store`) and the order-ownership check are added.

---

### Step 7 - Data Verification

After running `Integrate.sql`, every table holds data from **both** original databases. The screenshots below show the database state **before** and **after** the integration:

| Before Integration | After Integration |
| :---: | :---: |
| ![Before Integration](images/Stage%203/before_integration.png) | ![After Integration](images/Stage%203/after_integration.png) |

We also re-executed the **Phase 2 queries** on the integrated database to confirm that the schema changes did not break any existing query — they all still run correctly on the unified data.

---

### Step 8 - Backup (backup3)

A complete, updated SQL dump of the **integrated database** was generated. It captures the final unified schema together with the merged data from both teams, and guarantees that the integrated system can be fully restored.

- 💾 **Integrated Database Backup:** [backup3.sql](Stage%203/backup3.sql)

---

### Views

As required, we wrote **two views** — one from the perspective of each original department — plus **two queries per view**. Both views combine two tables with a `JOIN`, and neither is a plain field extraction.

- 📜 **Views script:** [Views.sql](Stage%203/Views.sql)

#### View 1 — `company_fleet_summary` *(our original department)*

**Description:** For each delivery company, this view summarises its truck fleet — total number of trucks, number of active trucks, and total / average hauling capacity. It **joins** `DELIVERYCOMPAGNY` with `TRUCK` and groups the result per company.

```sql
CREATE VIEW company_fleet_summary AS
SELECT d.DeliveryCieID,
       d.DeliveryCieName,
       COUNT(t.DriverID)                             AS total_trucks,
       SUM(CASE WHEN t.Active = 1 THEN 1 ELSE 0 END) AS active_trucks,
       SUM(t.Capacity)                               AS total_capacity,
       ROUND(AVG(t.Capacity), 2)                     AS avg_capacity
FROM DELIVERYCOMPAGNY d
JOIN TRUCK t ON t.DeliveryCieID = d.DeliveryCieID
GROUP BY d.DeliveryCieID, d.DeliveryCieName;
```

**Data from the view (`SELECT * FROM company_fleet_summary`):**

![View 1 - SELECT *](images/Stage%203/View1.png)

**Query 1.1 — Largest fleets.** Delivery companies that operate at least 3 trucks, ordered by the largest total hauling capacity first.
```sql
SELECT *
FROM company_fleet_summary
WHERE total_trucks >= 3
ORDER BY total_capacity DESC;
```
![Query 1.1 Result](images/Stage%203/Query1.1.png)

**Query 1.2 — Fleet size vs. coverage.** Compares each company's fleet size with the number of regions it serves, using the additional table `DELIVERYCOMPAGNY_REGIONSERVED`.
```sql
SELECT f.DeliveryCieName,
       f.total_trucks,
       f.active_trucks,
       COUNT(r.RegionServed) AS regions_covered
FROM company_fleet_summary f
JOIN DELIVERYCOMPAGNY_REGIONSERVED r
  ON r.DeliveryCieID = f.DeliveryCieID
GROUP BY f.DeliveryCieName, f.total_trucks, f.active_trucks
ORDER BY regions_covered DESC;
```
![Query 1.2 Result](images/Stage%203/Query1.2.png)

#### View 2 — `customer_order_summary` *(the received department)*

**Description:** For each customer, this view summarises their ordering activity — number of orders placed, total amount spent, and average order value. It **joins** `CUSTOMER` (a received table) with `ORDER` using a `LEFT JOIN`, so that customers who never ordered still appear with zero values.

```sql
CREATE VIEW customer_order_summary AS
SELECT c.CustomerID,
       c.CustomerName,
       c.City,
       COUNT(o.OrderId)                    AS total_orders,
       COALESCE(SUM(o.Price), 0)           AS total_spent,
       COALESCE(ROUND(AVG(o.Price), 2), 0) AS avg_order_value
FROM CUSTOMER c
LEFT JOIN "ORDER" o ON o.CustomerID = c.CustomerID
GROUP BY c.CustomerID, c.CustomerName, c.City;
```

**Data from the view (`SELECT * FROM customer_order_summary`):**

![View 2 - SELECT *](images/Stage%203/View2.png)

**Query 2.1 — Top customers.** The ten customers who spent the most money overall (only customers who placed at least one order).
```sql
SELECT *
FROM customer_order_summary
WHERE total_orders > 0
ORDER BY total_spent DESC
LIMIT 10;
```
![Query 2.1 Result](images/Stage%203/Query2.1.png)

**Query 2.2 — Revenue per city.** Total amount spent by all customers of each city, with how many customers contribute to it, ranked from the highest revenue to the lowest.
```sql
SELECT City,
       COUNT(*)         AS customers_in_city,
       SUM(total_spent) AS city_revenue
FROM customer_order_summary
GROUP BY City
ORDER BY city_revenue DESC;
```
![Query 2.2 Result](images/Stage%203/Query2.2.png)

---
 
## Phase 4: Programming (PL/pgSQL)
 
### Phase 4 Introduction
In this phase, we implemented advanced business logic directly inside the PostgreSQL database using **PL/pgSQL**. The goal was to create non-trivial programs that bridge our Logistics (Rami Levy) and Retail systems.
 
This section includes **functions**, **procedures**, **triggers**, and **main programs** that utilize complex programming elements such as explicit/implicit cursors, Ref Cursors, records, loops, branching (IF/ELSE), exception handling, and DML operations.
 
---
 
### 1. Functions
 
#### Function 1: Predictive Stock Depletion Algorithm (`generate_predictive_restock_plan`)
 
**Description:** Instead of a standard low-stock alert, this function acts as a **predictive algorithm**. It calculates the sales velocity of each product in a specific store over the last 30 days and predicts exactly how many days are left before a stockout. It then assigns a dynamic alert level (`CRITICAL`, `WARNING`, `BELOW MIN STOCK`, or `SAFE`).
 
**Elements used:**
- **[a]** Explicit Cursor (`cur_inventory`) to loop through inventory + Implicit Cursor (`SELECT INTO`) for sales aggregation
- **[b]** Returns a **Ref Cursor** (`v_report_cursor`)
- **[c]** DML — creates a `TEMP` table and performs mass `INSERT`
- **[d]** Branching (`IF/ELSIF/ELSE`) to prevent division by zero and assign alert levels
- **[e]** `LOOP / FETCH / EXIT` for cursor iteration
- **[f]** Exception handling — business exception if store doesn't exist + global catch
- **[g]** Records (`RECORD` type to hold current inventory row)
**Source Code:**
```sql
CREATE OR REPLACE FUNCTION generate_predictive_restock_plan(p_store_id INT)
RETURNS refcursor
LANGUAGE plpgsql
AS $$
DECLARE
    v_report_cursor refcursor;
    v_store_check INT;
    v_total_sold INT;
    v_daily_velocity NUMERIC(10,2);
    v_days_left INT;
    v_alert_level VARCHAR(20);
    v_days_history INT := 30;
    v_prod_record RECORD;
 
    cur_inventory CURSOR FOR
        SELECT i.ProductID, p.ProductName, i.Quantity, i.MinimumStock
        FROM INVENTORY i
        JOIN PRODUCT p ON i.ProductID = p.ProductID
        WHERE i.StoreID = p_store_id;
BEGIN
    SELECT StoreID INTO v_store_check FROM STORE WHERE StoreID = p_store_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error: Store ID % does not exist in the database.', p_store_id;
    END IF;
 
    DROP TABLE IF EXISTS temp_stock_prediction;
    CREATE TEMP TABLE temp_stock_prediction (
        ProductID INT, ProductName VARCHAR, CurrentStock INT, MinimumStock INT,
        DailyVelocity NUMERIC(10,2), DaysUntilEmpty INT, AlertLevel VARCHAR
    );
 
    OPEN cur_inventory;
    LOOP
        FETCH cur_inventory INTO v_prod_record;
        EXIT WHEN NOT FOUND;
 
        SELECT COALESCE(SUM(c.Quantity), 0) INTO v_total_sold
        FROM "ORDER" o
        JOIN CONTAINS c ON o.OrderId = c.OrderId
        WHERE o.StoreID = p_store_id
          AND c.ProductID = v_prod_record.ProductID
          AND o.OrderDate >= CURRENT_DATE - v_days_history;
 
        IF v_total_sold > 0 THEN
            v_daily_velocity := v_total_sold::NUMERIC / v_days_history;
            v_days_left := ROUND(v_prod_record.Quantity / NULLIF(v_daily_velocity, 0));
        ELSE
            v_daily_velocity := 0;
            v_days_left := 9999;
        END IF;
 
        IF v_days_left <= 3 THEN
            v_alert_level := 'CRITICAL';
        ELSIF v_days_left <= 7 THEN
            v_alert_level := 'WARNING';
        ELSIF v_prod_record.Quantity < v_prod_record.MinimumStock THEN
            v_alert_level := 'BELOW MIN STOCK';
        ELSE
            v_alert_level := 'SAFE';
        END IF;
 
        INSERT INTO temp_stock_prediction
        VALUES (v_prod_record.ProductID, v_prod_record.ProductName, v_prod_record.Quantity,
                v_prod_record.MinimumStock, v_daily_velocity, v_days_left, v_alert_level);
    END LOOP;
    CLOSE cur_inventory;
 
    OPEN v_report_cursor FOR SELECT * FROM temp_stock_prediction ORDER BY DaysUntilEmpty ASC;
    RETURN v_report_cursor;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'System error: %', SQLERRM;
        RAISE;
END;
$$;
```
 
**How to test:**
```sql
BEGIN;
SELECT generate_predictive_restock_plan(1);
-- Note the portal name returned (e.g., "<unnamed portal 1>")
FETCH ALL IN "<unnamed portal 1>";
--and then commit to see the changes in the temp table
COMMIT;
```

**Proof of Execution:**
 
*Success Execution (Ref Cursor returning stock predictions):*
 
![Function 1 - Execution](images/Stage%204/Function1_execution.png)
![Function1 - Testing result ](images/Stage%204/Function1_result.png)
 
*Exception Handling (Invalid Store ID):*

```sql
SELECT generate_predictive_restock_plan(99999);
--testing with a store that does not exist
```
 
![Function 1 - Exception](images/Stage%204/Function1_exception.png)
 
---
 
#### Function 2: Fleet Loading Optimizer (`optimize_fleet_loading`)
 
**Description:** This function automates the assignment of pending orders to delivery trucks. It acts like **"Logistics Tetris"** — iterating through the active trucks of a delivery company (ordered by capacity) and filling each one with unassigned orders until it reaches maximum capacity.
 
**Elements used:**
- **[a]** Explicit Cursor (`cur_active_trucks`) for trucks + Implicit Cursor (`FOR` loop) for orders
- **[b]** Returns a **Ref Cursor** (`v_manifest_cursor`)
- **[c]** Multiple DML — `UPDATE` on the real `ORDER` table + `INSERT` into a temp manifest
- **[d]** Branching (`IF/ELSE`) to enforce truck capacity constraints
- **[e]** Nested loops — outer loop for trucks, inner `FOR` loop for orders
- **[f]** Exception handling — business exception for invalid company + `unique_violation` catch
- **[g]** Records (`RECORD` types for truck and order rows)
**Source Code:**
```sql
CREATE OR REPLACE FUNCTION optimize_fleet_loading(p_delivery_cie_id INT)
RETURNS refcursor
LANGUAGE plpgsql
AS $$
DECLARE
    v_manifest_cursor refcursor;
    v_cie_check INT;
    v_current_truck_load INT;
    v_total_assigned INT := 0;
    v_truck_record RECORD;
    v_order_record RECORD;
 
    cur_active_trucks CURSOR FOR
        SELECT DriverID, Capacity FROM TRUCK
        WHERE DeliveryCieID = p_delivery_cie_id AND Active = 1
        ORDER BY Capacity DESC;
BEGIN
    SELECT DeliveryCieID INTO v_cie_check FROM DELIVERYCOMPAGNY WHERE DeliveryCieID = p_delivery_cie_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operation cancelled: Delivery company % does not exist.', p_delivery_cie_id;
    END IF;
 
    DROP TABLE IF EXISTS temp_loading_manifest;
    CREATE TEMP TABLE temp_loading_manifest (
        DriverID INT, AssignedOrderID INT, TruckCapacity INT, AssignmentTime TIMESTAMP
    );
 
    OPEN cur_active_trucks;
    LOOP
        FETCH cur_active_trucks INTO v_truck_record;
        EXIT WHEN NOT FOUND;
 
        v_current_truck_load := 0;
        FOR v_order_record IN
            SELECT OrderId FROM "ORDER" WHERE DriverID IS NULL ORDER BY OrderDate ASC
        LOOP
            IF v_current_truck_load < v_truck_record.Capacity THEN
                UPDATE "ORDER" SET DriverID = v_truck_record.DriverID WHERE OrderId = v_order_record.OrderId;
                INSERT INTO temp_loading_manifest
                VALUES (v_truck_record.DriverID, v_order_record.OrderId, v_truck_record.Capacity, CURRENT_TIMESTAMP);
                v_current_truck_load := v_current_truck_load + 1;
                v_total_assigned := v_total_assigned + 1;
            ELSE
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
    CLOSE cur_active_trucks;
 
    IF v_total_assigned = 0 THEN
        RAISE NOTICE 'No orders assigned.';
    END IF;
 
    OPEN v_manifest_cursor FOR SELECT * FROM temp_loading_manifest ORDER BY DriverID, AssignedOrderID;
    RETURN v_manifest_cursor;
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Duplication error during assignment.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Algorithm error: %', SQLERRM;
END;
$$;
```
 
**How to test:**
```sql
BEGIN;
SELECT optimize_fleet_loading(1);
-- Note the portal name returned (e.g., "<unnamed portal 2>")
FETCH ALL IN "<unnamed portal 2>";
COMMIT;
```
 
**Proof of Execution:**
 
*Success Execution (Manifest showing capacity distribution):*
 
![Function 2 - Execution](images/Stage%204/Function2_execution.png)
![Function2 - Testing Result](images/Stage%204/Function2_result.png)
 
*Exception Handling (Invalid Company ID):*
 
```sql
SELECT optimize_fleet_loading(99999);
--testing with a company that does not exist
```
 
![Function 2 - Exception](images/Stage%204/Function2_exception.png)
 
---
 
### 2. Procedures
 
#### Procedure 1: Emergency Inter-Store Inventory Transfer (`process_store_inventory_transfer`)
 
**Description:** This procedure acts as a **safety protocol** to balance stock between stores. When a store urgently needs a product, it automatically identifies another store with the most excess stock of that exact product and safely transfers the requested quantity — ensuring the source store never drops below its required minimum stock level.
 
**Elements used:**
- **[a]** Implicit Cursor (`SELECT INTO`) to find the optimal source store
- **[c]** Multiple DML — `UPDATE` source store (deduct) + `UPDATE` target store (add)
- **[d]** Branching (`IF/ELSE`) to validate stock availability before transfer
- **[f]** Exception handling — business exception if product missing or no surplus store + global `ROLLBACK`
- **[g]** Records (`RECORD` type to hold source store data)
**Source Code:**
```sql
CREATE OR REPLACE PROCEDURE process_store_inventory_transfer(
    p_product_id INT,
    p_target_store_id INT,
    p_transfer_qty INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_store RECORD;
    v_product_exists INT;
BEGIN
    -- Business Exception: Check if the product exists
    SELECT ProductID INTO v_product_exists FROM PRODUCT WHERE ProductID = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer cancelled: Product % does not exist.', p_product_id;
    END IF;
 
    -- Implicit cursor: Find the best source store (most excess stock)
    SELECT StoreID, Quantity INTO v_source_store
    FROM INVENTORY
    WHERE ProductID = p_product_id
      AND StoreID != p_target_store_id
      AND Quantity >= (MinimumStock + p_transfer_qty)
    ORDER BY Quantity DESC
    LIMIT 1;
 
    IF v_source_store.StoreID IS NULL THEN
        RAISE EXCEPTION 'Failed: No store has enough excess stock for product %.', p_product_id;
    ELSE
        -- DML 1: Deduct from source store
        UPDATE INVENTORY
        SET Quantity = Quantity - p_transfer_qty
        WHERE ProductID = p_product_id AND StoreID = v_source_store.StoreID;
 
        -- DML 2: Add to target store
        UPDATE INVENTORY
        SET Quantity = Quantity + p_transfer_qty
        WHERE ProductID = p_product_id AND StoreID = p_target_store_id;
 
        RAISE NOTICE 'SUCCESS: % units of product % transferred from Store % to Store %.',
                     p_transfer_qty, p_product_id, v_source_store.StoreID, p_target_store_id;
    END IF;
 
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected error occurred: %', SQLERRM;
        ROLLBACK;
END;
$$;
```
 
**How to test:**
```sql
-- Success case
CALL process_store_inventory_transfer(1, 5, 20);
 
-- Exception case (product doesn't exist)
CALL process_store_inventory_transfer(1,1,99999);
```
 
**Proof of Execution:**
![Procedure 1 - Creation ](images/Stage%204/Procedure1-creation.png)


![Procedure 1 - Execution](images/Stage%204/Procedure1_execution.png)

![Procedure 1 - Before Execution ](images/Stage%204/Procedure1_before.png)

![Procedure1 - After Execution ](images/Stage%204/Procedure1_after.png)
 
*Exception Handling (No store with sufficient stock ):*
 
![Procedure 1 - Exception](images/Stage%204/Procedure1_exception.png)
 

---
 
#### Procedure 2: End-of-Month Customer Loyalty & Cleanup Batch (`monthly_customer_loyalty_batch`)
 
> **⚠️ Schema Prerequisite:** Before running this procedure, execute the following `ALTER TABLE` command to add the `LoyaltyTier` column to the `CUSTOMER` table:
> ```sql
> ALTER TABLE CUSTOMER ADD COLUMN IF NOT EXISTS LoyaltyTier VARCHAR(20) DEFAULT 'Standard';
> ```
 
**Description:** This maintenance procedure is designed to run automatically at the **end of each month**. It iterates through the entire customer database, calculates each customer's total historical spending, and updates their `LoyaltyTier` (`VIP Gold`, `Premium`, or `Standard`). It also performs a routine **database cleanup** by deleting old cancelled orders to optimize storage.
 
**Elements used:**
- **[a]** Explicit Cursor (`cur_customers`) to iterate all customers + Implicit Cursor (`SELECT INTO`) for spending aggregation
- **[c]** Massive DML — bulk `UPDATE` for loyalty tiers + bulk `DELETE` for cleanup
- **[d]** Branching (`IF/ELSIF/ELSE`) for tier classification logic
- **[e]** `LOOP / FETCH / EXIT` for cursor iteration
- **[f]** Global exception handling with safe `ROLLBACK` for incomplete batches
**Source Code:**
```sql
CREATE OR REPLACE PROCEDURE monthly_customer_loyalty_batch()
LANGUAGE plpgsql
AS $$
DECLARE
    cur_customers CURSOR FOR SELECT CustomerID FROM CUSTOMER;
    v_customer_id INT;
    v_total_spent NUMERIC;
    v_new_tier VARCHAR(20);
BEGIN
    OPEN cur_customers;
    LOOP
        FETCH cur_customers INTO v_customer_id;
        EXIT WHEN NOT FOUND;
 
        -- Implicit cursor: Calculate total spending per customer
        SELECT COALESCE(SUM(Price), 0) INTO v_total_spent
        FROM "ORDER"
        WHERE CustomerID = v_customer_id;
 
        -- Branching: Assign loyalty tier based on spending
        IF v_total_spent >= 5000 THEN
            v_new_tier := 'VIP Gold';
        ELSIF v_total_spent >= 1000 THEN
            v_new_tier := 'Premium';
        ELSE
            v_new_tier := 'Standard';
        END IF;
 
        -- DML 1: Update the customer's loyalty tier
        UPDATE CUSTOMER
        SET LoyaltyTier = v_new_tier
        WHERE CustomerID = v_customer_id;
 
    END LOOP;
    CLOSE cur_customers;
 
    -- DML 2: Cleanup — delete old cancelled orders (> 1 year)
    DELETE FROM "ORDER"
    WHERE Status = 'Cancelled' AND OrderDate < CURRENT_DATE - INTERVAL '1 year';
 
    RAISE NOTICE 'SUCCESS: End-of-month batch completed. Loyalty tiers updated and old cancelled orders removed.';
 
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Batch process failed due to an unexpected error: %', SQLERRM;
        ROLLBACK;
END;
$$;
```
 
**How to test:**
```sql
-- Run the batch
CALL monthly_customer_loyalty_batch();
 
-- Verify loyalty tiers were assigned
SELECT CustomerID, CustomerName, LoyaltyTier FROM CUSTOMER LIMIT 20;
```
 
**Proof of Execution:**
 
![Procedure 2 - Creation ](images/Stage%204/Procedure2-creation.png)

![Procedure 2 - Execution](images/Stage%204/Procedure2_execution.png)

![Procedure 2 - Before Execution ](images/Stage%204/Procedure2_before.png)

![Procedure 2 - After Execution ](images/Stage%204/Procedure2_after.png)
 
 
---
### 3. Triggers

#### Trigger 1: Fleet Emergency Reassignment (ON UPDATE)

**Description:** This trigger simulates a real-world logistics crisis. When a truck breaks down and its `Active` status is changed from `1` to `0`, this trigger automatically unassigns that driver from ALL pending orders. This prevents orders from being stuck and frees them up to be reassigned by the fleet optimizer function.
**Elements used:**
- Fires `AFTER UPDATE` on the `TRUCK` table.
- **[d]** Branching (`IF`) to only act when the status specifically changes from 1 to 0 (`OLD.Active = 1 AND NEW.Active = 0`).
- **[c]** Massive DML (`UPDATE`) on the `"ORDER"` table to remove the driver.
- **[f]** Exception handling to catch and log any unexpected failures.

**Source Code:**
```sql
CREATE OR REPLACE FUNCTION fn_fleet_emergency_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_orders_freed INT;
BEGIN
    -- Only act when a truck goes from Active (1) to Inactive (0)
    IF OLD.Active = 1 AND NEW.Active = 0 THEN
        UPDATE "ORDER"
        SET DriverID = NULL
        WHERE DriverID = OLD.DriverID
          AND DeliveryDate IS NULL;

        GET DIAGNOSTICS v_orders_freed = ROW_COUNT;

        RAISE NOTICE 'ALERT: Truck (DriverID=%) went offline. % pending orders have been freed for reassignment.',
                     OLD.DriverID, v_orders_freed;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Fleet emergency trigger failed for DriverID %: %', OLD.DriverID, SQLERRM;
END;
$$;

CREATE OR REPLACE TRIGGER trg_fleet_emergency_reassignment
AFTER UPDATE OF Active ON TRUCK
FOR EACH ROW
EXECUTE FUNCTION fn_fleet_emergency_reassignment();
```

**How to test:**
```sql
-- Simulate truck breakdown for DriverID 2
UPDATE TRUCK SET Active = 0 WHERE DriverID = 3;
```

**Proof of Execution:**

*Trigger automatically freeing up orders when a truck is marked inactive:*

![Trigger 1 - Execution](images/Stage%204/Trigger1_execute.png)
![Trigger 1 - Verification](images/Stage%204/Trigger1_verify.png)

---

#### Trigger 2: Real-time Inventory Deduction (ON INSERT)

**Description:** Simulates the core of a supermarket's point-of-sale system. Every time a product line is added to an order (`INSERT` into `CONTAINS`), this trigger automatically deducts the purchased quantity from the `INVENTORY` of the relevant store. It also guards against negative stock and raises warnings for low stock.
**Elements used:**
- Fires `AFTER INSERT` on the `CONTAINS` table.
- **[a]** Implicit Cursors (`SELECT INTO`) to fetch the order's store context and current inventory.
- **[d]** Branching (`IF`) to enforce inventory limits and trigger alerts.
- **[c]** DML (`UPDATE`) to actively adjust the inventory quantities.
- **[f]** Exception Handling to block the transaction if stock is insufficient.

**Source Code:**
```sql
CREATE OR REPLACE FUNCTION fn_realtime_inventory_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_store_id     INT;
    v_current_qty  INT;
    v_min_stock    INT;
BEGIN
    SELECT StoreID INTO v_store_id FROM "ORDER" WHERE OrderId = NEW.OrderId;
    IF v_store_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT Quantity, MinimumStock INTO v_current_qty, v_min_stock
    FROM INVENTORY
    WHERE ProductID = NEW.ProductID AND StoreID = v_store_id;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    IF v_current_qty < NEW.Quantity THEN
        RAISE EXCEPTION 'Insufficient stock: product % has only % units in store %, but % were ordered.',
                        NEW.ProductID, v_current_qty, v_store_id, NEW.Quantity;
    END IF;

    UPDATE INVENTORY
    SET Quantity = Quantity - NEW.Quantity
    WHERE ProductID = NEW.ProductID AND StoreID = v_store_id;

    IF (v_current_qty - NEW.Quantity) < v_min_stock THEN
        RAISE NOTICE 'LOW STOCK WARNING: Product % in store % is now below minimum stock.', NEW.ProductID, v_store_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_realtime_inventory_deduction
AFTER INSERT ON CONTAINS
FOR EACH ROW
EXECUTE FUNCTION fn_realtime_inventory_deduction();
```

**How to test:**
```sql
-- Provoking trigger2 by requesting an order that exceeds the available stock
INSERT INTO CONTAINS (OrderId, ProductID, Quantity, SubTotal, InOnSale) 
VALUES (1, 1, 99999, 50.00, FALSE);
```

**Proof of Execution:**

*Trigger successfully deducting inventory and raising a low-stock warning:*

![Trigger 2 - Execution](images/Stage%204/Trigger2_execute.png)
![Trigger 2 - Verification](images/Stage%204/Trigger2_verify.png)

---

### 4. Main Programs

To tie our subprograms together into practical business use-cases, we created two Main Programs (Anonymous `DO` blocks). Each program integrates exactly **one Function and one Procedure** within a unified workflow.

#### Main Program 1: The Morning Dispatch
**Business Scenario:** Executed by the logistics manager at 6:00 AM. It calls `optimize_fleet_loading` (**Function 2**) to assign all pending deliveries to available trucks, and then immediately calls `process_store_inventory_transfer` (**Procedure 1**) to resolve an overnight stock shortage before the stores open.

**Source Code:**
```sql
DO $$
DECLARE
    v_manifest       refcursor;
    v_driver_id      INT;
    v_order_id       INT;
    v_capacity       INT;
    v_assigned_time  TIMESTAMP;
    v_total_assigned INT := 0;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE ' RAMI LEVY LOGISTICS — MORNING DISPATCH';
    RAISE NOTICE '=======================================================';

    RAISE NOTICE '[STEP 1] Loading trucks for Delivery Company #1...';
    BEGIN
        v_manifest := optimize_fleet_loading(1);
        LOOP
            FETCH v_manifest INTO v_driver_id, v_order_id, v_capacity, v_assigned_time;
            EXIT WHEN NOT FOUND;
            v_total_assigned := v_total_assigned + 1;
            RAISE NOTICE '  -> Driver % assigned to Order % (Truck Cap: %)', v_driver_id, v_order_id, v_capacity;
        END LOOP;
        CLOSE v_manifest;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Fleet loading error: %', SQLERRM;
    END;

    RAISE NOTICE '';
    RAISE NOTICE '[STEP 2] Resolving overnight stock alert for Store #5...';
    BEGIN
        CALL process_store_inventory_transfer(1, 5, 30);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Stock transfer failed: %', SQLERRM;
    END;
END;
$$;
```

**Proof of Execution:**

![Main Program 1 - Output](images/Stage%204/Main1_execute.png)

---

#### Main Program 2: The Director's Monthly Audit
**Business Scenario:** Run by a store director on the last day of the month. It calls `generate_predictive_restock_plan` (**Function 1**) to print a dynamic stockout risk report for the upcoming month, and then executes `monthly_customer_loyalty_batch` (**Procedure 2**) to assign VIP tiers and clean the database.

**Source Code:**
```sql
DO $$
DECLARE
    v_report         refcursor;
    v_product_id     INT;
    v_product_name   VARCHAR;
    v_current_stock  INT;
    v_min_stock      INT;
    v_daily_velocity NUMERIC;
    v_days_left      INT;
    v_alert_level    VARCHAR;
    v_target_store   INT := 1;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE ' RAMI LEVY — END-OF-MONTH AUDIT — STORE #%', v_target_store;
    RAISE NOTICE '=======================================================';

    RAISE NOTICE '[STEP 1] Generating predictive stock report...';
    BEGIN
        v_report := generate_predictive_restock_plan(v_target_store);
        LOOP
            FETCH v_report INTO v_product_id, v_product_name, v_current_stock,
                                v_min_stock, v_daily_velocity, v_days_left, v_alert_level;
            EXIT WHEN NOT FOUND;
            IF v_alert_level != 'SAFE' THEN
                RAISE NOTICE '% | Stock: % | Min: % | Days Left: % | %',
                             LEFT(v_product_name, 20), v_current_stock, v_min_stock, v_days_left, v_alert_level;
            END IF;
        END LOOP;
        CLOSE v_report;
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Report generation failed: %', SQLERRM;
    END;

    RAISE NOTICE '';
    RAISE NOTICE '[STEP 2] Running monthly customer loyalty batch...';
    BEGIN
        CALL monthly_customer_loyalty_batch();
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Loyalty batch failed: %', SQLERRM;
    END;
END;
$$;
```

**Proof of Execution:**

![Main Program 2 - Output](images/Stage%204/Main2_execute.png)

---

### 5. Backup

A final, comprehensive SQL dump has been generated, capturing all tables, data, views, and PL/pgSQL programs (functions, procedures, and triggers) developed across all phases.

- 💾 **Final Database Backup:** [backup4.sql](Stage%204/backup4.sql)

---

## Phase 5: Full-Stack Web Application

### Phase 5 Overview

Stage 5 is the final phase of the project. It builds a complete, production-style full-stack web application on top of the PostgreSQL database designed in previous stages.

The application provides **four distinct role-based dashboards**, each tailored to a specific type of user:

| Role | Description |
|------|-------------|
| **Customer** | Browse the product catalog, place orders, view order history, manage profile |
| **Store Manager** | Monitor inventory, send restock requests, browse catalog, track supply orders |
| **Driver** | View assigned deliveries, update order status, track monthly activity |
| **Admin** | Full CRUD access to all entities: drivers, customers, products, stores, warehouses, orders |

---

### Architecture

```
┌──────────────────────────────────────────────────┐
│                   FRONTEND                        │
│         React + Vite + TailwindCSS               │
│  (LoginPage, CustomerDashboard, StoreDashboard,  │
│   DriverDashboard, AdminDashboard, SalesChart)   │
│                   PORT 5173                       │
└───────────────────┬──────────────────────────────┘
                    │  HTTP REST API (fetch)
                    ▼
┌──────────────────────────────────────────────────┐
│                   BACKEND                         │
│            Node.js + Express.js                   │
│  routes/auth.js   routes/customer.js             │
│  routes/store.js  routes/driver.js               │
│  routes/admin.js  server.js (entry point)        │
│                   PORT 5000                       │
└───────────────────┬──────────────────────────────┘
                    │  pg (node-postgres)
                    ▼
┌──────────────────────────────────────────────────┐
│               PostgreSQL Database                 │
│           Database: new4   PORT 5432             │
└──────────────────────────────────────────────────┘
```

---

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- **PostgreSQL** v14+ (with the `new4` database from previous stages)

---

### Project Structure

```
Stage 5/
├── backend/
│   ├── .env                  # Environment variables (DB credentials)
│   ├── db.js                 # PostgreSQL connection pool
│   ├── server.js             # Express entry point, mounts all routes
│   ├── package.json
│   └── routes/
│       ├── auth.js           # POST /api/login, POST /api/forgot-password
│       ├── customer.js       # Customer CRUD + stats + orders
│       ├── store.js          # Store inventory, restock, stats, catalog
│       ├── driver.js         # Driver orders, stats, chart, profile
│       └── admin.js          # Full CRUD for all entities + chart
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                    # BrowserRouter + route definitions
        ├── LoginPage.jsx              # Login + role selector + forgot password
        ├── CustomerDashboard.jsx      # Customer portal
        ├── StoreDashboard.jsx         # Store portal
        ├── DriverDashboard.jsx        # Driver portal
        ├── SalesChart.jsx             # Reusable AreaChart (recharts)
        └── admin/
            ├── AdminDashboard.jsx
            ├── shared/
            │   ├── DataTable.jsx      # Generic reusable table
            │   ├── Drawer.jsx         # Slide-in form panel
            │   └── ui.jsx             # Shared UI primitives
            └── tabs/
                ├── OverviewTab.jsx
                ├── ProductsTab.jsx
                ├── CustomersTab.jsx
                ├── LogisticsTab.jsx
                ├── StoresTab.jsx
                ├── WarehousesTab.jsx
                ├── OrdersTab.jsx
                ├── InventoryTab.jsx
                ├── DeliveryTab.jsx
                ├── CategoriesTab.jsx
                └── SuppliersTab.jsx
```

---

### Installation & Setup

**Backend:**
```bash
cd "Stage 5/backend"
npm install
```

**Frontend:**
```bash
cd "Stage 5/frontend"
npm install
```

---

### Environment Variables

Create a `.env` file inside `Stage 5/backend/`:

```env
DB_USER_SECRET=your_database_user
DB_HOST=localhost
DB_NAME_SECRET=your_database_name
DB_PASSWORD_SECRET=your_database_password
DB_PORT=5432
PORT=5000
```

---

### Running the Application

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd "Stage 5/backend"
node server.js
# ✅ Server running on port 5000
```

**Terminal 2 — Frontend:**
```bash
cd "Stage 5/frontend"
npm run dev
# Local: http://localhost:5173/
```

Open your browser at: **http://localhost:5173**

---

### API Reference

All endpoints are prefixed with `/api`. The backend runs on **port 5000**.

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Authenticate a user. Body: `{ email, password, role }`. Role: `Customer`, `Store`, `Driver`, or `Admin`. |
| `POST` | `/api/forgot-password` | Reset password to the temporary value `reset123`. Body: `{ email, role }`. |

#### Customer Routes — `/api/customer`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customer/:id` | Fetch fresh customer data by ID |
| `PUT` | `/api/customer/update` | Update profile (password only updated if non-empty) |
| `GET` | `/api/customer/stats/:customerid` | Returns `{ totalOrders, totalSpent, loyaltyTier }` |
| `GET` | `/api/customer/orders/:customerid` | Last 5 orders for the customer |

#### Store Routes — `/api/store`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/store/:storeid` | Fetch fresh store data by ID |
| `GET` | `/api/store/inventory/:storeid` | Full inventory list (joined with product info) |
| `GET` | `/api/store/orders/:storeid` | Last 10 supply/restock orders |
| `GET` | `/api/store/stats/:storeid` | `{ dailySales, stockAlerts, pendingRequests, chartData }` |
| `GET` | `/api/store/products` | All products (for Browse Catalog tab) |
| `GET` | `/api/store/order-details/:orderid` | Full order info + product breakdown |
| `PUT` | `/api/store/update` | Update store profile (password optional) |
| `POST` | `/api/store/restock` | Create a supply restock order |

#### Driver Routes — `/api/driver`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/driver/orders/:driverid` | All orders assigned to the driver |
| `GET` | `/api/driver/stats/:driverid` | `{ totalRevenue }` |
| `GET` | `/api/driver/chart/:driverid` | Daily delivery count for current month |
| `PUT` | `/api/driver/update` | Update email and/or password |

#### Admin Routes — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/drivers` | All drivers |
| `GET` | `/api/admin/customers` | All customers |
| `GET` | `/api/admin/products` | All products (with kashrut & category) |
| `GET` | `/api/admin/warehouses` | All warehouses |
| `GET` | `/api/admin/stores` | All stores |
| `GET` | `/api/admin/orders` | All orders |
| `GET` | `/api/admin/chart` | Daily global revenue for current month |
| `POST` | `/api/admin/drivers` | Add a driver |
| `POST` | `/api/admin/customers` | Add a customer |
| `POST` | `/api/admin/stores` | Add a store |
| `POST` | `/api/admin/products` | Add a product (+ kashrut) |
| `POST` | `/api/admin/warehouses` | Add a warehouse |
| `PUT` | `/api/admin/drivers/:id` | Update driver |
| `PUT` | `/api/admin/customers/:id` | Update customer |
| `PUT` | `/api/admin/stores/:id` | Update store |
| `PUT` | `/api/admin/products/:id` | Update product (kashrut: delete + re-insert) |
| `PUT` | `/api/admin/warehouses/:id` | Update warehouse |
| `DELETE` | `/api/admin/drivers/:id` | Nullifies orders, then deletes driver |
| `DELETE` | `/api/admin/customers/:id` | Nullifies orders, then deletes customer |
| `DELETE` | `/api/admin/products/:id` | Deletes kashrut + inventory rows first |
| `DELETE` | `/api/admin/warehouses/:id` | Deletes inventory rows first |
| `DELETE` | `/api/admin/stores/:id` | Deletes inventory, nullifies orders, then deletes store |

#### Shared Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/orders/update-status` | Update any order's status. When set to `DELIVERED`, automatically adjusts inventory (decrease for customer orders, increase for restock orders). |

---

### Frontend Pages & Features

#### Login Page (`/`)
- Role selector: Customer / Store / Driver / Admin
- Email + password fields with inline error display
- **Forgot Password modal**: enter email → password reset to `reset123` → temporary password shown on screen
- Redirects to the correct dashboard after login, passing the `user` object via React Router `location.state`

#### Customer Dashboard (`/customer`)

| Tab | Features |
|-----|----------|
| **Overview** | Welcome message, Loyalty Badge (Standard / Premium / VIP Gold), total orders, total spent, last 3 orders |
| **Shop** | Product catalog grid. Each card shows name, price, kashrut badges, and a **Buy Now** button |
| **My Orders** | Full order history with status badges. **View →** opens a detail modal with product breakdown |
| **Profile** | Edit name, email, phone, city, street, password. Data always re-fetched from DB on mount |

#### Store Dashboard (`/store`)

| Tab | Features |
|-----|----------|
| **Overview** | Monthly revenue chart, supply expenses, stock alert count, pending requests |
| **Inventory** | Table with LOW STOCK / OK badges. **↺ Restock** (auto-fills 2× minimum) and **+ Order** (custom qty modal) |
| **Browse Catalog** | Product grid with **Add to Store** button triggering a restock order |
| **Order Requests** | Supply order table. **View →** opens order detail modal with product breakdown |
| **Account Info** | Edit name, email, phone, website. Rating is read-only. Password only updated if typed |

#### Driver Dashboard (`/driver`)

| Tab | Features |
|-----|----------|
| **Overview** | Total revenue stat, monthly deliveries chart |
| **Deliveries** | Table of assigned orders with status update controls |
| **Profile** | Edit email and password |

#### Admin Dashboard (`/admin`)

Full back-office built with reusable `DataTable`, `Drawer`, and `Field` components.

| Section | Features |
|---------|----------|
| **Overview** | Global stats + monthly revenue chart |
| **Products** | CRUD with kashrut tags |
| **Warehouses** | CRUD with region + address |
| **Trucks & Drivers** | CRUD with license plate, capacity, status badge |
| **Stores (RL)** | CRUD with name, email, phone, rating |
| **Orders** | Full order table — edit status or delete |
| **Customers** | CRUD with name, email, city, loyalty tier |

---

### Database Schema (Key Tables)

| Table | Description |
|-------|-------------|
| `customer` | Customer accounts (customerid, customername, email, password, phone, city, street, loyaltytier) |
| `store` | Store accounts (storeid, storename, email, password, phone, rating, websiteurl) |
| `truck` | Driver accounts (driverid, email, password, licenseplate, capacity, maintenancestatus, active) |
| `admin` | Admin accounts (email, password) |
| `product` | Products (productid, productname, price, dateofmanufacture, expirationdate, categoryid, supplierid) |
| `product_kashrut` | Many-to-many: product ↔ kashrut label |
| `category` | Product categories |
| `supplier` | Product suppliers |
| `warehouse` | Warehouses (warehouseid, region, address) |
| `inventory` | Stock per product per store (productid, storeid, quantity, minimumstock) |
| `ORDER` | All orders (orderid, customerid, storeid, driverid, orderdate, status, paymentmethod, price) |
| `contains` | Order line items (orderid, productid, quantity, subtotal, inonsale) |

---

### Key Design Decisions

**1. Safe Password Updates**
All `UPDATE` routes only include `password` in the SQL query when a non-empty value is provided, preventing accidental overwrites with `null`.

**2. Fresh Data on Mount**
Customer and Store dashboards re-fetch their profile data from the DB every time the component mounts (`GET /api/customer/:id`, `GET /api/store/:storeid`), so navigation never shows stale login-session data.

**3. Inventory Auto-Update on Delivery**
When `PUT /api/orders/update-status` sets a status to `DELIVERED`:
- **Customer order** → inventory **decreased** at the store
- **Restock order** (no customer) → inventory **increased** at the store

**4. Cascading Deletes**
Admin delete routes manually nullify foreign keys in related tables before deleting the parent record, preventing constraint violations.

**5. Reusable SalesChart**
`SalesChart.jsx` wraps recharts `AreaChart` and accepts `data`, `label`, and `prefix` props, making it reusable across Store, Driver, and Admin dashboards.

**6. Modular Backend**
The backend is split into 5 route files mounted in `server.js`. DB credentials are stored in `.env` and accessed through a shared `db.js` connection pool.