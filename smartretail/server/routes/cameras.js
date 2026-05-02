// routes/cameras.js
const router = require('express').Router();
const { Camera } = require('../models/index');
router.get('/',        async (req,res) => { try { res.json({ data: await Camera.find() }); } catch(e){ res.status(500).json({error:e.message}); }});
router.patch('/:id/status', async(req,res)=>{ try{ const c=await Camera.findOneAndUpdate({camId:req.params.id},{status:req.body.status},{new:true}); res.json({data:c}); }catch(e){res.status(500).json({error:e.message});}});
module.exports = router;
