// routes/inventory.js
const router    = require('express').Router();
const { Inventory } = require('../models/index');
router.get('/', async(req,res)=>{ try{ const {zone,status,search}=req.query; const f={}; if(zone)f.zone=zone; if(status)f.status=status; if(search)f.$or=[{name:{$regex:search,$options:'i'}},{sku:{$regex:search,$options:'i'}}]; res.json({data:await Inventory.find(f).sort({status:1,name:1})}); }catch(e){res.status(500).json({error:e.message});}});
router.patch('/:id', async(req,res)=>{ try{ const i=await Inventory.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}); res.json({data:i}); }catch(e){res.status(400).json({error:e.message});}});
module.exports = router;
