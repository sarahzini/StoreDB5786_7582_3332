const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/admin/products/:id/locations
// Returns warehouse location info for a product (region, aislenb, shelfnb)
router.get('/products/:id/locations', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT w.region, l.aislenb, l.shelfnb
            FROM located l
            JOIN warehouse w ON l.warehouseid = w.warehouseid
            WHERE l.productid = $1
        `, [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json([]); }
});

// GET /api/admin/drivers/:id/orders
// Returns orders whose deliverydate is today for a given driver
router.get('/drivers/:id/orders', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT o.orderid, o.price, o.status, o.paymentmethod,
                   o.orderdate, o.deliverydate, o.customerid, o.storeid
            FROM "ORDER" o
            WHERE o.driverid = $1
              AND DATE(o.deliverydate) = CURRENT_DATE
            ORDER BY o.orderid DESC
        `, [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json([]); }
});

// GET /api/admin/delivery/:id/drivers
// Returns license plates of all trucks linked to this delivery company
router.get('/delivery/:id/drivers', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT driverid, licenseplate, maintenancestatus, active
            FROM truck
            WHERE deliverycieid = $1
            ORDER BY driverid
        `, [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json([]); }
});

module.exports = router;

// GET /api/admin/orders/:id/items
// Returns products contained in an order (from contains table)
router.get('/orders/:id/items', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT p.productname, c.quantity, c.subtotal, c.inonsale, c.saledescription
            FROM contains c
            JOIN product p ON c.productid = p.productid
            WHERE c.orderid = $1
            ORDER BY p.productname
        `, [req.params.id]);
        res.json(r.rows);
    } catch (err) { res.status(500).json([]); }
});

// POST /api/admin/morning-dispatch
// Runs the Morning Dispatch PL/pgSQL program and returns a structured report
router.post('/morning-dispatch', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const report = {
            timestamp: new Date(),
            step1: { assignments: [], total: 0, error: null },
            step2: { success: false, error: null },
        };

        // STEP 1: optimize_fleet_loading for delivery company 1
        try {
            const cursorRes = await client.query(`SELECT optimize_fleet_loading(1) AS cur`);
            const cursorName = cursorRes.rows[0].cur;

            const fetchRes = await client.query(`FETCH ALL FROM "${cursorName}"`);
            report.step1.assignments = fetchRes.rows;
            report.step1.total = fetchRes.rows.length;

            await client.query(`CLOSE "${cursorName}"`);
        } catch (err) {
            report.step1.error = err.message;
        }

        // STEP 2: process_store_inventory_transfer(product=1, store=5, qty=30)
        try {
            await client.query(`CALL process_store_inventory_transfer(1, 5, 30)`);
            report.step2.success = true;
        } catch (err) {
            report.step2.error = err.message;
        }

        await client.query('COMMIT');
        res.json({ success: true, report });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ success: false, message: err.message });
    } finally {
        client.release();
    }
});
