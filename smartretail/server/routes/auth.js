// routes/auth.js
const r   = require('express').Router();
const jwt = require('jsonwebtoken');

const USERS = [
  { id:'U1', name:'Store Manager',  email:'manager@store.io',  password:'retail123', role:'manager'  },
  { id:'U2', name:'Analytics Team', email:'analyst@store.io',  password:'retail123', role:'analyst'  },
  { id:'U3', name:'Security Guard', email:'security@store.io', password:'retail123', role:'security' },
];

r.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'sr_secret', { expiresIn: '7d' });
  res.json({ token, user: { id:user.id, name:user.name, email:user.email, role:user.role } });
});

r.get('/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sr_secret');
    res.json({ user: decoded });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
});

module.exports = r;
