const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// 1. Initialisation de l'application
const app = express();
app.use(cors());
app.use(express.json());

// 2. Connexion à PostgreSQL
const pool = new Pool({
    user: 'sara',
    host: 'localhost',
    database: 'new4',
    password: 'sara',
    port: 5432,
});

// ==========================================
// ROUTES GÉNÉRALES
// ==========================================

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let query = "";
        if (role === 'Customer') query = "SELECT * FROM customer WHERE email = $1 AND password = $2";
        else if (role === 'Store') query = "SELECT * FROM store WHERE email = $1 AND password = $2";
        else if (role === 'Driver') query = "SELECT * FROM truck WHERE email = $1 AND password = $2";
        else if (role === 'Admin') query = "SELECT * FROM admin WHERE email = $1 AND password = $2";

        if (!query) return res.status(400).json({ success: false, message: "Rôle invalide" });

        const result = await pool.query(query, [email, password]);
        if (result.rows.length > 0) {
            res.status(200).json({ success: true, message: "Connexion réussie", user: result.rows[0] });
        } else {
            res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });
        }
    } catch (err) {
        console.error("Erreur de login:", err.message);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

// --- CUSTOMER ROUTES ---
app.put('/api/customer/update', async (req, res) => {
    const { customerid, customername, email, phone, city, street, password } = req.body;
    try {
        const query = `UPDATE customer SET customername = $1, email = $2, phone = $3, city = $4, street = $5, password = $6 WHERE customerid = $7`;
        await pool.query(query, [customername, email, phone, city, street, password, customerid]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/customer/stats/:customerid', async (req, res) => {
    const { customerid } = req.params;
    try {
        const orderResult = await pool.query('SELECT COUNT(*) as total FROM "ORDER" WHERE customerid = $1', [customerid]);
        const totalOrders = parseInt(orderResult.rows[0].total) || 0;

        const spentResult = await pool.query('SELECT SUM(price) as total_spent FROM "ORDER" WHERE customerid = $1', [customerid]);
        const totalSpent = parseFloat(spentResult.rows[0].total_spent) || 0;

        let loyaltyTier = 'Standard';
        if (totalSpent >= 5000) loyaltyTier = 'VIP Gold';
        else if (totalSpent >= 1000) loyaltyTier = 'Premium';

        res.json({ totalOrders, totalSpent, loyaltyTier });
    } catch (err) {
        res.status(500).json({ totalOrders: 0, totalSpent: 0, loyaltyTier: 'N/A' });
    }
});

app.get('/api/customer/orders/:customerid', async (req, res) => {
    try {
        const result = await pool.query('SELECT orderid, orderdate, status FROM "ORDER" WHERE customerid = $1 ORDER BY orderdate DESC LIMIT 5', [req.params.customerid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// --- STORE ROUTES ---
app.get('/api/inventory/:storeid', async (req, res) => {
    const { storeid } = req.params;
    try {
        const query = `SELECT i.productid, p.productname, p.price, p.expirationdate, i.quantity, i.minimumstock FROM inventory i JOIN product p ON i.productid = p.productid WHERE i.storeid = $1`;
        const result = await pool.query(query, [storeid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send("Erreur du serveur");
    }
});

app.get('/api/store/orders/:storeid', async (req, res) => {
    const { storeid } = req.params;
    try {
        const query = `SELECT orderid as id, orderdate as date, status FROM "ORDER" WHERE storeid = $1 AND customerid IS NULL ORDER BY orderdate DESC LIMIT 10`;
        const result = await pool.query(query, [storeid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/store/stats/:storeid', async (req, res) => {
    const { storeid } = req.params;
    try {
        const stockAlertsResult = await pool.query("SELECT COUNT(*) as count FROM inventory WHERE storeid = $1 AND quantity <= minimumstock", [storeid]);
        const pendingOrdersResult = await pool.query('SELECT COUNT(*) as count FROM "ORDER" WHERE storeid = $1 AND customerid IS NULL AND status = \'PENDING\'', [storeid]);
        const costResult = await pool.query(`SELECT SUM(price) as total FROM "ORDER" WHERE storeid = $1 AND EXTRACT(MONTH FROM orderdate) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM orderdate) = EXTRACT(YEAR FROM CURRENT_DATE)`, [storeid]);

        const chartQuery = `
            SELECT TO_CHAR(day_series, 'DD') as day, COALESCE(SUM(o.price), 0) as total
            FROM generate_series(DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second', '1 day'::interval) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = DATE(day_series) AND o.storeid = $1 AND o.price IS NOT NULL
            GROUP BY day_series ORDER BY day_series ASC
        `;
        const chartResult = await pool.query(chartQuery, [storeid]);
        const chartData = chartResult.rows.map(row => ({ name: row.day ? row.day.trim() : 'Unknown', sales: parseFloat(row.total) || 0 }));
        const totalCost = costResult.rows[0].total ? parseFloat(costResult.rows[0].total) : 0;

        res.json({ dailySales: `₪${totalCost.toLocaleString()}`, stockAlerts: parseInt(stockAlertsResult.rows[0].count) || 0, pendingRequests: parseInt(pendingOrdersResult.rows[0].count) || 0, chartData });
    } catch (err) {
        res.status(500).json({ dailySales: "₪0", stockAlerts: 0, pendingRequests: 0, chartData: [] });
    }
});

app.put('/api/store/update', async (req, res) => {
    const { storeid, storename, phone, rating, websiteurl, email, password } = req.body;
    try {
        const query = `UPDATE store SET storename = $1, phone = $2, rating = $3, websiteurl = $4, email = $5, password = $6 WHERE storeid = $7`;
        await pool.query(query, [storename, phone, rating, websiteurl, email, password, storeid]);
        res.json({ success: true, message: "Informations mises à jour avec succès !" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/store/restock', async (req, res) => {
    const { storeid, productid, quantity } = req.body;
    try {
        const maxResult = await pool.query(`SELECT COALESCE(MAX(orderid), 0) + 1 AS nextid FROM public."ORDER"`);
        const nextId = maxResult.rows[0].nextid;
        await pool.query(`INSERT INTO public."ORDER" (orderid, storeid, orderdate, status, paymentmethod, price, driverid, customerid) VALUES ($1, $2, NOW(), 'Pending', 'Store Request', 0, NULL, NULL)`, [nextId, storeid]);
        await pool.query(`SET session_replication_role = replica`);
        await pool.query(`INSERT INTO public.contains (orderid, productid, quantity, subtotal, inonsale) VALUES ($1, $2, $3, 0, false)`, [nextId, productid, quantity]);
        await pool.query(`SET session_replication_role = DEFAULT`);
        res.json({ success: true, orderid: nextId });
    } catch (err) {
        await pool.query(`SET session_replication_role = DEFAULT`).catch(() => { });
        res.json({ success: false, message: err.message });
    }
});

// --- ORDERS ---
app.put('/api/orders/update-status', async (req, res) => {
    const { orderid, status } = req.body;
    try {
        await pool.query('UPDATE "ORDER" SET status = $1 WHERE orderid = $2', [status, orderid]);
        res.json({ success: true, message: `Statut mis à jour en ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

// --- DRIVER ROUTES ---
app.get('/api/driver/orders/:driverid', async (req, res) => {
    const { driverid } = req.params;
    try {
        const result = await pool.query(`SELECT orderid as id, orderdate, status FROM "ORDER" WHERE driverid = $1 ORDER BY orderdate DESC`, [driverid]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/driver/stats/:driverid', async (req, res) => {
    const { driverid } = req.params;
    try {
        const result = await pool.query(`SELECT COALESCE(SUM(price), 0) as totalrevenue FROM "ORDER" WHERE driverid = $1`, [driverid]);
        res.json({ totalRevenue: parseFloat(result.rows[0].totalrevenue) });
    } catch (err) {
        res.status(500).json({ totalRevenue: 0 });
    }
});

app.put('/api/driver/update', async (req, res) => {
    const { driverid, email, password } = req.body;
    try {
        await pool.query(`UPDATE truck SET email = $1, password = $2 WHERE driverid = $3`, [email, password, driverid]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/driver/chart/:driverid', async (req, res) => {
    const { driverid } = req.params;
    try {
        const query = `
            SELECT TO_CHAR(day_series, 'DD') as day, COALESCE(COUNT(o.orderid), 0) as deliveries
            FROM generate_series(DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second', '1 day'::interval) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = DATE(day_series) AND o.driverid = $1
            GROUP BY day_series ORDER BY day_series ASC
        `;
        const result = await pool.query(query, [driverid]);
        res.json(result.rows.map(r => ({ name: r.day.trim(), deliveries: parseInt(r.deliveries) })));
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// ROUTES ADMIN (GET)
// ==========================================
app.get('/api/admin/drivers', async (req, res) => {
    try {
        const result = await pool.query(`SELECT driverid, licenseplate, capacity, maintenancestatus, email, active FROM truck ORDER BY driverid ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/admin/customers', async (req, res) => {
    try {
        const result = await pool.query(`SELECT customerid, customername, email, phone, city, loyaltytier FROM customer ORDER BY customerid ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/admin/products', async (req, res) => {
    try {
        const query = `
            SELECT p.productid, p.productname, p.price, c.categoryname, STRING_AGG(pk.kashrut, ', ') AS kashrut_list
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

app.get('/api/admin/warehouses', async (req, res) => {
    try {
        const result = await pool.query(`SELECT warehouseid, region, address FROM warehouse ORDER BY warehouseid ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

app.get('/api/admin/stores', async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM store ORDER BY storeid ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

// ==========================================
// ROUTES ADMIN (POST / AJOUT)
// ==========================================
app.post('/api/admin/drivers', async (req, res) => {
    const { licenseplate, capacity, email, password } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(driverid), 0) + 1 AS nextid FROM truck');
        const nextId = maxResult.rows[0].nextid;
        const query = `INSERT INTO truck (driverid, licenseplate, capacity, email, password, maintenancestatus, active) VALUES ($1, $2, $3, $4, $5, 'OK', 1) RETURNING *`;
        const result = await pool.query(query, [nextId, licenseplate, capacity, email, password || 'driver123']);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/customers', async (req, res) => {
    const { customername, email, phone, city, password } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(customerid), 0) + 1 AS nextid FROM customer');
        const nextId = maxResult.rows[0].nextid;
        const query = `INSERT INTO customer (customerid, customername, email, phone, city, password, loyaltytier) VALUES ($1, $2, $3, $4, $5, $6, 'Standard') RETURNING *`;
        const result = await pool.query(query, [nextId, customername, email, phone, city, password || 'cust123']);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/stores', async (req, res) => {
    const { storename, email, phone, password } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(storeid), 0) + 1 AS nextid FROM store');
        const nextId = maxResult.rows[0].nextid;
        const query = `INSERT INTO store (storeid, storename, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        const result = await pool.query(query, [nextId, storename, email, phone, password || 'store123']);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/products', async (req, res) => {
    const { productname, price, dateofmanufacture, expirationdate, categoryid, supplierid, kashrut } = req.body;
    try {
        const maxResult = await pool.query('SELECT COALESCE(MAX(productid), 0) + 1 AS nextid FROM product');
        const nextId = maxResult.rows[0].nextid;
        const query = `INSERT INTO product (productid, productname, price, dateofmanufacture, expirationdate, categoryid, supplierid) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        const result = await pool.query(query, [nextId, productname, price, dateofmanufacture, expirationdate, categoryid || null, supplierid || null]);
        const newProduct = result.rows[0];

        if (kashrut) {
            const kashrutArray = kashrut.split(',').map(k => k.trim());
            for (let k of kashrutArray) {
                await pool.query(`INSERT INTO product_kashrut (productid, kashrut) VALUES ($1, $2)`, [newProduct.productid, k]);
            }
        }
        res.json({ success: true, data: newProduct });
    } catch (err) {
        console.error("Erreur ajout produit:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/admin/warehouses', async (req, res) => {
    const { region, address } = req.body;
    try {
        // 1. On va chercher le plus grand ID actuel et on ajoute 1
        const maxResult = await pool.query('SELECT COALESCE(MAX(warehouseid), 0) + 1 AS nextid FROM warehouse');
        const nextId = maxResult.rows[0].nextid;

        // 2. On insère en forçant l'utilisation de cet ID
        const query = `INSERT INTO warehouse (warehouseid, region, address) VALUES ($1, $2, $3) RETURNING *`;
        const result = await pool.query(query, [nextId, region, address]);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Erreur ajout entrepôt:", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});


app.get('/api/admin/chart', async (req, res) => {
    try {
        const query = `
            SELECT 
                TO_CHAR(day_series, 'DD') as name,
                COALESCE(SUM(o.price), 0) as sales
            FROM generate_series(
                DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second',
                '1 day'::interval
            ) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = DATE(day_series)
                AND o.price IS NOT NULL
            GROUP BY day_series
            ORDER BY day_series ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows.map(r => ({ name: r.name.trim(), sales: parseFloat(r.sales) })));
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});
// --- DANS server.js ---

app.delete('/api/admin/drivers/:id', async (req, res) => {
    try {
        // En théorie, un driver a des "ORDERS" rattachés. S'il en a, tu devrais soit le désactiver, soit mettre driverid = NULL dans "ORDER"
        await pool.query('UPDATE "ORDER" SET driverid = NULL WHERE driverid = $1', [req.params.id]);
        await pool.query('DELETE FROM truck WHERE driverid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/customers/:id', async (req, res) => {
    try {
        // Idem, un customer a des commandes.
        await pool.query('UPDATE "ORDER" SET customerid = NULL WHERE customerid = $1', [req.params.id]);
        await pool.query('DELETE FROM customer WHERE customerid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM product_kashrut WHERE productid = $1', [req.params.id]);
        await pool.query('DELETE FROM inventory WHERE productid = $1', [req.params.id]); // Ajout de la sécurité sur l'inventaire
        await pool.query('DELETE FROM product WHERE productid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/warehouses/:id', async (req, res) => {
    try {
        // C'est ICI que ça coinçait. On supprime l'inventaire de cet entrepôt d'abord.
        await pool.query('DELETE FROM inventory WHERE warehouseid = $1', [req.params.id]);
        await pool.query('DELETE FROM warehouse WHERE warehouseid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/admin/stores/:id', async (req, res) => {
    try {
        // Un store a aussi un inventaire et des commandes.
        await pool.query('DELETE FROM inventory WHERE storeid = $1', [req.params.id]);
        await pool.query('UPDATE "ORDER" SET storeid = NULL WHERE storeid = $1', [req.params.id]);
        await pool.query('DELETE FROM store WHERE storeid = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- ROUTES ADMIN (PUT / MODIFICATION) ---

app.put('/api/admin/warehouses/:id', async (req, res) => {
    const { region, address } = req.body;
    try {
        const query = `UPDATE warehouse SET region = $1, address = $2 WHERE warehouseid = $3 RETURNING *`;
        const result = await pool.query(query, [region, address, req.params.id]);
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/admin/drivers/:id', async (req, res) => {
    const { licenseplate, capacity, email, password } = req.body;
    try {
        // Note: Si le password est vide, on ne le met pas à jour (logique classique)
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

app.put('/api/admin/customers/:id', async (req, res) => {
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

app.put('/api/admin/stores/:id', async (req, res) => {
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

app.put('/api/admin/products/:id', async (req, res) => {
    const { productname, price, dateofmanufacture, expirationdate, categoryid, supplierid, kashrut } = req.body;
    try {
        const query = `UPDATE product SET productname = $1, price = $2, dateofmanufacture = $3, expirationdate = $4, categoryid = $5, supplierid = $6 WHERE productid = $7 RETURNING *`;
        const result = await pool.query(query, [productname, price, dateofmanufacture, expirationdate, categoryid || null, supplierid || null, req.params.id]);

        // Mise à jour simplifiée de la Kashrut : on supprime l'ancienne et on réinsère la nouvelle
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
// ==========================================
// LANCEMENT DU SERVEUR
// ==========================================
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur Backend démarré sur le port ${PORT}`);
});