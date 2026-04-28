/* We count how many active orders (DeliveryDate is NULL) 
   each driver currently has and compare it to their truck's capacity.
*/
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