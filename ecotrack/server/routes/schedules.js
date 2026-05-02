// routes/schedules.js
const r=require('express').Router();
const {Schedule}=require('../models/index');
r.get('/',async(req,res)=>{try{res.json({data:await Schedule.find().sort({nextPickup:1})});}catch(e){res.status(500).json({error:e.message});}});
r.post('/',async(req,res)=>{try{res.status(201).json({data:await Schedule.create(req.body)});}catch(e){res.status(400).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{res.json({data:await Schedule.findByIdAndUpdate(req.params.id,req.body,{new:true})});}catch(e){res.status(400).json({error:e.message});}});
r.delete('/:id',async(req,res)=>{try{await Schedule.findByIdAndDelete(req.params.id);res.json({message:'Deleted'});}catch(e){res.status(500).json({error:e.message});}});
module.exports=r;
