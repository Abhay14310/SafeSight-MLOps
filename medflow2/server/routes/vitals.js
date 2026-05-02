// routes/vitals.js
const r=require('express').Router(),{VitalLog}=require('../models/index');
r.get('/:patientId',async(req,res)=>{try{const{limit=100}=req.query;res.json({data:await VitalLog.find({patientId:req.params.patientId}).sort({timestamp:-1}).limit(parseInt(limit))});}catch(e){res.status(500).json({error:e.message});}});
module.exports=r;
