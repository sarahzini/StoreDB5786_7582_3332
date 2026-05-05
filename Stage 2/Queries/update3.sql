-- Update 3: Seasonal Discount
-- Description: Applying a 10% price reduction to products manufactured before 2024 to encourage sales.

UPDATE PRODUCT
SET Price = Price * 0.9
WHERE DateOfManufacture < '2024-01-01';