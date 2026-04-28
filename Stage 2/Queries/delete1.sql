-- Delete 1: Remove Old Empty Orders
-- Description: Deleting orders from previous years that do not contain any items (to clean up the system).
DELETE FROM "ORDER"
WHERE OrderDate < '2025-01-01'
AND OrderId NOT IN (SELECT OrderId FROM CONTAINS);