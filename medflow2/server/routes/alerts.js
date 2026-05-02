// routes/alerts.js
const r=require('express').Router(),{Alert}=require('../models/index');
r.get('/',async(req,res)=>{try{const{severity,resolved='false',limit=60}=req.query;const f={};if(severity)f.severity=severity;if(resolved!==undefined)f.resolved=resolved==='true';res.json({data:await Alert.find(f).sort({createdAt:-1}).limit(parseInt(limit))});}catch(e){res.status(500).json({error:e.message});}});
r.get('/patient/:patientId',async(req,res)=>{try{res.json({data:await Alert.find({patientId:req.params.patientId,resolved:false}).sort({createdAt:-1}).limit(20)});}catch(e){res.status(500).json({error:e.message});}});
r.patch('/:id/ack',async(req,res)=>{try{res.json({data:await Alert.findByIdAndUpdate(req.params.id,{acknowledged:true},{new:true})});}catch(e){res.status(500).json({error:e.message});}});
r.patch('/:id/resolve',async(req,res)=>{try{res.json({data:await Alert.findByIdAndUpdate(req.params.id,{resolved:true},{new:true})});}catch(e){res.status(500).json({error:e.message});}});
module.exports=r;
