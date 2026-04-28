--Goal: Provide a global report of all products currently below their minimum stock threshold across all company warehouses.

-- Version A: Using Multiple JOINs
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

-- Version B: Using Subqueries in SELECT and WHERE
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