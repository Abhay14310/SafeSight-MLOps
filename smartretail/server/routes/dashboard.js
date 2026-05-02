// routes/dashboard.js
const router = require('express').Router();
const { Inventory, Footfall, Alert } = require('../models/index');

router.get('/summary', async (req, res) => {
  try {
    const [lowStock, critAlerts, totalProducts, recentFootfall] = await Promise.all([
      Inventory.countDocuments({ status: { $in: ['low_stock','out_of_stock'] } }),
      Alert.countDocuments({ severity:'critical', resolved:false }),
      Inventory.countDocuments(),
      Footfall.find().sort({ timestamp:-1 }).limit(50),
    ]);
    res.json({ data: { lowStock, critAlerts, totalProducts, recentFootfall } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
