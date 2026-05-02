// routes/dashboard.js
const r=require('express').Router();
const {WasteLog,Vehicle,Bin,Alert}=require('../models/index');
r.get('/summary',async(req,res)=>{
  try{
    const today=new Date(); today.setHours(0,0,0,0);
    const [totalLogs,todayLogs,vehicles,bins,alerts,byType]=await Promise.all([
      WasteLog.countDocuments(),
      WasteLog.find({collectedAt:{$gte:today}}),
      Vehicle.find(),
      Bin.find(),
      Alert.countDocuments({resolved:false,acknowledged:false}),
      WasteLog.aggregate([{$group:{_id:'$wasteType',total:{$sum:'$weightKg'},count:{$sum:1}}}]),
    ]);
    const todayWeight=todayLogs.reduce((s,l)=>s+l.weightKg,0);
    const activeVehicles=vehicles.filter(v=>v.status==='active').length;
    const fullBins=bins.filter(b=>b.fillLevel>=80).length;
    res.json({data:{totalLogs,todayWeight:Math.round(todayWeight),activeVehicles,totalVehicles:vehicles.length,fullBins,totalBins:bins.length,alerts,byType,recycledToday:Math.round(todayWeight*0.35),co2Saved:Math.round(todayWeight*0.22)}});
  }catch(e){res.status(500).json({error:e.message});}
});
module.exports=r;
