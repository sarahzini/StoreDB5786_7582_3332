-- Retrieves all products within a specific order with detailed attributes.
SELECT 
    o.OrderId, 
    p.ProductName, 
    pk.Kashrut, 
    c.Quantity, 
    (c.Quantity * p.Price) as LineTotal
FROM "ORDER" o
JOIN CONTAINS c ON o.OrderId = c.OrderId
JOIN PRODUCT p ON c.ProductID = p.ProductID
JOIN PRODUCT_KASHRUT pk ON p.ProductID = pk.ProductID
WHERE o.OrderId = 3 
ORDER BY p.ProductName;