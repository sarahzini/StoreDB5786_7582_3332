-- Update 2: Truck Maintenance Status
-- Description: Updating the maintenance status to 'Required' for drivers/trucks that have completed more than 50 orders.

UPDATE TRUCK
SET MaintenanceStatus = 'Required'
WHERE DriverID IN (
    SELECT DriverID 
    FROM "ORDER" 
    GROUP BY DriverID 
    HAVING COUNT(*) > 50
);