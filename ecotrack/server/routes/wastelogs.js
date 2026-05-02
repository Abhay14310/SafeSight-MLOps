// routes/wastelogs.js
const r=require('express').Router();
const {WasteLog}=require('../models/index');
r.get('/',async(req,res)=>{try{const{zone,type,status,limit=50}=req.query;const f={};if(zone)f.zone=zone;if(type)f.wasteType=type;if(status)f.status=status;res.json({data:await WasteLog.find(f).sort({collectedAt:-1}).limit(parseInt(limit))});}catch(e){res.status(500).json({error:e.message});}});
r.post('/',async(req,res)=>{try{const log=await WasteLog.create(req.body);res.status(201).json({data:log});}catch(e){res.status(400).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{const l=await WasteLog.findByIdAndUpdate(req.params.id,req.body,{new:true});res.json({data:l});}catch(e){res.status(400).json({error:e.message});}});
module.exports=r;
