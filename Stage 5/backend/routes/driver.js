const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/driver/orders/:driverid — get all orders assigned to a driver
router.get('/orders/:driverid', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT orderid as id, orderdate, status FROM "ORDER" WHERE driverid = $1 ORDER BY orderdate DESC`,
            [req.params.driverid]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// GET /api/driver/stats/:driverid — get total revenue for a driver
router.get('/stats/:driverid', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COALESCE(SUM(price), 0) as totalrevenue FROM "ORDER" WHERE driverid = $1`,
            [req.params.driverid]
        );
        res.json({ totalRevenue: parseFloat(result.rows[0].totalrevenue) });
    } catch (err) {
        res.status(500).json({ totalRevenue: 0 });
    }
});

// GET /api/driver/chart/:driverid — get daily delivery count for current month
router.get('/chart/:driverid', async (req, res) => {
    try {
        const query = `
            SELECT TO_CHAR(day_series, 'DD') as day, COALESCE(COUNT(o.orderid), 0) as deliveries
            FROM generate_series(
                DATE_TRUNC('month', CURRENT_DATE)::date,
                (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date,
                '1 day'::interval
            ) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = day_series::date AND o.driverid = $1
            GROUP BY day_series ORDER BY day_series ASC
        `;
        const result = await pool.query(query, [req.params.driverid]);
        res.json(result.rows.map(r => ({ name: r.day.trim(), deliveries: parseInt(r.deliveries) })));
    } catch (err) {
        res.status(500).json([]);
    }
});

// PUT /api/driver/update — update driver email and optionally password
router.put('/update', async (req, res) => {
    const { driverid, email, password } = req.body;
    try {
        let query = `UPDATE truck SET email = $1 WHERE driverid = $2`;
        let params = [email, driverid];

        if (password && password.trim() !== '') {
            query = `UPDATE truck SET email = $1, password = $2 WHERE driverid = $3`;
            params = [email, password, driverid];
        }

        await pool.query(query, params);
        res.json({ success: true, message: "Account updated successfully!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;