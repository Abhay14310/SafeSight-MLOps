// routes/vitals.js
const router    = require('express').Router();
const { VitalLog } = require('../models/index');
const auth      = require('../middleware/auth');

// GET vitals history for a patient
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { limit = 100, from, to } = req.query;
    const filter = { patientId: req.params.patientId };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }
    const logs = await VitalLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json({ data: logs.reverse(), count: logs.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST manual vital entry
router.post('/', auth, async (req, res) => {
  try {
    const log = await VitalLog.create({ ...req.body, source: 'manual' });
    res.status(201).json({ data: log });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
