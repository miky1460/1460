const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate, authorize, JWT_SECRET } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, employee_id: user.employee_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, employee_id: user.employee_id }
  });
});

// GET /api/auth/me - get current user info
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, employee_id, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// GET /api/auth/users - Admin only: list all users
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, employee_id, created_at FROM users ORDER BY role, name').all();
  res.json(users);
});

// POST /api/auth/users - Admin only: create user
router.post('/users', authenticate, authorize('admin'), (req, res) => {
  const { name, email, password, role, employee_id } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
  if (!['admin', 'hr', 'employee'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, name, email, password, role, employee_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, email.toLowerCase().trim(), hashed, role, employee_id || null);

  res.status(201).json({ id, message: 'User created successfully' });
});

// PUT /api/auth/users/:id - Admin only: update user
router.put('/users/:id', authenticate, authorize('admin'), (req, res) => {
  const { name, email, password, role, employee_id } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hashed = password ? bcrypt.hashSync(password, 10) : user.password;
  db.prepare('UPDATE users SET name=?, email=?, password=?, role=?, employee_id=? WHERE id=?')
    .run(name || user.name, email || user.email, hashed, role || user.role, employee_id !== undefined ? employee_id : user.employee_id, req.params.id);

  res.json({ message: 'User updated successfully' });
});

// DELETE /api/auth/users/:id - Admin only
router.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

// PUT /api/auth/change-password - any logged-in user
router.put('/change-password', authenticate, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(current_password, user.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(new_password, 10), req.user.id);
  res.json({ message: 'Password changed successfully' });
});

module.exports = router;
