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

/* Version B: Extracting parts individually for the SELECT 
   but using a range for the WHERE clause (More efficient/SARGable). */
SELECT 
    p.ProductName, 
    w.Region,
    EXTRACT(YEAR FROM p.ExpirationDate) as ExpYear,
    EXTRACT(MONTH FROM p.ExpirationDate) as ExpMonth,
    EXTRACT(DAY FROM p.ExpirationDate) as ExpDay,
    p.ExpirationDate
FROM PRODUCT p
JOIN LOCATED l ON p.ProductID = l.ProductID
JOIN WAREHOUSE w ON l.WarehouseID = w.WarehouseID
WHERE p.ExpirationDate BETWEEN '2026-01-01' AND '2026-12-31'
ORDER BY p.ExpirationDate;