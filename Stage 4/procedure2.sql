-- ==============================================================================
-- Procedure 2: End-of-Month Customer Loyalty & Cleanup Batch
-- ==============================================================================
-- DESCRIPTION:
-- This procedure automates the end-of-month process for Customer Relationship 
-- Management (CRM). It iterates through every customer in the database, 
-- calculates their total historical spending, and assigns them a Loyalty Tier 
-- (VIP Gold, Premium, or Standard). Additionally, it cleans up the database 
-- by deleting old, cancelled orders to free up storage space.
--
-- GRADING ELEMENTS INCLUDED (Stage 4):
-- [a] Explicit Cursor (to iterate customers) & Implicit Cursor (SELECT INTO)
-- [c] Massive DML Operations (UPDATE for loyalty, DELETE for cleanup)
-- [d] Branching (IF/ELSIF/ELSE for tier logic)
-- [e] Loops (LOOP / FETCH / EXIT)
-- [f] Global Exception Handling with safe ROLLBACK
--
-- ==============================================================================
-- *** SCHEMA PREREQUISITE (IMPORTANT) ***
-- To support this new business logic, we must first alter the CUSTOMER table.
-- The following command must be executed before testing the procedure:
--
-- ALTER TABLE CUSTOMER ADD COLUMN IF NOT EXISTS LoyaltyTier VARCHAR(20) DEFAULT 'Standard';
-- ==============================================================================

CREATE OR REPLACE PROCEDURE monthly_customer_loyalty_batch()
LANGUAGE plpgsql
AS $$
DECLARE
    -- [a] Explicit cursor to iterate over all customers in the database
    cur_customers CURSOR FOR SELECT CustomerID FROM CUSTOMER;
    v_customer_id INT;
    v_total_spent NUMERIC;
    v_new_tier VARCHAR(20);
BEGIN
    -- [e] Loop through the cursor to process each customer one by one
    OPEN cur_customers;
    LOOP
        FETCH cur_customers INTO v_customer_id;
        EXIT WHEN NOT FOUND;

        -- [a] Implicit cursor to calculate the total amount spent by the current customer
        SELECT COALESCE(SUM(Price), 0) INTO v_total_spent
        FROM "ORDER" 
        WHERE CustomerID = v_customer_id;

        -- [d] Branching IF/ELSIF/ELSE to determine the loyalty tier based on spending
        IF v_total_spent >= 5000 THEN
            v_new_tier := 'VIP Gold';
        ELSIF v_total_spent >= 1000 THEN
            v_new_tier := 'Premium';
        ELSE
            v_new_tier := 'Standard';
        END IF;

        -- [c] DML 1: Mass UPDATE to apply the calculated tier to the customer
        UPDATE CUSTOMER 
        SET LoyaltyTier = v_new_tier 
        WHERE CustomerID = v_customer_id;
        
    END LOOP;
    CLOSE cur_customers;

    -- [c] DML 2: Mass DELETE (Database Cleanup)
    -- Remove old cancelled orders (older than 1 year) to free up database storage
    DELETE FROM "ORDER" 
    WHERE Status = 'Cancelled' AND OrderDate < CURRENT_DATE - INTERVAL '1 year';

    -- Success Message displayed in the console
    RAISE NOTICE 'SUCCESS: End-of-month batch completed. Loyalty tiers updated and old cancelled orders removed.';

EXCEPTION
    -- [f] Global exception handling: Catch any unexpected error and rollback all changes safely
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Batch process failed due to an unexpected error: %', SQLERRM;
        ROLLBACK;
END;
$$;