-- ==============================================================================
-- Trigger 1: Fleet Emergency Reassignment (ON UPDATE on TRUCK)
-- ==============================================================================
-- DESCRIPTION:
-- Simulates a real-world logistics crisis: when a truck breaks down and its
-- Active status is set from 1 to 0, this trigger automatically unassigns that
-- driver from ALL pending orders (orders without a delivery date), freeing them
-- to be redistributed by the optimize_fleet_loading function.
--
-- ELEMENTS:
-- Trigger fires AFTER UPDATE on TRUCK.Active (1 -> 0)
-- DML: UPDATE on "ORDER" table
-- Branching: only fires when Active changes from 1 to 0
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_fleet_emergency_reassignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_orders_freed INT;
BEGIN
    -- Only act when a truck goes from Active to Inactive
    IF OLD.Active = 1 AND NEW.Active = 0 THEN

        -- Unassign driver from all pending (undelivered) orders
        UPDATE "ORDER"
        SET DriverID = NULL
        WHERE DriverID = OLD.DriverID
          AND DeliveryDate IS NULL;

        -- Count how many orders were freed
        GET DIAGNOSTICS v_orders_freed = ROW_COUNT;

        RAISE NOTICE 'ALERT: Truck (DriverID=%) went offline. % pending orders have been freed for reassignment.',
                     OLD.DriverID, v_orders_freed;
    END IF;

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Fleet emergency trigger failed for DriverID %: %', OLD.DriverID, SQLERRM;
END;
$$;

CREATE OR REPLACE TRIGGER trg_fleet_emergency_reassignment
AFTER UPDATE OF Active ON TRUCK
FOR EACH ROW
EXECUTE FUNCTION fn_fleet_emergency_reassignment();


-- ==============================================================================
-- HOW TO TEST:
-- ==============================================================================
-- Step 1: See current orders assigned to driver
-- SELECT OrderId, DriverID, DeliveryDate FROM "ORDER" WHERE DriverID = 2 AND DeliveryDate IS NULL;
--
-- Step 2: Simulate truck breakdown (trigger fires here)
-- UPDATE TRUCK SET Active = 0 WHERE DriverID = 2;
--
-- Step 3: Verify orders are now unassigned (DriverID = NULL)
-- SELECT OrderId, DriverID, DeliveryDate FROM "ORDER" WHERE OrderId IN (
--     SELECT OrderId FROM "ORDER" WHERE DriverID IS NULL AND DeliveryDate IS NULL LIMIT 10
-- );
-- ==============================================================================