-- ==============================================================================
-- Function 1: Predictive Stock Depletion Algorithm
-- ==============================================================================
-- DESCRIPTION:
-- This function analyzes the sales history of a specific store over the last 30 
-- days to calculate the daily sales velocity of each product. Instead of a basic 
-- low-stock alert, it predicts exactly how many days are left before a stockout 
-- and assigns a dynamic alert level (CRITICAL, WARNING, BELOW MIN STOCK, SAFE).
--
-- GRADING ELEMENTS INCLUDED (Stage 4):
-- [a] Explicit Cursor (cur_inventory) & Implicit Cursor (SELECT INTO)
-- [b] Returning a Ref Cursor (v_report_cursor)
-- [c] DML Operations (Creating a TEMP table and mass INSERT)
-- [d] Branching (IF/ELSIF/ELSE to prevent division by zero and assign alerts)
-- [e] Loops (LOOP / FETCH / EXIT)
-- [f] Exception Handling (Business exception if store doesn't exist + Global catch)
-- [g] Records (Using RECORD type to hold current inventory row)
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_predictive_restock_plan(p_store_id INT)
RETURNS refcursor
LANGUAGE plpgsql
AS $$
DECLARE
    -- [b] Returning a Ref Cursor
    v_report_cursor refcursor;
    
    -- Variables 
    v_store_check INT;
    v_total_sold INT;
    v_daily_velocity NUMERIC(10,2);
    v_days_left INT;
    v_alert_level VARCHAR(20);
    v_days_history INT := 30; 
    
    -- [g] Record declaration
    v_prod_record RECORD;
    
    -- [a] Explicit Cursor
    cur_inventory CURSOR FOR 
        SELECT i.ProductID, p.ProductName, i.Quantity, i.MinimumStock
        FROM INVENTORY i
        JOIN PRODUCT p ON i.ProductID = p.ProductID
        WHERE i.StoreID = p_store_id;

BEGIN
    -- [f] Business Exception Handling
    SELECT StoreID INTO v_store_check FROM STORE WHERE StoreID = p_store_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error: Store ID % does not exist in the database.', p_store_id;
    END IF;

    -- [c] DML: Creation and manipulation of a temporary table
    DROP TABLE IF EXISTS temp_stock_prediction;
    CREATE TEMP TABLE temp_stock_prediction (
        ProductID INT,
        ProductName VARCHAR,
        CurrentStock INT,
        MinimumStock INT,
        DailyVelocity NUMERIC(10,2),
        DaysUntilEmpty INT,
        AlertLevel VARCHAR
    );

    OPEN cur_inventory;
    -- [e] Main Loop
    LOOP
        FETCH cur_inventory INTO v_prod_record;
        EXIT WHEN NOT FOUND;

        -- [a] Implicit Cursor via SELECT INTO
        SELECT COALESCE(SUM(c.Quantity), 0) INTO v_total_sold
        FROM "ORDER" o
        JOIN CONTAINS c ON o.OrderId = c.OrderId
        WHERE o.StoreID = p_store_id 
          AND c.ProductID = v_prod_record.ProductID
          AND o.OrderDate >= CURRENT_DATE - v_days_history;

        -- [d] Branching (IF / ELSE)
        IF v_total_sold > 0 THEN
            v_daily_velocity := v_total_sold::NUMERIC / v_days_history;
            v_days_left := ROUND(v_prod_record.Quantity / NULLIF(v_daily_velocity, 0));
        ELSE
            v_daily_velocity := 0;
            v_days_left := 9999; 
        END IF;

        IF v_days_left <= 3 THEN
            v_alert_level := 'CRITICAL';
        ELSIF v_days_left <= 7 THEN
            v_alert_level := 'WARNING';
        ELSIF v_prod_record.Quantity < v_prod_record.MinimumStock THEN
            v_alert_level := 'BELOW MIN STOCK'; 
        ELSE
            v_alert_level := 'SAFE';
        END IF;

        -- [c] DML: Insertion
        INSERT INTO temp_stock_prediction 
        VALUES (v_prod_record.ProductID, v_prod_record.ProductName, v_prod_record.Quantity, 
                v_prod_record.MinimumStock, v_daily_velocity, v_days_left, v_alert_level);
    END LOOP;
    CLOSE cur_inventory;

    OPEN v_report_cursor FOR 
        SELECT * FROM temp_stock_prediction ORDER BY DaysUntilEmpty ASC;
        
    RETURN v_report_cursor;

EXCEPTION
    -- [f] Global Exceptions
    WHEN OTHERS THEN
        RAISE NOTICE 'System error: %', SQLERRM;
        RAISE;
END;
$$;

/* ==============================================================================
HOW TO TEST THIS FUNCTION (For pgAdmin):
==============================================================================
BEGIN;
SELECT generate_predictive_restock_plan(1);
-- Note the portal name returned (e.g., "<unnamed portal 1>")
FETCH ALL IN "<unnamed portal 1>"; 
COMMIT;
==============================================================================
*/