// routes/alerts.js
const r = require('express').Router();
const { Alert } = require('../models/index');
r.get('/',  async(req,res)=>{ try{ const {severity,resolved,limit=50}=req.query; const f={}; if(severity)f.severity=severity; if(resolved!==undefined)f.resolved=resolved==='true'; res.json({data:await Alert.find(f).sort({createdAt:-1}).limit(parseInt(limit))}); }catch(e){res.status(500).json({error:e.message});}});
r.patch('/:id/ack', async(req,res)=>{ try{ const a=await Alert.findByIdAndUpdate(req.params.id,{acknowledged:true,acknowledgedBy:'staff'},{new:true}); res.json({data:a}); }catch(e){res.status(500).json({error:e.message});}});
r.patch('/:id/resolve', async(req,res)=>{ try{ const a=await Alert.findByIdAndUpdate(req.params.id,{resolved:true},{new:true}); res.json({data:a}); }catch(e){res.status(500).json({error:e.message});}});
module.exports = r;
