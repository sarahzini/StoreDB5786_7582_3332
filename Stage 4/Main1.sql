-- ==============================================================================
-- Main Program 1: "The Morning Dispatch" (Logistics Morning Routine)
-- ==============================================================================
-- BUSINESS SCENARIO:
-- It's 6:00 AM at Rami Levy's logistics center. The operations manager
-- arrives and runs this script to prepare the day's deliveries.
--
-- ACTION 1 (Function 2 - optimize_fleet_loading):
--   Fill all available trucks with pending orders, maximizing capacity usage.
--
-- ACTION 2 (Procedure 1 - process_store_inventory_transfer):
--   Resolve an urgent overnight stock shortage flagged for Store 5.
--
-- This program demonstrates a complete, real-world logistics morning workflow.
-- ==============================================================================

DO $$
DECLARE
    -- Ref cursor to receive the fleet loading manifest
    v_manifest       refcursor;
    v_driver_id      INT;
    v_order_id       INT;
    v_capacity       INT;
    v_assigned_time  TIMESTAMP;
    v_total_assigned INT := 0;

BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE ' RAMI LEVY LOGISTICS — MORNING DISPATCH — %', NOW()::DATE;
    RAISE NOTICE '=======================================================';

    -- -----------------------------------------------------------------------
    -- STEP 1: Optimize fleet loading for delivery company 1
    -- -----------------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '[STEP 1] Loading trucks for Delivery Company #1...';

    BEGIN
        -- Call Function 2: returns a ref cursor with the assignment manifest
        v_manifest := optimize_fleet_loading(1);

        -- Iterate through the manifest and display each assignment
        LOOP
            FETCH v_manifest INTO v_driver_id, v_order_id, v_capacity, v_assigned_time;
            EXIT WHEN NOT FOUND;

            v_total_assigned := v_total_assigned + 1;
            RAISE NOTICE '  → Driver % | Order % | Truck capacity: %', 
                         v_driver_id, v_order_id, v_capacity;
        END LOOP;

        CLOSE v_manifest;
        RAISE NOTICE '[STEP 1] Complete — % orders assigned to trucks.', v_total_assigned;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[STEP 1] Fleet loading error: %', SQLERRM;
    END;

    -- -----------------------------------------------------------------------
    -- STEP 2: Emergency stock transfer for Store 5 (overnight alert)
    -- -----------------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '[STEP 2] Resolving overnight stock alert for Store #5...';

    BEGIN
        -- Call Procedure 1: transfer 30 units of product 1 to Store 5
        CALL process_store_inventory_transfer(1, 5, 30);
        RAISE NOTICE '[STEP 2] Stock transfer resolved successfully.';

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[STEP 2] Stock transfer failed: %', SQLERRM;
    END;

    -- -----------------------------------------------------------------------
    -- Summary
    -- -----------------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE ' MORNING DISPATCH COMPLETE. Have a great day!';
    RAISE NOTICE '=======================================================';

END;
$$;