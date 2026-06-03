-- ==============================================================================
-- Trigger 2: Real-time Inventory Deduction — The Cash Register (ON INSERT on CONTAINS)
-- ==============================================================================
-- DESCRIPTION:
-- Simulates the core of a supermarket's point-of-sale system. Every time a
-- product line is added to an order (INSERT into CONTAINS), this trigger
-- automatically deducts the purchased quantity from the INVENTORY of the
-- relevant store. It also raises a warning if the product falls below its
-- minimum stock threshold after the deduction.
--
-- ELEMENTS:
-- Trigger fires AFTER INSERT on CONTAINS
-- Implicit cursor (SELECT INTO) to get store context
-- DML: UPDATE on INVENTORY table
-- Branching: stock level check + warning alert
-- Exception handling: prevents deduction if stock is insufficient
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_realtime_inventory_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_store_id     INT;
    v_current_qty  INT;
    v_min_stock    INT;
BEGIN
    -- Get the store linked to this order
    SELECT StoreID INTO v_store_id
    FROM "ORDER"
    WHERE OrderId = NEW.OrderId;

    -- Only process if order belongs to a store (not a customer-only order)
    IF v_store_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get current inventory for this product in this store
    SELECT Quantity, MinimumStock INTO v_current_qty, v_min_stock
    FROM INVENTORY
    WHERE ProductID = NEW.ProductID
      AND StoreID = v_store_id;

    -- Guard: if product not in inventory for this store, skip silently
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- Guard: prevent deduction below zero
    IF v_current_qty < NEW.Quantity THEN
        RAISE EXCEPTION 'Insufficient stock: product % has only % units in store %, but % were ordered.',
                        NEW.ProductID, v_current_qty, v_store_id, NEW.Quantity;
    END IF;

    -- Deduct purchased quantity from store inventory
    UPDATE INVENTORY
    SET Quantity = Quantity - NEW.Quantity
    WHERE ProductID = NEW.ProductID
      AND StoreID = v_store_id;

    -- Alert if stock drops below minimum after deduction
    IF (v_current_qty - NEW.Quantity) < v_min_stock THEN
        RAISE NOTICE 'LOW STOCK WARNING: Product % in store % is now below minimum stock (remaining: %, min: %).',
                     NEW.ProductID, v_store_id,
                     (v_current_qty - NEW.Quantity), v_min_stock;
    END IF;

    RETURN NEW;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

CREATE OR REPLACE TRIGGER trg_realtime_inventory_deduction
AFTER INSERT ON CONTAINS
FOR EACH ROW
EXECUTE FUNCTION fn_realtime_inventory_deduction();


-- ==============================================================================
-- HOW TO TEST:
-- ==============================================================================
-- Step 1: Check inventory before
-- SELECT Quantity, MinimumStock FROM INVENTORY WHERE ProductID = 1 AND StoreID = 1;
--
-- Step 2: Add a product line to an existing order (trigger fires here)
-- INSERT INTO CONTAINS (OrderId, ProductID, Quantity) VALUES (1, 1, 5);
--
-- Step 3: Verify inventory was automatically reduced
-- SELECT Quantity, MinimumStock FROM INVENTORY WHERE ProductID = 1 AND StoreID = 1;
-- ==============================================================================