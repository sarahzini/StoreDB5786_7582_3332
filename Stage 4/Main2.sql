-- ==============================================================================
-- Main Program 2: "The Director's Monthly Audit" (Store Manager's Monthly Audit)
-- ==============================================================================
-- BUSINESS SCENARIO:
-- It's the last day of the month at Rami Levy Store #1. The store director
-- runs this script to close out the month, generate the predictive stock report
-- for next month, and update all customer loyalty tiers.
--
-- ACTION 1 (Function 1 - generate_predictive_restock_plan):
--   Print the predictive stockout report for the store — which products are
--   at risk of running out and how many days are left.
--
-- ACTION 2 (Procedure 2 - monthly_customer_loyalty_batch):
--   Update loyalty tiers for all customers and clean up old cancelled orders.
--
-- This program demonstrates a complete end-of-month store management routine.
-- ==============================================================================

DO $$
DECLARE
    -- Ref cursor to receive the stock prediction report
    v_report         refcursor;

    -- Variables to hold each row from the report
    v_product_id     INT;
    v_product_name   VARCHAR;
    v_current_stock  INT;
    v_min_stock      INT;
    v_daily_velocity NUMERIC;
    v_days_left      INT;
    v_alert_level    VARCHAR;

    -- Counters for summary
    v_critical_count INT := 0;
    v_warning_count  INT := 0;
    v_total_count    INT := 0;

    v_target_store   INT := 1;

BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE ' RAMI LEVY — END-OF-MONTH AUDIT — STORE #% — %',
                 v_target_store, NOW()::DATE;
    RAISE NOTICE '=======================================================';

    -- -----------------------------------------------------------------------
    -- STEP 1: Generate predictive stock depletion report
    -- -----------------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '[STEP 1] Generating predictive stock report for Store #%...', v_target_store;
    RAISE NOTICE '%-30s | %-5s | %-9s | %-9s | %-15s',
                 'Product', 'Stock', 'Min Stock', 'Days Left', 'Alert';
    RAISE NOTICE '%', repeat('-', 80);

    BEGIN
        -- Call Function 1: returns a ref cursor ordered by urgency
        v_report := generate_predictive_restock_plan(v_target_store);

        LOOP
            FETCH v_report INTO v_product_id, v_product_name, v_current_stock,
                                v_min_stock, v_daily_velocity, v_days_left, v_alert_level;
            EXIT WHEN NOT FOUND;

            v_total_count := v_total_count + 1;

            -- Count by alert level
            IF v_alert_level = 'CRITICAL' THEN
                v_critical_count := v_critical_count + 1;
            ELSIF v_alert_level = 'WARNING' THEN
                v_warning_count := v_warning_count + 1;
            END IF;

            -- Only print non-SAFE items to keep the report actionable
            IF v_alert_level != 'SAFE' THEN
                RAISE NOTICE '%-30s | %-5s | %-9s | %-9s | %',
                             LEFT(v_product_name, 30),
                             v_current_stock,
                             v_min_stock,
                             CASE WHEN v_days_left = 9999 THEN 'N/A' ELSE v_days_left::TEXT END,
                             v_alert_level;
            END IF;
        END LOOP;

        CLOSE v_report;
        RAISE NOTICE '%', repeat('-', 80);
        RAISE NOTICE '[STEP 1] Report complete: % products scanned | % CRITICAL | % WARNING',
                     v_total_count, v_critical_count, v_warning_count;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[STEP 1] Report generation failed: %', SQLERRM;
    END;

    -- -----------------------------------------------------------------------
    -- STEP 2: Run end-of-month loyalty batch across all customers
    -- -----------------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '[STEP 2] Running monthly customer loyalty batch...';

    BEGIN
        CALL monthly_customer_loyalty_batch();
        RAISE NOTICE '[STEP 2] Loyalty tiers updated and old orders cleaned.';

    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[STEP 2] Loyalty batch failed: %', SQLERRM;
    END;

    -- -----------------------------------------------------------------------
    -- Final Summary
    -- -----------------------------------------------------------------------
    RAISE NOTICE '';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE ' MONTHLY AUDIT COMPLETE.';
    RAISE NOTICE ' Action required: % CRITICAL, % WARNING alerts.', 
                 v_critical_count, v_warning_count;
    RAISE NOTICE '=======================================================';

END;
$$;