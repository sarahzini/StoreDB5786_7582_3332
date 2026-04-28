--Goal :The query identifies products below their minimum stock level across all warehouses to generate a global replenishment report.

-- Direct grouping after join
SELECT dc.DeliveryCieName, COUNT(o.OrderId) as TotalOrders, SUM(o.Price) as TotalValue
FROM DELIVERYCOMPAGNY dc
JOIN TRUCK t ON dc.DeliveryCieID = t.DeliveryCieID
JOIN "ORDER" o ON t.DriverID = o.DriverID
WHERE EXTRACT(MONTH FROM o.OrderDate) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY dc.DeliveryCieName;

--Second Version 

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