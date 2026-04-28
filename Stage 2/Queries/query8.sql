/* This query uses a CTE to calculate regional stats and a subquery to 
   link warehouses to products nearing expiration. */

WITH RegionalSales AS (
    SELECT 
        dcrs.RegionServed,
        dc.DeliveryCieName,
        SUM(o.Price) OVER(PARTITION BY dcrs.RegionServed) as TotalRegionalRevenue,
        COUNT(o.OrderId) OVER(PARTITION BY dcrs.RegionServed, dc.DeliveryCieID) as OrdersByCompany
    FROM DELIVERYCOMPAGNY dc
    JOIN DELIVERYCOMPAGNY_REGIONSERVED dcrs ON dc.DeliveryCieID = dcrs.DeliveryCieID
    JOIN TRUCK t ON dc.DeliveryCieID = t.DeliveryCieID
    JOIN "ORDER" o ON t.DriverID = o.DriverID
    WHERE o.OrderDate >= CURRENT_DATE - INTERVAL '6 months'
)
SELECT DISTINCT
    rs.RegionServed,
    rs.TotalRegionalRevenue,
    -- Identifies the top performing company in each region
    (SELECT dc2.DeliveryCieName 
     FROM RegionalSales rs2 
     JOIN DELIVERYCOMPAGNY dc2 ON rs2.DeliveryCieName = dc2.DeliveryCieName
     WHERE rs2.RegionServed = rs.RegionServed 
     ORDER BY rs2.OrdersByCompany DESC LIMIT 1) as Leading_Cie,
    -- Counts critical expiring products in the region's warehouses
    (SELECT COUNT(p.ProductID)
     FROM PRODUCT p
     JOIN LOCATED l ON p.ProductID = l.ProductID
     JOIN WAREHOUSE w ON l.WarehouseID = w.WarehouseID
     WHERE w.Region = rs.RegionServed 
     AND p.ExpirationDate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as Critical_Exp_Count
FROM RegionalSales rs
ORDER BY rs.TotalRegionalRevenue DESC;