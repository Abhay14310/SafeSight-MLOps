// routes/settings.js
const r=require('express').Router();
let cfg={ orgName:'General Hospital ICU', ward:'ICU-4A', alertSound:true, tasukeUrl: process.env.TASUKE_URL||'http://localhost:3000', thresholds:{ hr_low:45,hr_high:130,spo2_warn:94,resp_high:25 } };
r.get('/',(req,res)=>res.json({data:cfg}));
r.patch('/',(req,res)=>{cfg={...cfg,...req.body};res.json({data:cfg});});
r.get('/tasuke-url',(req,res)=>res.json({url:cfg.tasukeUrl}));
module.exports=r;
