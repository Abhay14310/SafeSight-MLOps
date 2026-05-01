// routes/tasks.js
const r=require('express').Router(),{Task}=require('../models/index');
r.get('/',async(req,res)=>{try{const{bedId,status}=req.query;const f={};if(bedId)f.bedId=bedId;if(status)f.status=status;res.json({data:await Task.find(f).sort({urgency:1,dueAt:1})});}catch(e){res.status(500).json({error:e.message});}});
r.post('/',async(req,res)=>{try{res.status(201).json({data:await Task.create(req.body)});}catch(e){res.status(400).json({error:e.message});}});
r.patch('/:id',async(req,res)=>{try{res.json({data:await Task.findByIdAndUpdate(req.params.id,req.body,{new:true})});}catch(e){res.status(400).json({error:e.message});}});
module.exports=r;
