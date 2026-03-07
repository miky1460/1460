const express = require('express');
const router = express.Router();
const db = require('../database');
const { authorize } = require('../middleware/auth');
const { v4: uuid } = require('uuid');

const OPS_ROLES = ['ceo', 'admin', 'ops_manager', 'team_lead', 'agent'];
const MANAGE_OPS = ['ceo', 'admin', 'ops_manager'];

// GET /api/operations/reports — list reports
router.get('/reports', authorize(...OPS_ROLES), (req, res) => {
  const { date, type, employee_id } = req.query;
  const user = req.user;
  let query = `
    SELECT r.*, e.first_name || ' ' || e.last_name as employee_name,
           e.employee_id as emp_code, e.position, e.department
    FROM ops_reports r
    JOIN employees e ON r.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  // Agents see only their own; TLs see own + their agents
  if (user.role === 'agent') {
    query += ' AND r.employee_id = ?'; params.push(user.employee_id);
  } else if (user.role === 'team_lead') {
    query += ' AND (r.employee_id = ? OR r.report_type = \'agent\')'; params.push(user.employee_id);
  }

  if (date)        { query += ' AND r.report_date = ?';   params.push(date); }
  if (type)        { query += ' AND r.report_type = ?';   params.push(type); }
  if (employee_id) { query += ' AND r.employee_id = ?';   params.push(employee_id); }

  query += ' ORDER BY r.report_date DESC, r.created_at DESC LIMIT 200';
  res.json(db.prepare(query).all(...params));
});

// GET /api/operations/reports/today — today's summary
router.get('/reports/today', authorize(...MANAGE_OPS), (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const reports = db.prepare(`
    SELECT r.*, e.first_name || ' ' || e.last_name as employee_name, e.position
    FROM ops_reports r JOIN employees e ON r.employee_id = e.id
    WHERE r.report_date = ?
    ORDER BY r.report_type
  `).all(today);

  const totalCalls    = reports.filter(r=>r.report_type==='agent').reduce((s,r)=>s+r.calls_made,0);
  const totalLeads    = reports.filter(r=>r.report_type==='agent').reduce((s,r)=>s+r.leads_generated,0);
  const totalConv     = reports.filter(r=>r.report_type==='agent').reduce((s,r)=>s+r.conversions,0);
  const totalEntries  = reports.filter(r=>r.report_type==='agent').reduce((s,r)=>s+r.data_entries,0);
  res.json({ reports, summary: { totalCalls, totalLeads, totalConv, totalEntries, count: reports.length } });
});

// POST /api/operations/reports — submit report
router.post('/reports', authorize(...OPS_ROLES), (req, res) => {
  const user = req.user;
  const {
    report_date, report_type, project_name,
    calls_made=0, calls_answered=0, leads_generated=0, conversions=0,
    avg_call_duration=0, data_entries=0,
    team_size=0, team_target=0, team_achieved=0, team_issues='', notes=''
  } = req.body;

  if (!report_date || !report_type) return res.status(400).json({ error: 'Date and report type required' });

  // Agents can only submit agent reports
  if (user.role === 'agent' && report_type !== 'agent')
    return res.status(403).json({ error: 'Agents can only submit agent reports' });
  if (user.role === 'team_lead' && report_type !== 'team_lead')
    return res.status(403).json({ error: 'Team leads can only submit team lead reports' });

  const empId = user.employee_id;
  if (!empId) return res.status(400).json({ error: 'No employee record linked to your account' });

  // Check duplicate
  const existing = db.prepare('SELECT id FROM ops_reports WHERE employee_id=? AND report_date=?').get(empId, report_date);
  if (existing) return res.status(400).json({ error: 'Report already submitted for this date' });

  const id = uuid();
  db.prepare(`
    INSERT INTO ops_reports (id, employee_id, report_date, report_type, project_name,
      calls_made, calls_answered, leads_generated, conversions, avg_call_duration,
      data_entries, team_size, team_target, team_achieved, team_issues, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
  `).run(id, empId, report_date, report_type, project_name||'',
    calls_made, calls_answered, leads_generated, conversions, avg_call_duration,
    data_entries, team_size, team_target, team_achieved, team_issues, notes);

  res.status(201).json({ id, message: 'Report submitted successfully' });
});

// PUT /api/operations/reports/:id/review — mark as reviewed
router.put('/reports/:id/review', authorize(...MANAGE_OPS), (req, res) => {
  const result = db.prepare(
    'UPDATE ops_reports SET status=\'reviewed\', reviewed_by=? WHERE id=?'
  ).run(req.user.name, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Report not found' });
  res.json({ message: 'Marked as reviewed' });
});

// GET /api/operations/projects — list projects
router.get('/projects', authorize(...OPS_ROLES, 'finance'), (req, res) => {
  res.json(db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all());
});

// POST /api/operations/projects — create project
router.post('/projects', authorize(...MANAGE_OPS), (req, res) => {
  const { name, client, type='outbound', status='active', start_date, end_date, daily_target=0, description='' } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const id = uuid();
  db.prepare(`INSERT INTO projects (id, name, client, type, status, start_date, end_date, daily_target, description) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, name, client||'', type, status, start_date||'', end_date||'', daily_target, description);
  res.status(201).json({ id });
});

// PUT /api/operations/projects/:id — update project
router.put('/projects/:id', authorize(...MANAGE_OPS), (req, res) => {
  const { name, client, type, status, start_date, end_date, daily_target, description } = req.body;
  db.prepare(`UPDATE projects SET name=?,client=?,type=?,status=?,start_date=?,end_date=?,daily_target=?,description=? WHERE id=?`)
    .run(name, client, type, status, start_date, end_date, daily_target, description, req.params.id);
  res.json({ message: 'Updated' });
});

// GET /api/operations/team — team structure
router.get('/team', authorize(...MANAGE_OPS, 'team_lead'), (req, res) => {
  const ops = db.prepare(`SELECT e.*, u.role FROM employees e LEFT JOIN users u ON u.employee_id=e.id WHERE e.department='Operations' AND e.status='active'`).all();
  res.json(ops);
});

module.exports = router;
