// routes/auth.js
const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const { MedicalUser: User }  = require('../models/index');
const auth    = require('../middleware/auth');

const signToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET || 'fallback_secret',
  { expiresIn: '7d' }
);

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, ward: user.ward },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const user  = await User.create(req.body);
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /me
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
