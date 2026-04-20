// routes/alerts.js
const router  = require('express').Router();
const { MedicalAlert: Alert } = require('../models/index');
const auth    = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { patientId, severity, resolved, limit = 50 } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (severity)  filter.severity  = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('patientId', 'name bed ward');
    res.json({ data: alerts, count: alerts.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/acknowledge', auth, async (req, res) => {
  try {
    const a = await Alert.findByIdAndUpdate(
      req.params.id,
      { acknowledged: true, acknowledgedBy: req.user.name, acknowledgedAt: new Date() },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Alert not found' });
    res.json({ data: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/resolve', auth, async (req, res) => {
  try {
    const a = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    res.json({ data: a });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
