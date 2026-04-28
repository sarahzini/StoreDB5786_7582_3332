--To Run line by line

-- 1. URL Format Constraint (ScreenShot For READMe from this case)
-- Ensures the website URL always starts with 'http' to maintain data consistency.
ALTER TABLE STORE 
ADD CONSTRAINT check_url_format CHECK (WebSiteUrl LIKE 'http%');
-- Attempting to update a store with an invalid URL format (missing 'http')
-- This will trigger the 'check_url_format' constraint error.
UPDATE STORE 
SET WebSiteUrl = 'www.ramilevy.co.il' 
WHERE StoreID = 1;

-- 2. Logic Stock Constraint
-- Prevents errors by ensuring MinimumStock never exceeds a logical maximum (e.g., 10,000).
ALTER TABLE INVENTORY 
ADD CONSTRAINT check_min_stock_limit CHECK (MinimumStock <= 10000);

-- 3. Contact Uniqueness Constraint
-- Ensures that no two stores share the same phone number.
ALTER TABLE STORE 
ADD CONSTRAINT unique_store_phone UNIQUE (Phone);
