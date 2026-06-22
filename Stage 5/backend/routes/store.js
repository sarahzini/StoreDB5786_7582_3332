const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/store/:storeid — fetch a store by ID


// GET /api/store/inventory/:storeid — get inventory for a store
router.get('/inventory/:storeid', async (req, res) => {
    try {
        const query = `
            SELECT i.productid, p.productname, p.price, p.expirationdate, i.quantity, i.minimumstock
            FROM inventory i
            JOIN product p ON i.productid = p.productid
            WHERE i.storeid = $1
        `;
        const result = await pool.query(query, [req.params.storeid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// GET /api/store/orders/:storeid — get store restock orders (no customer)
router.get('/orders/:storeid', async (req, res) => {
    try {
        const query = `
            SELECT orderid as id, orderdate as date, status
            FROM "ORDER"
            WHERE storeid = $1 AND customerid IS NULL
            ORDER BY orderdate DESC
        `;
        const result = await pool.query(query, [req.params.storeid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/store/order-details/:orderid — get full details of a specific order
router.get('/order-details/:orderid', async (req, res) => {
    try {
        const orderRes = await pool.query(
            `SELECT orderid, orderdate, status, price FROM "ORDER" WHERE orderid = $1`,
            [req.params.orderid]
        );
        const itemsRes = await pool.query(
            `SELECT c.productid, p.productname, p.price as unitprice, c.quantity, c.subtotal
             FROM contains c
             JOIN product p ON c.productid = p.productid
             WHERE c.orderid = $1`,
            [req.params.orderid]
        );
        res.json({ order: orderRes.rows[0], items: itemsRes.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/store/products — get all products with kashrut info
router.get('/products', async (req, res) => {
    try {
        const query = `
            SELECT p.productid, p.productname, p.price, p.expirationdate,
                   c.categoryname,
                   STRING_AGG(pk.kashrut, ', ') AS kashrut_list
            FROM product p
            LEFT JOIN category c ON p.categoryid = c.categoryid
            LEFT JOIN product_kashrut pk ON p.productid = pk.productid
            GROUP BY p.productid, p.productname, p.price, p.expirationdate, c.categoryname
            ORDER BY p.productid ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/store/stats/:storeid — get dashboard stats for a store
router.get('/stats/:storeid', async (req, res) => {
    const { storeid } = req.params;
    try {
        const stockAlertsResult = await pool.query(
            "SELECT COUNT(*) as count FROM inventory WHERE storeid = $1 AND quantity <= minimumstock",
            [storeid]
        );
        const pendingOrdersResult = await pool.query(
            `SELECT COUNT(*) as count FROM "ORDER" WHERE storeid = $1 AND customerid IS NULL AND status ILIKE 'pending'`,
            [storeid]
        );
        const costResult = await pool.query(
            `SELECT SUM(price) as total FROM "ORDER"
             WHERE storeid = $1
             AND EXTRACT(MONTH FROM orderdate) = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM orderdate) = EXTRACT(YEAR FROM CURRENT_DATE)`,
            [storeid]
        );

        // Daily sales chart for current month
        const chartQuery = `
            SELECT TO_CHAR(day_series, 'DD') as day, COALESCE(SUM(o.price), 0) as total
            FROM generate_series(
                DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second',
                '1 day'::interval
            ) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = DATE(day_series)
                AND o.storeid = $1 AND o.price IS NOT NULL
            GROUP BY day_series ORDER BY day_series ASC
        `;
        const chartResult = await pool.query(chartQuery, [storeid]);
        const chartData = chartResult.rows.map(row => ({
            name: row.day ? row.day.trim() : 'Unknown',
            sales: parseFloat(row.total) || 0
        }));
        const totalCost = parseFloat(costResult.rows[0].total) || 0;

        res.json({
            dailySales: `₪${totalCost.toLocaleString()}`,
            stockAlerts: parseInt(stockAlertsResult.rows[0].count) || 0,
            pendingRequests: parseInt(pendingOrdersResult.rows[0].count) || 0,
            chartData
        });
    } catch (err) {
        res.status(500).json({ dailySales: "₪0", stockAlerts: 0, pendingRequests: 0, chartData: [] });
    }
});

// PUT /api/store/update — update store profile
router.put('/update', async (req, res) => {
    const { storeid, storename, phone, rating, websiteurl, email, password } = req.body;
    try {
        let query = `UPDATE store SET storename = $1, phone = $2, rating = $3, websiteurl = $4, email = $5 WHERE storeid = $6`;
        let params = [storename, phone, rating, websiteurl, email, storeid];

        if (password && password.trim() !== '') {
            query = `UPDATE store SET storename = $1, phone = $2, rating = $3, websiteurl = $4, email = $5, password = $6 WHERE storeid = $7`;
            params = [storename, phone, rating, websiteurl, email, password, storeid];
        }

        await pool.query(query, params);
        res.json({ success: true, message: "Store updated successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/store/restock — create a restock order for a store
router.post('/restock', async (req, res) => {
    const { storeid, productid, quantity } = req.body;
    try {
        const productRes = await pool.query(`SELECT price FROM product WHERE productid = $1`, [productid]);
        if (productRes.rows.length === 0) {
            return res.json({ success: false, message: "Product not found." });
        }

        const unitPrice = parseFloat(productRes.rows[0].price);
        const totalPrice = unitPrice * quantity;

        // Generate next order ID
        const maxResult = await pool.query(`SELECT COALESCE(MAX(orderid), 0) + 1 AS nextid FROM public."ORDER"`);
        const nextId = maxResult.rows[0].nextid;

        await pool.query(
            `INSERT INTO public."ORDER" (orderid, storeid, orderdate, status, paymentmethod, price, driverid, customerid)
             VALUES ($1, $2, NOW(), 'PENDING', 'Store Request', $3, NULL, NULL)`,
            [nextId, storeid, totalPrice]
        );

        // Temporarily disable FK checks to insert into contains
        await pool.query(`SET session_replication_role = replica`);
        await pool.query(
            `INSERT INTO public.contains (orderid, productid, quantity, subtotal, inonsale)
             VALUES ($1, $2, $3, $4, false)`,
            [nextId, productid, quantity, totalPrice]
        );
        await pool.query(`SET session_replication_role = DEFAULT`);

        res.json({ success: true, orderid: nextId });
    } catch (err) {
        await pool.query(`SET session_replication_role = DEFAULT`).catch(() => { });
        res.json({ success: false, message: err.message });
    }
});
router.get('/:storeid', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM store WHERE storeid = $1', [req.params.storeid]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;