// routes/patients.js
const r = require('express').Router();
const { Patient } = require('../models/index');

// GET all active patients
r.get('/', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : { status: { $ne: 'discharged' } };
    const patients = await Patient.find(filter).sort({ bedId: 1 });
    res.json({ data: patients });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET single patient
r.get('/:id', async (req, res) => {
  try {
    const p = await Patient.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ data: p });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create patient
r.post('/', async (req, res) => {
  try {
    const p = await Patient.create(req.body);
    res.status(201).json({ data: p });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PATCH update patient
r.patch('/:id', async (req, res) => {
  try {
    const p = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ data: p });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE (soft: set discharged)
r.delete('/:id', async (req, res) => {
  try {
    const p = await Patient.findByIdAndUpdate(req.params.id, { status: 'discharged' }, { new: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ data: p, message: 'Patient discharged' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = r;
