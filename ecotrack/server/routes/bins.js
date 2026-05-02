// routes/bins.js
const r=require('express').Router();
const {Bin}=require('../models/index');
r.get('/',async(req,res)=>{try{const{zone,status}=req.query;const f={};if(zone)f.zone=zone;if(status)f.status=status;res.json({data:await Bin.find(f).sort({fillLevel:-1})});}catch(e){res.status(500).json({error:e.message});}});
r.post('/',async(req,res)=>{try{res.status(201).json({data:await Bin.create(req.body)});}catch(e){res.status(400).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{const b=await Bin.findOneAndUpdate({binId:req.params.id},req.body,{new:true});res.json({data:b});}catch(e){res.status(400).json({error:e.message});}});
module.exports=r;
