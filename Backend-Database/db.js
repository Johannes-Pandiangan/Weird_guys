const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});


const CREATE_BOOKS_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    publisher VARCHAR(255),
    year INTEGER,
    category VARCHAR(100),
    cover TEXT,
    description TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    borrowers JSONB DEFAULT '[]'::jsonb 
  );
`;

const CREATE_ADMIN_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
  );
`;

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'password';

// FUNGSI INI HANYA AKAN DIJALANKAN DARI SERVER.JS
async function initializeDatabase() {
    let client;
    try {
        client = await pool.connect(); 
        console.log("✅ Connected to PostgreSQL Client for Initialization");

        await client.query(CREATE_BOOKS_TABLE_QUERY); 
        console.log("PostgreSQL: Tabel 'books' siap.");
        
        await client.query(CREATE_ADMIN_TABLE_QUERY); 
        console.log("PostgreSQL: Tabel 'admin_users' siap.");

        const checkAdmin = await client.query('SELECT * FROM admin_users WHERE username = $1', [DEFAULT_USERNAME]);

        if (checkAdmin.rows.length === 0) {
            await client.query(
                'INSERT INTO admin_users (username, password) VALUES ($1, $2)',
                [DEFAULT_USERNAME, DEFAULT_PASSWORD]
            );
            console.log(`PostgreSQL: Admin default '${DEFAULT_USERNAME}' telah dibuat.`);
        }
        
    } catch (err) {
        console.error("❌ Database connection or initialization error:", err.stack);
        throw err; 
    } finally {
        if (client) client.release();
    }
}

module.exports = {
  initializeDatabase,
  query: (text, params) => pool.query(text, params),
  pool,
};