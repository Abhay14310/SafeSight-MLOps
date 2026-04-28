// routes/vehicles.js
const r=require('express').Router();
const {Vehicle}=require('../models/index');
r.get('/',async(req,res)=>{try{res.json({data:await Vehicle.find().sort({status:1})});}catch(e){res.status(500).json({error:e.message});}});
r.post('/',async(req,res)=>{try{res.status(201).json({data:await Vehicle.create(req.body)});}catch(e){res.status(400).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{const v=await Vehicle.findOneAndUpdate({vehicleId:req.params.id},req.body,{new:true});res.json({data:v});}catch(e){res.status(400).json({error:e.message});}});
module.exports=r;
