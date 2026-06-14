const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/login — authenticate a user based on role
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        // Select the right table depending on the role
        let query = "";
        if (role === 'Customer') query = "SELECT * FROM customer WHERE email = $1 AND password = $2";
        else if (role === 'Store') query = "SELECT * FROM store WHERE email = $1 AND password = $2";
        else if (role === 'Driver') query = "SELECT * FROM truck WHERE email = $1 AND password = $2";
        else if (role === 'Admin') query = "SELECT * FROM admin WHERE email = $1 AND password = $2";

        if (!query) return res.status(400).json({ success: false, message: "Invalid role" });

        const result = await pool.query(query, [email, password]);
        if (result.rows.length > 0) {
            res.status(200).json({ success: true, message: "Login successful", user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Wrong email or password" });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// POST /api/forgot-password — reset password to a temporary value
router.post('/forgot-password', async (req, res) => {
    const { email, role } = req.body;
    const newPassword = 'reset123';
    try {
        // Map role to the correct table name
        const tables = { Customer: 'customer', Store: 'store', Driver: 'truck', Admin: 'admin' };
        const table = tables[role];
        if (!table) return res.status(400).json({ success: false, message: 'Invalid role.' });

        // Check if the account exists
        const check = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
        if (check.rows.length === 0) {
            return res.json({ success: false, message: 'No account found with this email for the selected role.' });
        }

        // Update the password
        await pool.query(`UPDATE ${table} SET password = $1 WHERE email = $2`, [newPassword, email]);
        res.json({ success: true, message: `Password reset successful. Temporary password: ${newPassword}` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

module.exports = router;