const pool = require('./db');

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wishlist (
                customerid INT REFERENCES customer(customerid) ON DELETE CASCADE, 
                productid INT REFERENCES product(productid) ON DELETE CASCADE, 
                PRIMARY KEY (customerid, productid)
            );
        `);
        console.log("wishlist created");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS review (
                reviewid SERIAL PRIMARY KEY, 
                productid INT REFERENCES product(productid) ON DELETE CASCADE, 
                customerid INT REFERENCES customer(customerid) ON DELETE CASCADE, 
                rating INT CHECK (rating >= 1 AND rating <= 5), 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("review created");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
