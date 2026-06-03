-- =====================================================================
-- Views.sql
-- ---------------------------------------------------------------------
-- Two views on the integrated database, one per original department:
--   VIEW 1 - DB1 side : built only on DB1 tables (DELIVERYCOMPAGNY,
--            TRUCK). It JOINS two tables, as required.
--   VIEW 2 - DB2 side : built only on a DB2 table (CUSTOMER).
-- Neither view is a plain field extraction: both compute grouped
-- summaries.
-- Each view has 2 meaningful queries. A SELECT * is provided per view
-- for the README screenshot.
-- =====================================================================


-- =====================================================================
-- VIEW 1  (DB1 perspective) - company_fleet_summary
-- ---------------------------------------------------------------------
-- For each delivery company, summarise its truck fleet:
--   how many trucks, how many are active, total and average capacity.
-- JOINs DELIVERYCOMPAGNY with TRUCK and groups per company.
-- =====================================================================

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


-- SELECT * for the README screenshot
SELECT * FROM company_fleet_summary;


-- Query 1.1 - Delivery companies with a sizable fleet (3+ trucks),
-- ordered by the largest total hauling capacity first.
SELECT *
FROM company_fleet_summary
WHERE total_trucks >= 3
ORDER BY total_capacity DESC;


-- Query 1.2 - Compare each company's fleet size to how many regions it
-- serves (uses another integration table: DELIVERYCOMPAGNY_REGIONSERVED).
SELECT f.DeliveryCieName,
       f.total_trucks,
       f.active_trucks,
       COUNT(r.RegionServed) AS regions_covered
FROM company_fleet_summary f
JOIN DELIVERYCOMPAGNY_REGIONSERVED r
  ON r.DeliveryCieID = f.DeliveryCieID
GROUP BY f.DeliveryCieName, f.total_trucks, f.active_trucks
ORDER BY regions_covered DESC;


-- =====================================================================
-- VIEW 2  (DB2 perspective) - customer_order_summary
-- ---------------------------------------------------------------------
-- For each customer, summarise their ordering activity:
--   how many orders they placed, how much they spent in total, and
--   their average order value.
-- JOINs CUSTOMER (a DB2 table) with "ORDER". A LEFT JOIN is used so
-- that customers who never ordered still appear, with zero values.
-- COALESCE turns the NULL produced by SUM/AVG (for those customers)
-- into 0, so the output stays clean.
-- =====================================================================

DROP VIEW IF EXISTS customer_order_summary;

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


-- SELECT * for the README screenshot
SELECT * FROM customer_order_summary;


-- Query 2.1 - The top 10 customers by total amount spent
-- (only customers who actually placed at least one order).
SELECT *
FROM customer_order_summary
WHERE total_orders > 0
ORDER BY total_spent DESC
LIMIT 10;

-- Query 2.2 - Revenue per city: total amount spent by all customers
-- of each city, with how many customers contribute to it.
-- Cities are ranked from the highest revenue to the lowest.
SELECT City,
       COUNT(*)        AS customers_in_city,
       SUM(total_spent) AS city_revenue
FROM customer_order_summary
GROUP BY City
ORDER BY city_revenue DESC;


