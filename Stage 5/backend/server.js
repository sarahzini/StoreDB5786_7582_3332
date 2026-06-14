// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import route files
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const storeRoutes = require('./routes/store');
const driverRoutes = require('./routes/driver');
const adminRoutes = require('./routes/admin');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);

// Status update route (shared across roles)
const pool = require('./db');
app.put('/api/orders/update-status', async (req, res) => {
    const { orderid, status } = req.body;
    try {
        await pool.query('UPDATE "ORDER" SET status = $1 WHERE orderid = $2', [status, orderid]);

        // If delivered, update inventory accordingly
        if (status.toUpperCase() === 'DELIVERED') {
            const orderRes = await pool.query('SELECT storeid, customerid FROM "ORDER" WHERE orderid = $1', [orderid]);
            const order = orderRes.rows[0];
            const itemsRes = await pool.query('SELECT productid, quantity FROM contains WHERE orderid = $1', [orderid]);

            for (let item of itemsRes.rows) {
                if (order.customerid) {
                    // Customer order: decrease inventory
                    await pool.query(
                        'UPDATE inventory SET quantity = quantity - $1 WHERE productid = $2 AND storeid = $3',
                        [item.quantity, item.productid, order.storeid]
                    );
                } else if (order.storeid) {
                    // Restock order: increase inventory
                    await pool.query(
                        'UPDATE inventory SET quantity = quantity + $1 WHERE productid = $2 AND storeid = $3',
                        [item.quantity, item.productid, order.storeid]
                    );
                }
            }
        }

        res.json({ success: true, message: `Status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});