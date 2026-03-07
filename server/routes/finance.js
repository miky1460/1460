const express = require('express');
const router = express.Router();
const db = require('../database');
const { authorize } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const FIN_ROLES = ['ceo', 'admin', 'finance'];
const VIEW_ROLES = ['ceo', 'admin', 'finance', 'hr'];

// GET /api/finance — list entries
router.get('/', authorize(...VIEW_ROLES), (req, res) => {
  const { type, status, month, year } = req.query;
  let q = 'SELECT f.*, e.first_name || \' \' || e.last_name as created_by_name FROM finance_entries f LEFT JOIN employees e ON f.created_by=e.id WHERE 1=1';
  const params = [];
  if (type)   { q += ' AND f.type=?';   params.push(type); }
  if (status) { q += ' AND f.status=?'; params.push(status); }
  if (month)  { q += ' AND strftime(\'%m\', f.date)=?'; params.push(String(month).padStart(2,'0')); }
  if (year)   { q += ' AND strftime(\'%Y\', f.date)=?'; params.push(year); }
  q += ' ORDER BY f.date DESC, f.created_at DESC LIMIT 500';
  res.json(db.prepare(q).all(...params));
});

// GET /api/finance/summary — monthly summary for CEO dashboard
router.get('/summary', authorize('ceo', 'admin', 'finance'), (req, res) => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const rows = db.prepare(`
    SELECT type, SUM(amount) as total, COUNT(*) as count
    FROM finance_entries
    WHERE strftime('%Y-%m', date) = ?
    GROUP BY type
  `).all(ym);
  const pending = db.prepare(`SELECT COUNT(*) as c FROM finance_entries WHERE status='pending'`).get();
  res.json({ rows, pending: pending.c, month: ym });
});

// POST /api/finance — create entry
router.post('/', authorize(...FIN_ROLES), (req, res) => {
  const { type, category, title, amount, date, department='', status='pending', description='' } = req.body;
  if (!type || !category || !title || !amount || !date)
    return res.status(400).json({ error: 'type, category, title, amount, date required' });
  const id = uuid();
  const empId = req.user.employee_id || '';
  db.prepare(`INSERT INTO finance_entries (id, type, category, title, amount, date, department, status, description, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, type, category, title, amount, date, department, status, description, empId);
  res.status(201).json({ id });
});

// PUT /api/finance/:id — update entry
router.put('/:id', authorize(...FIN_ROLES), (req, res) => {
  const { type, category, title, amount, date, department, status, description } = req.body;
  db.prepare(`UPDATE finance_entries SET type=?,category=?,title=?,amount=?,date=?,department=?,status=?,description=? WHERE id=?`)
    .run(type, category, title, amount, date, department||'', status, description||'', req.params.id);
  res.json({ message: 'Updated' });
});

// PUT /api/finance/:id/approve — approve
router.put('/:id/approve', authorize('ceo', 'admin'), (req, res) => {
  const { status='approved' } = req.body;
  db.prepare(`UPDATE finance_entries SET status=?, approved_by=? WHERE id=?`)
    .run(status, req.user.name, req.params.id);
  res.json({ message: `Entry ${status}` });
});

// DELETE /api/finance/:id
router.delete('/:id', authorize('ceo', 'admin', 'finance'), (req, res) => {
  db.prepare('DELETE FROM finance_entries WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
