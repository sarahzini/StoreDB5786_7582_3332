--ROLLBACK 

BEGIN; -- Starts the transaction

-- 1. SHOW STATE BEFORE (Screenshot 1)
-- Check drivers with more than 50 orders to see their current status
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);

-- 2. EXECUTE MAINTENANCE UPDATE
-- Changes status to 'Required' for overloaded drivers
UPDATE TRUCK
SET MaintenanceStatus = 'Required'
WHERE DriverID IN (
    SELECT DriverID FROM "ORDER" 
    GROUP BY DriverID 
    HAVING COUNT(*) > 50
);

-- 3. SHOW STATE AFTER UPDATE BUT BEFORE ROLLBACK (Screenshot 2)
-- You should now see 'Required' for these drivers
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);

ROLLBACK; -- Undo all changes!

-- 4. SHOW THAT STATE RETURNED TO INITIAL VALUES (Screenshot 3)
-- Statuses should be back to 'Good', 'Fair', etc.
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);

--COMMIT

BEGIN; -- Starts the transaction

-- 1. EXECUTE THE UPDATE
-- Set status to 'Required' based on order count
UPDATE TRUCK
SET MaintenanceStatus = 'Required'
WHERE DriverID IN (
    SELECT DriverID FROM "ORDER" 
    GROUP BY DriverID 
    HAVING COUNT(*) > 50
);

-- 2. SHOW MODIFIED STATE (Screenshot 1)
-- Confirm the change is visible within the current transaction
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);

COMMIT; -- Permanently save the changes to the database

-- 3. SHOW STATE AFTER COMMIT (Screenshot 2)
-- Status remains 'Required' because the transaction was finalized
SELECT DriverID, MaintenanceStatus 
FROM TRUCK 
WHERE DriverID IN (SELECT DriverID FROM "ORDER" GROUP BY DriverID HAVING COUNT(*) > 50);
