-- Delete 3: Remove Inactive Trucks with No Order History
-- Description: Deleting trucks/drivers that are marked as inactive and have never been assigned to any order to keep the fleet database clean.
DELETE FROM TRUCK
WHERE Active = 0 
AND DriverID NOT IN (SELECT DriverID FROM "ORDER");