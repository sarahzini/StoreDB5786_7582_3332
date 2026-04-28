--Goal :The query identifies high-rated stores whose average order value exceeds the company-wide average to highlight top-performing locations.

-- Version A: Using JOIN and a Subquery in the HAVING clause
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

-- Version B: Correlated Subqueries
-- More complex structure but less efficient due to repeated executions.
SELECT 
    s.StoreName, 
    s.Rating,
    (SELECT ROUND(AVG(Price), 2) FROM "ORDER" WHERE StoreID = s.StoreID) AS Avg_Order
FROM STORE s
WHERE s.Rating >= 4 
AND (SELECT AVG(Price) FROM "ORDER" WHERE StoreID = s.StoreID) > 
    (SELECT AVG(Price) FROM "ORDER"); -- Nested comparison