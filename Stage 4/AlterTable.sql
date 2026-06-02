
--For Procedure 2 we need to add a column to the CUSTOMER table
--to store the loyalty tier of each customer.
ALTER TABLE CUSTOMER ADD COLUMN IF NOT EXISTS LoyaltyTier VARCHAR(20) DEFAULT 'Standard';