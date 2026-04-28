// routes/reports.js
const r=require('express').Router();
const {WasteLog}=require('../models/index');
r.get('/weekly',async(req,res)=>{
  try{
    const since=new Date(Date.now()-7*86400000);
    const data=await WasteLog.aggregate([
      {$match:{collectedAt:{$gte:since}}},
      {$group:{_id:{day:{$dayOfWeek:'$collectedAt'},type:'$wasteType'},total:{$sum:'$weightKg'},count:{$sum:1}}},
      {$sort:{'_id.day':1}},
    ]);
    res.json({data});
  }catch(e){res.status(500).json({error:e.message});}
});
r.get('/by-zone',async(req,res)=>{
  try{
    const data=await WasteLog.aggregate([
      {$group:{_id:'$zone',total:{$sum:'$weightKg'},count:{$sum:1}}},
      {$sort:{total:-1}},
    ]);
    res.json({data});
  }catch(e){res.status(500).json({error:e.message});}
});
r.get('/by-type',async(req,res)=>{
  try{
    const data=await WasteLog.aggregate([
      {$group:{_id:'$wasteType',total:{$sum:'$weightKg'},count:{$sum:1}}},
      {$sort:{total:-1}},
    ]);
    res.json({data});
  }catch(e){res.status(500).json({error:e.message});}
});
module.exports=r;
