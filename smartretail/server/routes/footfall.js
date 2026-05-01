// routes/footfall.js
const r = require('express').Router();
const { Footfall } = require('../models/index');
r.get('/:zoneId', async(req,res)=>{ try{ res.json({data:await Footfall.find({zoneId:req.params.zoneId}).sort({timestamp:-1}).limit(100)}); }catch(e){res.status(500).json({error:e.message});}});
module.exports = r;

// Stub out remaining routes as separate files
