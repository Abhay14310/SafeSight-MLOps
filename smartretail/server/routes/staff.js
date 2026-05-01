// routes/staff.js
const r     = require('express').Router();
const mysql = require('mysql2/promise');
async function pool(){ return mysql.createPool({ host:process.env.MYSQL_HOST||'localhost', port:process.env.MYSQL_PORT||3307, user:process.env.MYSQL_USER||'sruser', password:process.env.MYSQL_PASSWORD||'srpass', database:process.env.MYSQL_DATABASE||'smartretail_tx' }); }
r.get('/', async(req,res)=>{ try{ const p=await pool(); const [rows]=await p.query('SELECT * FROM staff ORDER BY name'); res.json({data:rows}); }catch(e){res.json({data:[]});}});
r.patch('/:id', async(req,res)=>{ try{ const p=await pool(); const {status,zone}=req.body; await p.query('UPDATE staff SET status=?,zone=? WHERE staff_id=?',[status,zone,req.params.id]); res.json({message:'Updated'}); }catch(e){res.status(500).json({error:e.message});}});
module.exports = r;
