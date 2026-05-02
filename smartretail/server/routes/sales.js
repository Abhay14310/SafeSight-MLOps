// routes/sales.js — MySQL-based
const r       = require('express').Router();
const mysql   = require('mysql2/promise');

async function getPool() {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3307,
    user: process.env.MYSQL_USER || 'sruser',
    password: process.env.MYSQL_PASSWORD || 'srpass',
    database: process.env.MYSQL_DATABASE || 'smartretail_tx',
  });
}

r.get('/summary', async(req,res)=>{
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS tx_count,
        SUM(total) AS revenue,
        AVG(total) AS avg_basket,
        SUM(items_count) AS total_items
      FROM transactions
      WHERE DATE(created_at) = CURDATE()
    `);
    res.json({ data: rows[0] });
  } catch(e) { res.json({ data: { tx_count:0, revenue:0, avg_basket:0, total_items:0 } }); }
});

r.get('/by-zone', async(req,res)=>{
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT zone, COUNT(*) AS tx, SUM(total) AS revenue
      FROM transactions WHERE DATE(created_at) = CURDATE()
      GROUP BY zone ORDER BY revenue DESC
    `);
    res.json({ data: rows });
  } catch(e) { res.json({ data: [] }); }
});

r.get('/recent', async(req,res)=>{
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 20');
    res.json({ data: rows });
  } catch(e) { res.json({ data: [] }); }
});

module.exports = r;
