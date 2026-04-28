// routes/auth.js
const r   = require('express').Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const sign = id => jwt.sign({id}, process.env.JWT_SECRET||'eco_secret',{expiresIn:'7d'});

r.post('/login', async(req,res)=>{
  try{
    const {email,password}=req.body;
    const user = await User.findOne({email,isActive:true}).select('+password');
    if(!user||!(await user.comparePassword(password))) return res.status(401).json({error:'Invalid credentials'});
    user.lastLogin=new Date(); await user.save();
    const token=sign(user._id);
    res.json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role,zone:user.zone,preferences:user.preferences}});
  }catch(e){res.status(500).json({error:e.message});}
});
r.get('/me', async(req,res)=>{
  try{
    const token=req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({error:'No token'});
    const {id}=jwt.verify(token,process.env.JWT_SECRET||'eco_secret');
    const user=await User.findById(id);
    if(!user) return res.status(401).json({error:'Not found'});
    res.json({user:{id:user._id,name:user.name,email:user.email,role:user.role,zone:user.zone,preferences:user.preferences}});
  }catch{res.status(401).json({error:'Invalid token'});}
});
r.patch('/profile', async(req,res)=>{
  try{
    const token=req.headers.authorization?.split(' ')[1];
    const {id}=jwt.verify(token,process.env.JWT_SECRET||'eco_secret');
    const user=await User.findByIdAndUpdate(id,req.body,{new:true});
    res.json({user});
  }catch(e){res.status(400).json({error:e.message});}
});
module.exports = r;
