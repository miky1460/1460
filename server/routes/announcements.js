const express = require('express');
const router = express.Router();
const db = require('../database');
const { authorize } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const ALL_ROLES = ['ceo', 'admin', 'hr', 'ops_manager', 'team_lead', 'agent', 'office_manager', 'finance', 'employee'];
const POST_ROLES = ['ceo', 'admin', 'hr', 'ops_manager', 'finance', 'office_manager'];

// Audience filter based on role
function audienceFilter(role) {
  if (['ceo', 'admin'].includes(role)) return null; // sees all
  if (role === 'hr')           return ['all', 'hr', 'management'];
  if (role === 'ops_manager')  return ['all', 'ops', 'management'];
  if (role === 'team_lead')    return ['all', 'ops'];
  if (role === 'agent')        return ['all', 'ops'];
  if (role === 'finance')      return ['all', 'finance', 'management'];
  if (role === 'office_manager') return ['all', 'management'];
  return ['all'];
}

// GET /api/announcements
router.get('/', authorize(...ALL_ROLES), (req, res) => {
  const user = req.user;
  const audiences = audienceFilter(user.role);
  let q = `
    SELECT a.*, e.first_name || ' ' || e.last_name as author_name, e.position as author_position
    FROM announcements a
    LEFT JOIN employees e ON a.created_by = e.id
    WHERE 1=1
  `;
  const params = [];
  if (audiences) {
    q += ` AND a.audience IN (${audiences.map(()=>'?').join(',')})`;
    params.push(...audiences);
  }
  q += ' ORDER BY a.created_at DESC LIMIT 100';
  res.json(db.prepare(q).all(...params));
});

// POST /api/announcements
router.post('/', authorize(...POST_ROLES), (req, res) => {
  const { title, content, category='general', audience='all', priority='normal', expires_at } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  // Only CEO/admin can post management-only audience
  if (audience === 'management' && !['ceo','admin'].includes(req.user.role))
    return res.status(403).json({ error: 'Only management can post management-only announcements' });

  const empId = req.user.employee_id;
  if (!empId) return res.status(400).json({ error: 'No employee record linked' });
  const id = uuid();
  db.prepare(`INSERT INTO announcements (id, title, content, category, audience, priority, created_by, expires_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, title, content, category, audience, priority, empId, expires_at||null);
  res.status(201).json({ id });
});

// PUT /api/announcements/:id
router.put('/:id', authorize(...POST_ROLES), (req, res) => {
  const { title, content, category, audience, priority, expires_at } = req.body;
  db.prepare(`UPDATE announcements SET title=?,content=?,category=?,audience=?,priority=?,expires_at=? WHERE id=?`)
    .run(title, content, category, audience, priority, expires_at||null, req.params.id);
  res.json({ message: 'Updated' });
});

// DELETE /api/announcements/:id
router.delete('/:id', authorize('ceo', 'admin', 'hr'), (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
