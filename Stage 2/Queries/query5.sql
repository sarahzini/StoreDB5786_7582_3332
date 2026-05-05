-- Retrieves all products within a specific order (3) with detailed attributes.
SELECT 
    (SELECT o.OrderId FROM "ORDER" o WHERE o.OrderId = c.OrderId)
     AS OrderId,
    (SELECT p.ProductName 
    FROM PRODUCT p 
    WHERE p.ProductID = c.ProductID)
     AS ProductName,
    (SELECT pk.Kashrut FROM PRODUCT_KASHRUT pk WHERE pk.ProductID = c.ProductID)
     AS Kashrut,
    c.Quantity,
    (c.Quantity * (SELECT p.Price FROM PRODUCT p WHERE p.ProductID = c.ProductID)) 
    AS LineTotal
FROM 
    CONTAINS c
WHERE 
    c.OrderId = 3
ORDER BY 
    ProductName;