// routes/wasteRoutes.js
const r=require('express').Router();
const {Route}=require('../models/index');
r.get('/',async(req,res)=>{try{res.json({data:await Route.find().sort({scheduledAt:-1})});}catch(e){res.status(500).json({error:e.message});}});
r.post('/',async(req,res)=>{try{res.status(201).json({data:await Route.create(req.body)});}catch(e){res.status(400).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{const rt=await Route.findByIdAndUpdate(req.params.id,req.body,{new:true});res.json({data:rt});}catch(e){res.status(400).json({error:e.message});}});
module.exports=r;
