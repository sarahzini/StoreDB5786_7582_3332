--Summarizes the delivery performance of each driver by displaying their name, company, and total count of successfully completed orders.
SELECT t.DriverID, dc.DeliveryCieName, COUNT(o.OrderId) as DeliveredCount
FROM TRUCK t
JOIN DELIVERYCOMPAGNY dc ON t.DeliveryCieID = dc.DeliveryCieID
LEFT JOIN "ORDER" o ON t.DriverID = o.DriverID
WHERE o.DeliveryDate IS NOT NULL
GROUP BY t.DriverID, dc.DeliveryCieName
HAVING COUNT(o.OrderId) > 0;