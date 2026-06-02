-- ==============================================================================
-- Function 2: Fleet Loading Optimizer
-- ==============================================================================
-- DESCRIPTION:
-- This function takes the available (active) trucks of a specific delivery 
-- company and automatically assigns pending (unassigned) orders to them.
-- It acts like a "Logistics Tetris", iterating through available trucks and 
-- assigning orders until each truck reaches its maximum hauling capacity.
--
-- GRADING ELEMENTS INCLUDED (Stage 4):
-- [a] Explicit Cursor (cur_active_trucks) & Implicit Cursor (SELECT INTO)
-- [b] Returning a Ref Cursor (v_manifest_cursor)
-- [c] Multiple DML Operations (UPDATE physical table, INSERT into temp table)
-- [d] Branching (IF/ELSE logic to enforce truck capacity constraints)
-- [e] Nested Loops (Outer loop for trucks, inner FOR loop for orders)
-- [f] Exception Handling (Business exceptions and unique_violation catch)
-- [g] Records (Using RECORD types to hold current truck and order rows)
-- ==============================================================================
CREATE OR REPLACE FUNCTION optimize_fleet_loading(p_delivery_cie_id INT)
RETURNS refcursor
LANGUAGE plpgsql
AS $$
DECLARE
    -- [b] Ref Cursor
    v_manifest_cursor refcursor;
    
    v_cie_check INT;
    v_current_truck_load INT;
    v_total_assigned INT := 0;
    
    -- [g] Records
    v_truck_record RECORD;
    v_order_record RECORD;
    
    -- [a] Explicit Cursor
    cur_active_trucks CURSOR FOR 
        SELECT DriverID, Capacity 
        FROM TRUCK 
        WHERE DeliveryCieID = p_delivery_cie_id AND Active = 1 
        ORDER BY Capacity DESC;

BEGIN
    -- [f] Custom exception
    SELECT DeliveryCieID INTO v_cie_check FROM DELIVERYCOMPAGNY WHERE DeliveryCieID = p_delivery_cie_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operation cancelled: Delivery company % does not exist.', p_delivery_cie_id;
    END IF;

    -- [c] DML commands
    DROP TABLE IF EXISTS temp_loading_manifest;
    CREATE TEMP TABLE temp_loading_manifest (
        DriverID INT,
        AssignedOrderID INT,
        TruckCapacity INT,
        AssignmentTime TIMESTAMP
    );

    OPEN cur_active_trucks;
    -- [e] Loop 1 (Trucks)
    LOOP
        FETCH cur_active_trucks INTO v_truck_record;
        EXIT WHEN NOT FOUND;

        v_current_truck_load := 0; 

        -- [a] Implicit Cursor + [e] Loop 2 (Orders)
        FOR v_order_record IN 
            SELECT OrderId FROM "ORDER" WHERE DriverID IS NULL ORDER BY OrderDate ASC
        LOOP
            -- [d] IF Branching
            IF v_current_truck_load < v_truck_record.Capacity THEN
                
                -- [c] DML: UPDATE the actual database
                UPDATE "ORDER" 
                SET DriverID = v_truck_record.DriverID 
                WHERE OrderId = v_order_record.OrderId;
                
                -- [c] DML: INSERT into the report
                INSERT INTO temp_loading_manifest 
                VALUES (v_truck_record.DriverID, v_order_record.OrderId, v_truck_record.Capacity, CURRENT_TIMESTAMP);
                
                v_current_truck_load := v_current_truck_load + 1;
                v_total_assigned := v_total_assigned + 1;
            ELSE
                EXIT; -- Exit the orders loop, move to the next truck
            END IF;
        END LOOP;
        
    END LOOP;
    CLOSE cur_active_trucks;

    IF v_total_assigned = 0 THEN
        RAISE NOTICE 'No orders assigned.';
    END IF;

    OPEN v_manifest_cursor FOR 
        SELECT * FROM temp_loading_manifest ORDER BY DriverID, AssignedOrderID;
        
    RETURN v_manifest_cursor;

EXCEPTION
    -- [f] System error handling
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Duplication error during assignment.';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Algorithm error: %', SQLERRM;
END;
$$;


/* ==============================================================================
HOW TO TEST THIS FUNCTION (For pgAdmin):
==============================================================================
BEGIN;
SELECT optimize_fleet_loading(1);
-- Note the portal name returned (e.g., "<unnamed portal 2>")
FETCH ALL IN "<unnamed portal 2>"; 
COMMIT;
==============================================================================
*/