// Load environment variables from .env file
require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool to PostgreSQL using env variables
const pool = new Pool({
    user: process.env.DB_USER_SECRET,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME_SECRET,
    password: process.env.DB_PASSWORD_SECRET,
    port: process.env.DB_PORT || 5432,
});

module.exports = pool;