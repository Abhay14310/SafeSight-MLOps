// routes/labReports.js
const router     = require('express').Router();
const multer     = require('multer');
const path       = require('path');
const { LabReport } = require('../models/index');
const auth       = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random()*1e6)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.dicom'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Invalid file type'));
  },
});

// GET all lab reports for a patient
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { patientId: req.params.patientId };
    if (type)   filter.type   = type;
    if (status) filter.status = status;
    const reports = await LabReport.find(filter).sort({ reportedAt: -1 });
    res.json({ data: reports, count: reports.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single report
router.get('/report/:id', auth, async (req, res) => {
  try {
    const r = await LabReport.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Report not found' });
    res.json({ data: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create lab report with optional file
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.fileUrl  = `/uploads/${req.file.filename}`;
      body.fileName = req.file.originalname;
      body.fileSize = req.file.size;
      body.mimeType = req.file.mimetype;
    }
    if (typeof body.values === 'string') body.values = JSON.parse(body.values);
    const report = await LabReport.create(body);
    res.status(201).json({ data: report });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH update report
router.patch('/:id', auth, async (req, res) => {
  try {
    const r = await LabReport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!r) return res.status(404).json({ error: 'Report not found' });
    res.json({ data: r });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE report
router.delete('/:id', auth, async (req, res) => {
  try {
    await LabReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
