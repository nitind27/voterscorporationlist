import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || '82.25.121.33',
  user: process.env.DB_USER || 'u743335965_voters',
  password: process.env.DB_PASS || 'Weclocks@123',
  database: process.env.DB_NAME || 'u743335965_voters',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
