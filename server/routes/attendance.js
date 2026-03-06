const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  const user = req.user;
  const { employee_id, date, month, year } = req.query;
  let query = `SELECT a.*, e.first_name, e.last_name, e.employee_id as emp_code, e.department
    FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
  const params = [];
  if (user.role === 'employee') {
    if (!user.employee_id) return res.json([]);
    query += ' AND a.employee_id = ?'; params.push(user.employee_id);
  } else if (employee_id) {
    query += ' AND a.employee_id = ?'; params.push(employee_id);
  }
  if (date)  { query += ' AND a.date = ?'; params.push(date); }
  if (month) { query += ' AND strftime("%m", a.date) = ?'; params.push(month.padStart(2,'0')); }
  if (year)  { query += ' AND strftime("%Y", a.date) = ?'; params.push(year); }
  query += ' ORDER BY a.date DESC, e.first_name';
  res.json(db.prepare(query).all(...params));
});

router.post('/', authorize('admin', 'hr'), (req, res) => {
  const { employee_id, date, check_in, check_out, status } = req.body;
  if (!employee_id || !date) return res.status(400).json({ error: 'employee_id and date required' });
  const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employee_id, date);
  let hours_worked = 0;
  if (check_in && check_out) {
    const [h1,m1] = check_in.split(':').map(Number);
    const [h2,m2] = check_out.split(':').map(Number);
    hours_worked = Math.max(0, (h2*60+m2-h1*60-m1)/60);
  }
  if (existing) {
    db.prepare('UPDATE attendance SET check_in=?, check_out=?, hours_worked=?, status=? WHERE id=?')
      .run(check_in||existing.check_in, check_out||existing.check_out, hours_worked||existing.hours_worked, status||existing.status, existing.id);
    return res.json({ message: 'Attendance updated' });
  }
  const id = uuidv4();
  db.prepare('INSERT INTO attendance (id, employee_id, date, check_in, check_out, hours_worked, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, employee_id, date, check_in||null, check_out||null, hours_worked, status||'present');
  res.status(201).json({ id, message: 'Attendance marked' });
});

router.put('/:id', authorize('admin', 'hr'), (req, res) => {
  const { check_in, check_out, status } = req.body;
  const rec = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  const ci = check_in||rec.check_in, co = check_out||rec.check_out;
  let hours_worked = rec.hours_worked;
  if (ci && co) {
    const [h1,m1]=ci.split(':').map(Number), [h2,m2]=co.split(':').map(Number);
    hours_worked = Math.max(0,(h2*60+m2-h1*60-m1)/60);
  }
  db.prepare('UPDATE attendance SET check_in=?, check_out=?, hours_worked=?, status=? WHERE id=?')
    .run(ci, co, hours_worked, status||rec.status, req.params.id);
  res.json({ message: 'Attendance updated' });
});

router.get('/summary', authorize('admin', 'hr'), (req, res) => {
  const { month, year } = req.query;
  const m = (month||String(new Date().getMonth()+1)).padStart(2,'0');
  const y = year||String(new Date().getFullYear());
  const rows = db.prepare(`
    SELECT e.id, e.first_name, e.last_name, e.employee_id as emp_code, e.department,
      COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
      COUNT(CASE WHEN a.status='half_day' THEN 1 END) as half_days,
      ROUND(SUM(CASE WHEN a.hours_worked>0 THEN a.hours_worked ELSE 0 END),1) as total_hours
    FROM employees e LEFT JOIN attendance a ON e.id=a.employee_id
      AND strftime('%m',a.date)=? AND strftime('%Y',a.date)=?
    WHERE e.status='active' GROUP BY e.id ORDER BY e.first_name
  `).all(m, y);
  res.json(rows);
});

module.exports = router;
