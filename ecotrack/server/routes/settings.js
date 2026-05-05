// routes/settings.js
const r=require('express').Router();
// In-memory settings store (replace with DB for prod)
let settings={
  orgName:'GreenCity Waste Management',
  orgEmail:'ops@greencity.eco',
  timezone:'Asia/Kolkata',
  weightUnit:'kg',
  currency:'INR',
  alertThresholds:{ binFull:80, vehicleLoad:90, missedPickupHrs:4 },
  notifications:{ email:true, sms:false, push:true },
  integrations:{ tasukeUrl: process.env.TASUKE_URL||'http://localhost:4000' },
};
r.get('/',      (req,res)=>res.json({data:settings}));
r.patch('/',    (req,res)=>{ settings={...settings,...req.body}; res.json({data:settings}); });
r.get('/tasuke-url',(req,res)=>res.json({url:settings.integrations.tasukeUrl}));
module.exports=r;
