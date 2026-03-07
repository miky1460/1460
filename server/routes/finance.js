const express = require('express');
const router = express.Router();
const db = require('../database');
const { authorize } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const ALL_DEPT_ROLES = ['ceo', 'admin', 'finance', 'hr', 'ops_manager', 'office_manager'];
const VIEW_ALL_ROLES = ['ceo', 'admin', 'finance'];
const APPROVE_ROLES  = ['ceo', 'admin', 'finance'];

// Which department each role belongs to (for auto-tagging)
const ROLE_DEPT = {
  hr:             'HR',
  ops_manager:    'Operations',
  office_manager: 'Admin',
  finance:        'Finance',
};

// GET /api/finance — list entries
router.get('/', authorize(...ALL_DEPT_ROLES), (req, res) => {
  const { type, status, month, year, department } = req.query;
  const user = req.user;

  let q = `SELECT f.*, e.first_name || ' ' || e.last_name as created_by_name
           FROM finance_entries f
           LEFT JOIN employees e ON f.created_by=e.id
           WHERE 1=1`;
  const params = [];

  // Dept heads only see their own department
  if (!VIEW_ALL_ROLES.includes(user.role)) {
    const myDept = ROLE_DEPT[user.role];
    q += ' AND f.department=?'; params.push(myDept);
  }

  if (type)       { q += ' AND f.type=?';                               params.push(type); }
  if (status)     { q += ' AND f.status=?';                             params.push(status); }
  if (department && VIEW_ALL_ROLES.includes(user.role)) {
                    q += ' AND f.department=?';                          params.push(department); }
  if (month)      { q += ' AND strftime(\'%m\', f.date)=?';            params.push(String(month).padStart(2,'0')); }
  if (year)       { q += ' AND strftime(\'%Y\', f.date)=?';            params.push(year); }

  q += ' ORDER BY f.date DESC, f.created_at DESC LIMIT 500';
  res.json(db.prepare(q).all(...params));
});

// GET /api/finance/summary — monthly summary (CEO / Finance dashboard)
router.get('/summary', authorize(...VIEW_ALL_ROLES, 'hr', 'ops_manager', 'office_manager'), (req, res) => {
  const now = new Date();
  const ym  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const user = req.user;

  if (VIEW_ALL_ROLES.includes(user.role)) {
    // Full summary by type and by department
    const byType = db.prepare(`
      SELECT type, SUM(amount) as total, COUNT(*) as count
      FROM finance_entries WHERE strftime('%Y-%m', date)=?
      GROUP BY type
    `).all(ym);

    const byDept = db.prepare(`
      SELECT department, type, SUM(amount) as total, COUNT(*) as count
      FROM finance_entries WHERE strftime('%Y-%m', date)=? AND department != ''
      GROUP BY department, type ORDER BY department, type
    `).all(ym);

    const pending = db.prepare(`SELECT COUNT(*) as c FROM finance_entries WHERE status='pending'`).get();
    res.json({ rows: byType, byDept, pending: pending.c, month: ym });
  } else {
    // Dept head: only their dept
    const myDept = ROLE_DEPT[user.role];
    const rows = db.prepare(`
      SELECT type, SUM(amount) as total, COUNT(*) as count
      FROM finance_entries WHERE strftime('%Y-%m', date)=? AND department=?
      GROUP BY type
    `).all(ym, myDept);
    const pending = db.prepare(`SELECT COUNT(*) as c FROM finance_entries WHERE status='pending' AND department=?`).get(myDept);
    res.json({ rows, byDept:[], pending: pending.c, month: ym, dept: myDept });
  }
});

// POST /api/finance — create entry (any dept head creates for their dept)
router.post('/', authorize(...ALL_DEPT_ROLES), (req, res) => {
  const user = req.user;
  let { type, category, title, amount, date, department, status='pending', description='' } = req.body;

  if (!type || !category || !title || !amount || !date)
    return res.status(400).json({ error: 'type, category, title, amount, date required' });

  // Non-finance/admin: force their own department
  if (!VIEW_ALL_ROLES.includes(user.role)) {
    department = ROLE_DEPT[user.role] || '';
    status = 'pending'; // always pending — needs Finance approval
  }

  const empId = user.employee_id || '';
  const id = uuid();
  db.prepare(`INSERT INTO finance_entries (id, type, category, title, amount, date, department, status, description, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(id, type, category, title, amount, date, department||'', status, description, empId);
  res.status(201).json({ id });
});

// PUT /api/finance/:id — update entry
router.put('/:id', authorize(...ALL_DEPT_ROLES), (req, res) => {
  const user = req.user;
  const entry = db.prepare('SELECT * FROM finance_entries WHERE id=?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });

  // Dept heads can only edit their own dept's entries
  if (!VIEW_ALL_ROLES.includes(user.role) && entry.department !== ROLE_DEPT[user.role])
    return res.status(403).json({ error: 'Not authorized to edit this entry' });

  let { type, category, title, amount, date, department, status, description } = req.body;
  // Dept heads cannot change department or manually set status to paid/approved
  if (!VIEW_ALL_ROLES.includes(user.role)) {
    department = ROLE_DEPT[user.role];
    if (['paid','approved'].includes(status)) status = entry.status;
  }

  db.prepare(`UPDATE finance_entries SET type=?,category=?,title=?,amount=?,date=?,department=?,status=?,description=? WHERE id=?`)
    .run(type, category, title, amount, date, department||'', status, description||'', req.params.id);
  res.json({ message: 'Updated' });
});

// PUT /api/finance/:id/approve — Finance/CEO approves or rejects
router.put('/:id/approve', authorize(...APPROVE_ROLES), (req, res) => {
  const { status = 'approved' } = req.body;
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
