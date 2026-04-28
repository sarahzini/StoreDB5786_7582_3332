--To run line by line 

-- INDEX 1: Optimizing Product Name searches (Textual search) (The screenshot in ReadMe from this exemple)
-- Useful for customer-facing search bars.
EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ProductName = 'Coconut - Creamed, Pure'; --(ScreenShot 1)
CREATE INDEX idx_product_name ON PRODUCT(ProductName);
EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ProductName = 'Coconut - Creamed, Pure';--(ScreenShot 2)

-- INDEX 2: Optimizing Expiration Date queries (Date filtering)
-- Specifically improves Query 4 performance regarding stock rotation.
EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ExpirationDate BETWEEN '2026-01-01' AND '2026-12-31';
CREATE INDEX idx_expiration_date ON PRODUCT(ExpirationDate);
EXPLAIN ANALYZE SELECT * FROM PRODUCT WHERE ExpirationDate BETWEEN '2026-01-01' AND '2026-12-31';

-- INDEX 3: Optimizing Order Price analysis (Numeric range)
-- Vital for financial reporting on the 1,000+ orders now in the database.
EXPLAIN ANALYZE SELECT * FROM "ORDER" WHERE Price > 400;
CREATE INDEX idx_order_price ON "ORDER"(Price);
EXPLAIN ANALYZE SELECT * FROM "ORDER" WHERE Price > 400;