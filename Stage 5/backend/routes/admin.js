const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// HELPERS
// ==========================================

// Returns next available ID for a given table and id column
async function nextId(table, idCol) {
    const r = await pool.query(`SELECT COALESCE(MAX(${idCol}), 0) + 1 AS nid FROM ${table}`);
    return r.rows[0].nid;
}

// ==========================================
// GET ROUTES
// ==========================================

router.get('/drivers', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT driverid, licenseplate, capacity, maintenancestatus, email, active, deliverycieid FROM truck ORDER BY driverid`
        );
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/customers', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT customerid, customername, email, phone, city, street, loyaltytier FROM customer ORDER BY customerid`
        );
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/products', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT p.productid, p.productname, p.price, p.dateofmanufacture, p.expirationdate,
                   p.categoryid, c.categoryname, p.supplierid, s.suppliername,
                   STRING_AGG(pk.kashrut, ', ') AS kashrut_list
            FROM product p
            LEFT JOIN category c ON p.categoryid = c.categoryid
            LEFT JOIN supplier s ON p.supplierid = s.supplierid
            LEFT JOIN product_kashrut pk ON p.productid = pk.productid
            GROUP BY p.productid, p.productname, p.price, p.dateofmanufacture, p.expirationdate,
                     p.categoryid, c.categoryname, p.supplierid, s.suppliername
            ORDER BY p.productid
        `);
        res.json(r.rows);
    } catch (err) { res.status(500).json([]); }
});

router.get('/warehouses', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT w.warehouseid, w.region, w.address,
                    STRING_AGG(wm.warehousemanager, ', ') AS managers
             FROM warehouse w
             LEFT JOIN warehouse_warehousemanager wm ON w.warehouseid = wm.warehouseid
             GROUP BY w.warehouseid ORDER BY w.warehouseid`
        );
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/stores', async (req, res) => {
    try {
        const r = await pool.query(`SELECT storeid, storename, phone, rating, websiteurl, email FROM store ORDER BY storeid`);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/orders', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT orderid, customerid, storeid, driverid, price, status, paymentmethod, orderdate, deliverydate
            FROM "ORDER" ORDER BY orderid DESC
        `);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/categories', async (req, res) => {
    try {
        const r = await pool.query(`SELECT categoryid, categoryname FROM category ORDER BY categoryid`);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/suppliers', async (req, res) => {
    try {
        const r = await pool.query(`SELECT supplierid, suppliername, email, phone, city, street FROM supplier ORDER BY supplierid`);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/inventory', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT i.productid, p.productname, i.storeid, s.storename, i.quantity, i.minimumstock
            FROM inventory i
            JOIN product p ON i.productid = p.productid
            JOIN store s ON i.storeid = s.storeid
            ORDER BY i.storeid, i.productid
        `);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/delivery', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT d.deliverycieid, d.deliveryciename, d.deliveryciephonenb, d.email,
                   STRING_AGG(dr.regionserved, ', ') AS regions
            FROM deliverycompagny d
            LEFT JOIN deliverycompagny_regionserved dr ON d.deliverycieid = dr.deliverycieid
            GROUP BY d.deliverycieid ORDER BY d.deliverycieid
        `);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/contains', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT c.orderid, c.productid, p.productname, c.quantity, c.subtotal, c.inonsale, c.saledescription
            FROM contains c
            JOIN product p ON c.productid = p.productid
            ORDER BY c.orderid DESC
        `);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/located', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT l.productid, p.productname, l.warehouseid, w.region, l.aislenb, l.shelfnb
            FROM located l
            JOIN product p ON l.productid = p.productid
            JOIN warehouse w ON l.warehouseid = w.warehouseid
            ORDER BY l.warehouseid, l.productid
        `);
        res.json(r.rows);
    } catch { res.status(500).json([]); }
});

router.get('/chart', async (req, res) => {
    try {
        const r = await pool.query(`
            SELECT TO_CHAR(day_series, 'DD') as name, COALESCE(SUM(o.price), 0) as sales
            FROM generate_series(
                DATE_TRUNC('month', CURRENT_DATE),
                DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 second',
                '1 day'::interval
            ) AS day_series
            LEFT JOIN "ORDER" o ON DATE(o.orderdate) = DATE(day_series)
            GROUP BY day_series ORDER BY day_series
        `);
        res.json(r.rows.map(row => ({ name: row.name.trim(), sales: parseFloat(row.sales) })));
    } catch { res.status(500).json([]); }
});

// ==========================================
// POST ROUTES
// ==========================================

router.post('/drivers', async (req, res) => {
    const { licenseplate, capacity, email, password, deliverycieid, maintenancestatus } = req.body;
    try {
        const id = await nextId('truck', 'driverid');
        const r = await pool.query(
            `INSERT INTO truck (driverid, licenseplate, capacity, email, password, maintenancestatus, active, deliverycieid)
             VALUES ($1,$2,$3,$4,$5,$6,1,$7) RETURNING *`,
            [id, licenseplate, capacity, email, password || 'driver123', maintenancestatus || 'Good', deliverycieid]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/customers', async (req, res) => {
    const { customername, email, phone, city, street, password } = req.body;
    try {
        const id = await nextId('customer', 'customerid');
        const r = await pool.query(
            `INSERT INTO customer (customerid, customername, email, phone, city, street, password, loyaltytier)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'Standard') RETURNING *`,
            [id, customername, email, phone, city, street || '', password || 'cust123']
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/stores', async (req, res) => {
    const { storename, email, phone, password, rating, websiteurl } = req.body;
    try {
        const id = await nextId('store', 'storeid');
        const r = await pool.query(
            `INSERT INTO store (storeid, storename, email, phone, password, rating, websiteurl)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [id, storename, email, phone, password || 'store123', rating || null, websiteurl || null]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/products', async (req, res) => {
    const { productname, price, dateofmanufacture, expirationdate, categoryid, supplierid, kashrut } = req.body;
    try {
        const id = await nextId('product', 'productid');
        const r = await pool.query(
            `INSERT INTO product (productid, productname, price, dateofmanufacture, expirationdate, categoryid, supplierid)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [id, productname, price, dateofmanufacture, expirationdate, categoryid, supplierid || null]
        );
        if (kashrut) {
            for (const k of kashrut.split(',').map(s => s.trim()).filter(Boolean)) {
                await pool.query(`INSERT INTO product_kashrut (productid, kashrut) VALUES ($1,$2)`, [id, k]);
            }
        }
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/warehouses', async (req, res) => {
    const { region, address, managers } = req.body;
    try {
        const id = await nextId('warehouse', 'warehouseid');
        const r = await pool.query(
            `INSERT INTO warehouse (warehouseid, region, address) VALUES ($1,$2,$3) RETURNING *`,
            [id, region, address]
        );
        if (managers) {
            for (const m of managers.split(',').map(s => s.trim()).filter(Boolean)) {
                await pool.query(`INSERT INTO warehouse_warehousemanager (warehouseid, warehousemanager) VALUES ($1,$2)`, [id, m]);
            }
        }
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/orders', async (req, res) => {
    const { customerid, storeid, driverid, price, status, paymentmethod, orderdate } = req.body;
    try {
        const id = await nextId('"ORDER"', 'orderid');
        const r = await pool.query(
            `INSERT INTO "ORDER" (orderid, customerid, storeid, driverid, price, status, paymentmethod, orderdate)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [id, customerid || null, storeid || null, driverid || null,
             price || 0, status || 'PENDING', paymentmethod || 'Credit Card', orderdate || new Date()]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/categories', async (req, res) => {
    const { categoryname } = req.body;
    try {
        const id = await nextId('category', 'categoryid');
        const r = await pool.query(
            `INSERT INTO category (categoryid, categoryname) VALUES ($1,$2) RETURNING *`,
            [id, categoryname]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/suppliers', async (req, res) => {
    const { suppliername, email, phone, city, street } = req.body;
    try {
        const id = await nextId('supplier', 'supplierid');
        const r = await pool.query(
            `INSERT INTO supplier (supplierid, suppliername, email, phone, city, street)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [id, suppliername, email, phone, city, street]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/inventory', async (req, res) => {
    const { productid, storeid, quantity, minimumstock } = req.body;
    try {
        // inventory has composite PK (productid, storeid) — no auto-increment needed
        const r = await pool.query(
            `INSERT INTO inventory (productid, storeid, quantity, minimumstock)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (productid, storeid) DO UPDATE SET quantity = EXCLUDED.quantity, minimumstock = EXCLUDED.minimumstock
             RETURNING *`,
            [productid, storeid, quantity || 0, minimumstock || 5]
        );
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/delivery', async (req, res) => {
    const { deliveryciename, deliveryciephonenb, email, regions } = req.body;
    try {
        const id = await nextId('deliverycompagny', 'deliverycieid');
        const r = await pool.query(
            `INSERT INTO deliverycompagny (deliverycieid, deliveryciename, deliveryciephonenb, email)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [id, deliveryciename, deliveryciephonenb, email]
        );
        if (regions) {
            for (const reg of regions.split(',').map(s => s.trim()).filter(Boolean)) {
                await pool.query(`INSERT INTO deliverycompagny_regionserved (deliverycieid, regionserved) VALUES ($1,$2)`, [id, reg]);
            }
        }
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ==========================================
// PUT ROUTES
// ==========================================

router.put('/drivers/:id', async (req, res) => {
    const { licenseplate, capacity, email, password, deliverycieid, maintenancestatus } = req.body;
    try {
        let q = `UPDATE truck SET licenseplate=$1, capacity=$2, email=$3, deliverycieid=$4, maintenancestatus=$5 WHERE driverid=$6 RETURNING *`;
        let p = [licenseplate, capacity, email, deliverycieid, maintenancestatus || 'Good', req.params.id];
        if (password?.trim()) {
            q = `UPDATE truck SET licenseplate=$1, capacity=$2, email=$3, deliverycieid=$4, maintenancestatus=$5, password=$6 WHERE driverid=$7 RETURNING *`;
            p = [licenseplate, capacity, email, deliverycieid, maintenancestatus || 'Good', password, req.params.id];
        }
        const r = await pool.query(q, p);
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/customers/:id', async (req, res) => {
    const { customername, email, phone, city, street, password } = req.body;
    try {
        let q = `UPDATE customer SET customername=$1, email=$2, phone=$3, city=$4, street=$5 WHERE customerid=$6 RETURNING *`;
        let p = [customername, email, phone, city, street || '', req.params.id];
        if (password?.trim()) {
            q = `UPDATE customer SET customername=$1, email=$2, phone=$3, city=$4, street=$5, password=$6 WHERE customerid=$7 RETURNING *`;
            p = [customername, email, phone, city, street || '', password, req.params.id];
        }
        const r = await pool.query(q, p);
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/stores/:id', async (req, res) => {
    const { storename, email, phone, password, rating, websiteurl } = req.body;
    try {
        let q = `UPDATE store SET storename=$1, email=$2, phone=$3, rating=$4, websiteurl=$5 WHERE storeid=$6 RETURNING *`;
        let p = [storename, email, phone, rating || null, websiteurl || null, req.params.id];
        if (password?.trim()) {
            q = `UPDATE store SET storename=$1, email=$2, phone=$3, rating=$4, websiteurl=$5, password=$6 WHERE storeid=$7 RETURNING *`;
            p = [storename, email, phone, rating || null, websiteurl || null, password, req.params.id];
        }
        const r = await pool.query(q, p);
        res.json({ success: true, data: r.rows[0] });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/products/:id', async (req, res) => {
    const { productname, price, dateofmanufacture, expirationdate, categoryid, supplierid, kashrut } = req.body;
    try {
        await pool.query(
            `UPDATE product SET productname=$1, price=$2, dateofmanufacture=$3, expirationdate=$4, categoryid=$5, supplierid=$6 WHERE productid=$7`,
            [productname, price, dateofmanufacture, expirationdate, categoryid, supplierid || null, req.params.id]
        );
        // Replace kashrut tags
        await pool.query('DELETE FROM product_kashrut WHERE productid=$1', [req.params.id]);
        if (kashrut) {
            for (const k of kashrut.split(',').map(s => s.trim()).filter(Boolean)) {
                await pool.query(`INSERT INTO product_kashrut (productid, kashrut) VALUES ($1,$2)`, [req.params.id, k]);
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/warehouses/:id', async (req, res) => {
    const { region, address, managers } = req.body;
    try {
        await pool.query(`UPDATE warehouse SET region=$1, address=$2 WHERE warehouseid=$3`, [region, address, req.params.id]);
        await pool.query(`DELETE FROM warehouse_warehousemanager WHERE warehouseid=$1`, [req.params.id]);
        if (managers) {
            for (const m of managers.split(',').map(s => s.trim()).filter(Boolean)) {
                await pool.query(`INSERT INTO warehouse_warehousemanager (warehouseid, warehousemanager) VALUES ($1,$2)`, [req.params.id, m]);
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/orders/:id', async (req, res) => {
    const { customerid, storeid, driverid, price, status, paymentmethod, orderdate } = req.body;
    try {
        await pool.query(
            `UPDATE "ORDER" SET customerid=$1, storeid=$2, driverid=$3, price=$4, status=$5, paymentmethod=$6, orderdate=$7 WHERE orderid=$8`,
            [customerid || null, storeid || null, driverid || null, price || 0,
             status || 'PENDING', paymentmethod || 'Credit Card', orderdate || new Date(), req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/categories/:id', async (req, res) => {
    const { categoryname } = req.body;
    try {
        await pool.query(`UPDATE category SET categoryname=$1 WHERE categoryid=$2`, [categoryname, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/suppliers/:id', async (req, res) => {
    const { suppliername, email, phone, city, street } = req.body;
    try {
        await pool.query(
            `UPDATE supplier SET suppliername=$1, email=$2, phone=$3, city=$4, street=$5 WHERE supplierid=$6`,
            [suppliername, email, phone, city, street, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/inventory', async (req, res) => {
    // inventory PK is (productid, storeid) — no :id param, both come from body
    const { productid, storeid, quantity, minimumstock } = req.body;
    try {
        await pool.query(
            `UPDATE inventory SET quantity=$1, minimumstock=$2 WHERE productid=$3 AND storeid=$4`,
            [quantity, minimumstock, productid, storeid]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/delivery/:id', async (req, res) => {
    const { deliveryciename, deliveryciephonenb, email, regions } = req.body;
    try {
        await pool.query(
            `UPDATE deliverycompagny SET deliveryciename=$1, deliveryciephonenb=$2, email=$3 WHERE deliverycieid=$4`,
            [deliveryciename, deliveryciephonenb, email, req.params.id]
        );
        await pool.query(`DELETE FROM deliverycompagny_regionserved WHERE deliverycieid=$1`, [req.params.id]);
        if (regions) {
            for (const reg of regions.split(',').map(s => s.trim()).filter(Boolean)) {
                await pool.query(`INSERT INTO deliverycompagny_regionserved (deliverycieid, regionserved) VALUES ($1,$2)`, [req.params.id, reg]);
            }
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ==========================================
// DELETE ROUTES
// ==========================================

router.delete('/drivers/:id', async (req, res) => {
    try {
        await pool.query(`UPDATE "ORDER" SET driverid=NULL WHERE driverid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM truck WHERE driverid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/customers/:id', async (req, res) => {
    try {
        await pool.query(`UPDATE "ORDER" SET customerid=NULL WHERE customerid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM customer WHERE customerid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM product_kashrut WHERE productid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM located WHERE productid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM inventory WHERE productid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM product WHERE productid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/warehouses/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM warehouse_warehousemanager WHERE warehouseid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM located WHERE warehouseid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM warehouse WHERE warehouseid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/stores/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM inventory WHERE storeid=$1`, [req.params.id]);
        await pool.query(`UPDATE "ORDER" SET storeid=NULL WHERE storeid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM store WHERE storeid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/orders/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM contains WHERE orderid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM "ORDER" WHERE orderid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        // Set categoryid to NULL on products before deleting (if you want, or block)
        await pool.query(`DELETE FROM category WHERE categoryid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/suppliers/:id', async (req, res) => {
    try {
        await pool.query(`UPDATE product SET supplierid=NULL WHERE supplierid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM supplier WHERE supplierid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/inventory', async (req, res) => {
    // composite PK — productid + storeid come from query params
    const { productid, storeid } = req.query;
    try {
        await pool.query(`DELETE FROM inventory WHERE productid=$1 AND storeid=$2`, [productid, storeid]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/delivery/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM deliverycompagny_regionserved WHERE deliverycieid=$1`, [req.params.id]);
        await pool.query(`DELETE FROM deliverycompagny WHERE deliverycieid=$1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ==========================================
// EXTRA ROUTES (Merged from admin_extra.js)
// ==========================================

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

module.exports = router;