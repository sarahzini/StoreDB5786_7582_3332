const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// GET ROUTES
// ==========================================

// GET /api/admin/drivers — list all drivers
router.get('/drivers', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT driverid, licenseplate, capacity, maintenancestatus, email, active FROM truck ORDER BY driverid ASC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/admin/customers — list all customers
router.get('/customers', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT customerid, customername, email, phone, city, loyaltytier FROM customer ORDER BY customerid ASC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/admin/products — list all products with category and kashrut
router.get('/products', async (req, res) => {
    try {
        const query = `
            SELECT p.productid, p.productname, p.price, c.categoryname,
                   STRING_AGG(pk.kashrut, ', ') AS kashrut_list
            FROM product p
            LEFT JOIN category c ON p.categoryid = c.categoryid
            LEFT JOIN product_kashrut pk ON p.productid = pk.productid
            GROUP BY p.productid, p.productname, p.price, c.categoryname
            ORDER BY p.productid ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/admin/warehouses — list all warehouses
router.get('/warehouses', async (req, res) => {
    try {
        const result = await pool.query(`SELECT warehouseid, region, address FROM warehouse ORDER BY warehouseid ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/admin/stores — list all stores
router.get('/stores', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM store ORDER BY storeid ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/admin/orders — list all orders
router.get('/orders', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT orderid, customerid, storeid, driverid, price, status, paymentmethod, orderdate
            FROM "ORDER"
            ORDER BY orderid DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/admin/chart — daily sales chart for current month
router.get('/chart', async (req, res) => {
    try {
        const query = `
            SELECT TO_CHAR(day_series, 'DD') as name, COALESCE(SUM(o.price), 0) as sales
            FROM generate_series(
                DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second',
                '1 day'::interval
            ) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = DATE(day_series) AND o.price IS NOT NULL
            GROUP BY day_series
            ORDER BY day_series ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows.map(r => ({ name: r.name.trim(), sales: parseFloat(r.sales) })));
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// POST ROUTES (ADD)
// ==========================================

// POST /api/admin/drivers — add a new driver
router.post('/drivers', async (req, res) => {
    const { licenseplate, capacity, email, password } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(driverid), 0) + 1 AS nextid FROM truck');
        const nextId = maxResult.rows[0].nextid;
        const result = await pool.query(
            `INSERT INTO truck (driverid, licenseplate, capacity, email, password, maintenancestatus, active)
             VALUES ($1, $2, $3, $4, $5, 'OK', 1) RETURNING *`,
            [nextId, licenseplate, capacity, email, password || 'driver123']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/customers — add a new customer
router.post('/customers', async (req, res) => {
    const { customername, email, phone, city, password } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(customerid), 0) + 1 AS nextid FROM customer');
        const nextId = maxResult.rows[0].nextid;
        const result = await pool.query(
            `INSERT INTO customer (customerid, customername, email, phone, city, password, loyaltytier)
             VALUES ($1, $2, $3, $4, $5, $6, 'Standard') RETURNING *`,
            [nextId, customername, email, phone, city, password || 'cust123']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/stores — add a new store
router.post('/stores', async (req, res) => {
    const { storename, email, phone, password } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(storeid), 0) + 1 AS nextid FROM store');
        const nextId = maxResult.rows[0].nextid;
        const result = await pool.query(
            `INSERT INTO store (storeid, storename, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nextId, storename, email, phone, password || 'store123']
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/products — add a new product with optional kashrut tags
router.post('/products', async (req, res) => {
    const { productname, price, dateofmanufacture, expirationdate, categoryid, supplierid, kashrut } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(productid), 0) + 1 AS nextid FROM product');
        const nextId = maxResult.rows[0].nextid;
        const result = await pool.query(
            `INSERT INTO product (productid, productname, price, dateofmanufacture, expirationdate, categoryid, supplierid)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [nextId, productname, price, dateofmanufacture, expirationdate, categoryid || null, supplierid || null]
        );
        const newProduct = result.rows[0];

        // Insert kashrut tags if provided
        if (kashrut) {
            const kashrutArray = kashrut.split(',').map(k => k.trim());
            for (let k of kashrutArray) {
                await pool.query(`INSERT INTO product_kashrut (productid, kashrut) VALUES ($1, $2)`, [newProduct.productid, k]);
            }
        }
        res.json({ success: true, data: newProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/warehouses — add a new warehouse
router.post('/warehouses', async (req, res) => {
    const { region, address } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(warehouseid), 0) + 1 AS nextid FROM warehouse');
        const nextId = maxResult.rows[0].nextid;
        const result = await pool.query(
            `INSERT INTO warehouse (warehouseid, region, address) VALUES ($1, $2, $3) RETURNING *`,
            [nextId, region, address]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/orders — add a new order
router.post('/orders', async (req, res) => {
    const { customerid, storeid, driverid, price, status, paymentmethod, orderdate } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(orderid), 0) + 1 AS nextid FROM "ORDER"');
        const nextId = maxResult.rows[0].nextid;
        const result = await pool.query(
            `INSERT INTO "ORDER" (orderid, customerid, storeid, driverid, price, status, paymentmethod, orderdate)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [nextId, customerid || null, storeid || null, driverid || null,
             price || 0, status || 'PENDING', paymentmethod || 'Credit Card', orderdate || new Date()]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// PUT ROUTES (UPDATE)
// ==========================================

// PUT /api/admin/drivers/:id
router.put('/drivers/:id', async (req, res) => {
    const { licenseplate, capacity, email, password } = req.body;
    try {
        let query = `UPDATE truck SET licenseplate = $1, capacity = $2, email = $3 WHERE driverid = $4 RETURNING *`;
        let params = [licenseplate, capacity, email, req.params.id];

        if (password && password.trim() !== "") {
            query = `UPDATE truck SET licenseplate = $1, capacity = $2, email = $3, password = $4 WHERE driverid = $5 RETURNING *`;
            params = [licenseplate, capacity, email, password, req.params.id];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/admin/customers/:id
router.put('/customers/:id', async (req, res) => {
    const { customername, email, phone, city, password } = req.body;
    try {
        let query = `UPDATE customer SET customername = $1, email = $2, phone = $3, city = $4 WHERE customerid = $5 RETURNING *`;
        let params = [customername, email, phone, city, req.params.id];

        if (password && password.trim() !== "") {
            query = `UPDATE customer SET customername = $1, email = $2, phone = $3, city = $4, password = $5 WHERE customerid = $6 RETURNING *`;
            params = [customername, email, phone, city, password, req.params.id];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/admin/stores/:id
router.put('/stores/:id', async (req, res) => {
    const { storename, email, phone, password } = req.body;
    try {
        let query = `UPDATE store SET storename = $1, email = $2, phone = $3 WHERE storeid = $4 RETURNING *`;
        let params = [storename, email, phone, req.params.id];

        if (password && password.trim() !== "") {
            query = `UPDATE store SET storename = $1, email = $2, phone = $3, password = $4 WHERE storeid = $5 RETURNING *`;
            params = [storename, email, phone, password, req.params.id];
        }

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
    const { productname, price, dateofmanufacture, expirationdate, categoryid, supplierid, kashrut } = req.body;
    try {
        const result = await pool.query(
            `UPDATE product SET productname = $1, price = $2, dateofmanufacture = $3, expirationdate = $4,
             categoryid = $5, supplierid = $6 WHERE productid = $7 RETURNING *`,
            [productname, price, dateofmanufacture, expirationdate, categoryid || null, supplierid || null, req.params.id]
        );

        // Replace kashrut tags
        await pool.query('DELETE FROM product_kashrut WHERE productid = $1', [req.params.id]);
        if (kashrut) {
            const kashrutArray = kashrut.split(',').map(k => k.trim());
            for (let k of kashrutArray) {
                await pool.query(`INSERT INTO product_kashrut (productid, kashrut) VALUES ($1, $2)`, [req.params.id, k]);
            }
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/admin/warehouses/:id
router.put('/warehouses/:id', async (req, res) => {
    const { region, address } = req.body;
    try {
        const result = await pool.query(
            `UPDATE warehouse SET region = $1, address = $2 WHERE warehouseid = $3 RETURNING *`,
            [region, address, req.params.id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/admin/orders/:id
router.put('/orders/:id', async (req, res) => {
    const { customerid, storeid, driverid, price, status, paymentmethod, orderdate } = req.body;
    try {
        const result = await pool.query(
            `UPDATE "ORDER" SET customerid = $1, storeid = $2, driverid = $3, price = $4,
             status = $5, paymentmethod = $6, orderdate = $7 WHERE orderid = $8 RETURNING *`,
            [customerid || null, storeid || null, driverid || null, price || 0,
             status || 'PENDING', paymentmethod || 'Credit Card', orderdate || new Date(), req.params.id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// DELETE ROUTES
// ==========================================

// DELETE /api/admin/drivers/:id
router.delete('/drivers/:id', async (req, res) => {
    try {
        await pool.query('UPDATE "ORDER" SET driverid = NULL WHERE driverid = $1', [req.params.id]);
        await pool.query('DELETE FROM truck WHERE driverid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/customers/:id
router.delete('/customers/:id', async (req, res) => {
    try {
        await pool.query('UPDATE "ORDER" SET customerid = NULL WHERE customerid = $1', [req.params.id]);
        await pool.query('DELETE FROM customer WHERE customerid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM product_kashrut WHERE productid = $1', [req.params.id]);
        await pool.query('DELETE FROM inventory WHERE productid = $1', [req.params.id]);
        await pool.query('DELETE FROM product WHERE productid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/warehouses/:id
router.delete('/warehouses/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE warehouseid = $1', [req.params.id]);
        await pool.query('DELETE FROM warehouse WHERE warehouseid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/stores/:id
router.delete('/stores/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE storeid = $1', [req.params.id]);
        await pool.query('UPDATE "ORDER" SET storeid = NULL WHERE storeid = $1', [req.params.id]);
        await pool.query('DELETE FROM store WHERE storeid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/orders/:id
router.delete('/orders/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM contains WHERE orderid = $1', [req.params.id]);
        await pool.query('DELETE FROM "ORDER" WHERE orderid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;