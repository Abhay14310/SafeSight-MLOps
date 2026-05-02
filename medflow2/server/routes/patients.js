// routes/patients.js
const r=require('express').Router(),{Patient}=require('../models/index');
r.get('/',async(req,res)=>{try{res.json({data:await Patient.find({status:{$ne:'discharged'}}).sort({bedId:1})});}catch(e){res.status(500).json({error:e.message});}});
r.get('/:id',async(req,res)=>{try{const p=await Patient.findById(req.params.id);if(!p)return res.status(404).json({error:'Not found'});res.json({data:p});}catch(e){res.status(500).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{const p=await Patient.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});res.json({data:p});}catch(e){res.status(400).json({error:e.message});}});
module.exports=r;
