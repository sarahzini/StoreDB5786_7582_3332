const express = require('express');
const router = express.Router();
const pool = require('../db');

// PUT /api/customer/update — update customer profile (with optional password change)
router.put('/update', async (req, res) => {
    const { customerid, customername, email, phone, city, street, password } = req.body;
    try {
        let query = `UPDATE customer SET customername = $1, email = $2, phone = $3, city = $4, street = $5 WHERE customerid = $6`;
        let params = [customername, email, phone, city, street, customerid];

        // Include password in update only if provided
        if (password && password.trim() !== '') {
            query = `UPDATE customer SET customername = $1, email = $2, phone = $3, city = $4, street = $5, password = $6 WHERE customerid = $7`;
            params = [customername, email, phone, city, street, password, customerid];
        }

        await pool.query(query, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/customer/stats/:customerid — get order count, total spent, and loyalty tier
router.get('/stats/:customerid', async (req, res) => {
    const { customerid } = req.params;
    try {
        const orderResult = await pool.query('SELECT COUNT(*) as total FROM "ORDER" WHERE customerid = $1', [customerid]);
        const totalOrders = parseInt(orderResult.rows[0].total) || 0;

        const spentResult = await pool.query('SELECT SUM(price) as total_spent FROM "ORDER" WHERE customerid = $1', [customerid]);
        const totalSpent = parseFloat(spentResult.rows[0].total_spent) || 0;

        // Determine loyalty tier based on total amount spent
        let loyaltyTier = 'Standard';
        if (totalSpent >= 5000) loyaltyTier = 'VIP Gold';
        else if (totalSpent >= 1000) loyaltyTier = 'Premium';

        res.json({ totalOrders, totalSpent, loyaltyTier });
    } catch (err) {
        res.status(500).json({ totalOrders: 0, totalSpent: 0, loyaltyTier: 'N/A' });
    }
});

// GET /api/customer/orders/:customerid — get all orders for a customer
router.get('/orders/:customerid', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT orderid, orderdate, status FROM "ORDER" WHERE customerid = $1 ORDER BY orderdate DESC',
            [req.params.customerid]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// POST /api/customer/order — place a new order
router.post('/order', async (req, res) => {
    const { customerid, productid, quantity, storeid } = req.body;
    const chosenStoreId = storeid || 1;

    try {
        // Get product price
        const prod = await pool.query('SELECT price FROM product WHERE productid = $1', [productid]);
        if (prod.rows.length === 0) return res.status(404).json({ success: false, message: "Product not found" });

        const price = prod.rows[0].price * quantity;

        // Generate next order ID manually
        const maxResult = await pool.query('SELECT COALESCE(MAX(orderid), 0) + 1 AS nextid FROM "ORDER"');
        const nextId = maxResult.rows[0].nextid;

        // Insert the order
        await pool.query(
            'INSERT INTO "ORDER" (orderid, customerid, storeid, orderdate, status, price, paymentmethod) VALUES ($1, $2, $3, NOW(), $4, $5, $6)',
            [nextId, customerid, chosenStoreId, 'PENDING', price, 'Credit Card']
        );

        // Insert order items
        await pool.query(
            'INSERT INTO contains (orderid, productid, quantity, subtotal, inonsale) VALUES ($1, $2, $3, $4, false)',
            [nextId, productid, quantity, price]
        );

        res.json({ success: true, orderid: nextId });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/customer/:id — fetch a customer by ID (must be last to avoid intercepting named routes)
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM customer WHERE customerid = $1', [req.params.id]);
        if (result.rows.length > 0) {
            res.json({ success: true, user: result.rows[0] });
        } else {
            res.json({ success: false, message: 'Customer not found.' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
router.put('/order/:id/cancel', async (req, res) => {
    try {
        await pool.query("UPDATE \"ORDER\" SET status = 'CANCELLED' WHERE orderid = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;