const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  const user = req.user;
  const { employee_id, status, month, year } = req.query;
  let query = `SELECT l.*, e.first_name, e.last_name, e.employee_id as emp_code, e.department
    FROM leaves l JOIN employees e ON l.employee_id = e.id WHERE 1=1`;
  const params = [];
  if (user.role === 'employee') {
    if (!user.employee_id) return res.json([]);
    query += ' AND l.employee_id = ?'; params.push(user.employee_id);
  } else if (employee_id) {
    query += ' AND l.employee_id = ?'; params.push(employee_id);
  }
  if (status) { query += ' AND l.status = ?'; params.push(status); }
  if (month)  { query += ' AND strftime("%m", l.start_date) = ?'; params.push(month.padStart(2,'0')); }
  if (year)   { query += ' AND strftime("%Y", l.start_date) = ?'; params.push(year); }
  query += ' ORDER BY l.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const user = req.user;
  let { employee_id, leave_type, start_date, end_date, reason } = req.body;
  if (user.role === 'employee') employee_id = user.employee_id;
  if (!employee_id || !leave_type || !start_date || !end_date)
    return res.status(400).json({ error: 'Missing required fields' });
  const start = new Date(start_date), end = new Date(end_date);
  if (end < start) return res.status(400).json({ error: 'End date must be after start date' });
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) { if (cur.getDay()!==0&&cur.getDay()!==6) days++; cur.setDate(cur.getDate()+1); }
  const id = uuidv4();
  db.prepare('INSERT INTO leaves (id, employee_id, leave_type, start_date, end_date, days, reason) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, employee_id, leave_type, start_date, end_date, days, reason || null);
  res.status(201).json({ id, days, message: 'Leave request submitted' });
});

router.put('/:id', authorize('admin', 'hr'), (req, res) => {
  const { status, approved_by } = req.body;
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if (!['approved','rejected','pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE leaves SET status = ?, approved_by = ? WHERE id = ?')
    .run(status, approved_by || req.user.name, req.params.id);
  res.json({ message: `Leave ${status} successfully` });
});

router.delete('/:id', (req, res) => {
  const leave = db.prepare('SELECT * FROM leaves WHERE id = ?').get(req.params.id);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if (req.user.role === 'employee' && leave.employee_id !== req.user.employee_id)
    return res.status(403).json({ error: 'Access denied' });
  if (leave.status !== 'pending') return res.status(400).json({ error: 'Can only delete pending requests' });
  db.prepare('DELETE FROM leaves WHERE id = ?').run(req.params.id);
  res.json({ message: 'Leave request deleted' });
});

router.get('/balance/:employee_id', (req, res) => {
  if (req.user.role === 'employee' && req.user.employee_id !== req.params.employee_id)
    return res.status(403).json({ error: 'Access denied' });
  const year = new Date().getFullYear();
  const rows = db.prepare(`SELECT leave_type, SUM(days) as used_days FROM leaves
    WHERE employee_id = ? AND status = 'approved' AND strftime('%Y', start_date) = ? GROUP BY leave_type`)
    .all(req.params.employee_id, String(year));
  const allowances = { annual:20, sick:10, personal:5, maternity:90, paternity:10 };
  const balance = {};
  Object.entries(allowances).forEach(([type, allowed]) => {
    const used = rows.find(r => r.leave_type === type)?.used_days || 0;
    balance[type] = { allowed, used, remaining: allowed - used };
  });
  res.json(balance);
});

module.exports = router;
