const r = require('express').Router();
r.get('/', (req,res)=>res.json({data:[]}));
module.exports = r;
