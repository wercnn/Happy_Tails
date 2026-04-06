const mysql = require('mysql2/promise');
require('dotenv').config();

const dbPort = Number(process.env.DB_PORT || 3306);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number.isInteger(dbPort) && dbPort > 0 ? dbPort : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Startup health check so connection problems are visible immediately.
pool.query('SELECT 1')
  .then(() => console.log('✓ Database connected'))
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    console.error('  Details:', {
      code: err.code,
      errno: err.errno,
      host: process.env.DB_HOST,
      port: Number.isInteger(dbPort) && dbPort > 0 ? dbPort : 3306,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
    });
  });

module.exports = pool;