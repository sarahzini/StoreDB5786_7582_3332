-- Update 1: Restock Based on Minimum
-- Description: Adding 100 units to the inventory for all products that have fallen below their minimum stock threshold.

UPDATE INVENTORY
SET Quantity = Quantity + 100
WHERE Quantity < MinimumStock;