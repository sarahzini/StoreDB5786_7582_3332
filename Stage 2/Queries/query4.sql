--Goal The goal of this query is to decompose the expiration date into separate year,
-- month, and day fields for products expiring in 2026, comparing two filtering methods to demonstrate SQL performance optimization.

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