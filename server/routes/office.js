const express = require('express');
const router = express.Router();
const db = require('../database');
const { authorize } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const ALL_ROLES = ['ceo', 'admin', 'hr', 'ops_manager', 'team_lead', 'agent', 'office_manager', 'finance', 'employee'];
const MANAGE_ROLES = ['ceo', 'admin', 'office_manager'];
const APPROVE_ROLES = ['ceo', 'admin'];

// GET /api/office/requests
router.get('/requests', authorize(...ALL_ROLES), (req, res) => {
  const { status, category } = req.query;
  const user = req.user;
  let q = `
    SELECT r.*, e.first_name || ' ' || e.last_name as requester_name
    FROM office_requests r
    JOIN employees e ON r.requested_by = e.id
    WHERE 1=1
  `;
  const params = [];
  // Non-managers see only their own requests
  if (!MANAGE_ROLES.includes(user.role) && user.role !== 'ceo') {
    q += ' AND r.requested_by=?'; params.push(user.employee_id);
  }
  if (status)   { q += ' AND r.status=?';   params.push(status); }
  if (category) { q += ' AND r.category=?'; params.push(category); }
  q += ' ORDER BY r.created_at DESC';
  res.json(db.prepare(q).all(...params));
});

// POST /api/office/requests
router.post('/requests', authorize(...MANAGE_ROLES, 'ceo', 'admin'), (req, res) => {
  const { category, title, description='', priority='normal' } = req.body;
  if (!category || !title) return res.status(400).json({ error: 'Category and title required' });
  const empId = req.user.employee_id;
  if (!empId) return res.status(400).json({ error: 'No employee record linked' });
  const id = uuid();
  db.prepare(`INSERT INTO office_requests (id, requested_by, category, title, description, priority) VALUES (?,?,?,?,?,?)`)
    .run(id, empId, category, title, description, priority);
  res.status(201).json({ id });
});

// PUT /api/office/requests/:id — update status
router.put('/requests/:id', authorize(...APPROVE_ROLES, 'office_manager'), (req, res) => {
  const { status, notes='' } = req.body;
  const approved_at = ['approved','rejected','fulfilled'].includes(status) ? new Date().toISOString() : null;
  db.prepare(`UPDATE office_requests SET status=?, approved_by=?, approved_at=?, notes=? WHERE id=?`)
    .run(status, req.user.name, approved_at, notes, req.params.id);
  res.json({ message: 'Updated' });
});

// DELETE /api/office/requests/:id
router.delete('/requests/:id', authorize(...APPROVE_ROLES), (req, res) => {
  db.prepare('DELETE FROM office_requests WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
