// routes/pose.js
const r=require('express').Router(),{PoseFrame}=require('../models/index');
r.get('/history/:patientId',async(req,res)=>{try{res.json({data:await PoseFrame.find({patientId:req.params.patientId}).sort({timestamp:-1}).limit(216)});}catch(e){res.status(500).json({error:e.message});}});
module.exports=r;
