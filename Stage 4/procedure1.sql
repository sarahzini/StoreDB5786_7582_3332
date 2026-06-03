-- ==============================================================================
-- Procedure 1: Emergency Inter-Store Inventory Transfer
-- ==============================================================================
-- DESCRIPTION:
-- This procedure acts as a safety protocol to balance stock between stores. 
-- When a store urgently needs a product, it automatically identifies another 
-- store with the most excess stock of that exact product. It then safely 
-- transfers the requested quantity between the two stores, ensuring the source 
-- store never drops below its required minimum stock level.
--
-- GRADING ELEMENTS INCLUDED (Stage 4):
-- [a] Implicit Cursor (SELECT INTO)
-- [c] Multiple DML Operations (UPDATE source store, UPDATE target store)
-- [d] Branching (IF/ELSE for stock availability validation)
-- [f] Exception Handling (Business exceptions and global ROLLBACK)
-- [g] Records (Using a RECORD type to hold source store data)
-- ==============================================================================

CREATE OR REPLACE PROCEDURE process_store_inventory_transfer(
    p_product_id INT, 
    p_target_store_id INT, 
    p_transfer_qty INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- [g] Record to hold the source store information
    v_source_store RECORD;
    v_product_exists INT;
BEGIN
    -- [f] Business Exception: Check if the product exists
    SELECT ProductID INTO v_product_exists FROM PRODUCT WHERE ProductID = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer cancelled: Product % does not exist.', p_product_id;
    END IF;

    -- [a] Implicit cursor: Find the best store to take the inventory from
    -- We look for a store (different from target) that has enough stock (Current > Minimum + Quantity)
    SELECT StoreID, Quantity INTO v_source_store
    FROM INVENTORY
    WHERE ProductID = p_product_id 
      AND StoreID != p_target_store_id
      AND Quantity >= (MinimumStock + p_transfer_qty)
    ORDER BY Quantity DESC -- Take from the store with the largest excess
    LIMIT 1;

    -- [d] IF / ELSE Branching
    IF v_source_store.StoreID IS NULL THEN
        -- If no store has enough excess stock, raise an error
        RAISE EXCEPTION 'Failed: No store has enough excess stock for product %.', p_product_id;
    ELSE
        -- [c] DML 1: Deduct from the source store
        UPDATE INVENTORY 
        SET Quantity = Quantity - p_transfer_qty 
        WHERE ProductID = p_product_id AND StoreID = v_source_store.StoreID;

        -- [c] DML 2: Add to the target store
        UPDATE INVENTORY 
        SET Quantity = Quantity + p_transfer_qty 
        WHERE ProductID = p_product_id AND StoreID = p_target_store_id;

        -- Success message
        RAISE NOTICE 'SUCCESS: % units of product % transferred from Store % to Store %.', 
                     p_transfer_qty, p_product_id, v_source_store.StoreID, p_target_store_id;
    END IF;
    
EXCEPTION
    -- [f] Global error handling with ROLLBACK for data safety
    WHEN OTHERS THEN
        RAISE NOTICE 'An unexpected error occurred: %', SQLERRM;
        ROLLBACK; 
END;
$$;