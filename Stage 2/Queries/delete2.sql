-- Delete 2: Remove an unused or specific Kashrut certification
-- Description: Removing a kashrut type that is no longer supported or needed.
DELETE FROM PRODUCT_KASHRUT 
WHERE Kashrut = 'OU';