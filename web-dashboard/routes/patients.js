// routes/patients.js
const router   = require('express').Router();
const Patient  = require('../models/Patient');
const auth     = require('../middleware/auth');

// GET all patients
router.get('/', auth, async (req, res) => {
  try {
    const { ward, status, search } = req.query;
    const filter = {};
    if (ward)   filter.ward   = ward;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mrn:  { $regex: search, $options: 'i' } },
    ];
    const patients = await Patient.find(filter).sort({ status: 1, name: 1 });
    res.json({ data: patients, count: patients.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single patient
router.get('/:id', auth, async (req, res) => {
  try {
    const pt = await Patient.findById(req.params.id);
    if (!pt) return res.status(404).json({ error: 'Patient not found' });
    res.json({ data: pt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create patient
router.post('/', auth, async (req, res) => {
  try {
    const pt = await Patient.create(req.body);
    res.status(201).json({ data: pt });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH update patient
router.patch('/:id', auth, async (req, res) => {
  try {
    const pt = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pt) return res.status(404).json({ error: 'Patient not found' });
    res.json({ data: pt });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE patient
router.delete('/:id', auth, async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
