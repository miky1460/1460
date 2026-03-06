const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authorize } = require('../middleware/auth');

router.get('/', (req, res) => {
  const user = req.user;
  const { employee_id, month, year, status } = req.query;
  let query = `SELECT p.*, e.first_name, e.last_name, e.employee_id as emp_code, e.department, e.position
    FROM payroll p JOIN employees e ON p.employee_id = e.id WHERE 1=1`;
  const params = [];
  if (user.role === 'employee') {
    if (!user.employee_id) return res.json([]);
    query += ' AND p.employee_id = ?'; params.push(user.employee_id);
  } else if (employee_id) {
    query += ' AND p.employee_id = ?'; params.push(employee_id);
  }
  if (month)  { query += ' AND p.month = ?'; params.push(month); }
  if (year)   { query += ' AND p.year = ?'; params.push(year); }
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  query += ' ORDER BY p.year DESC, p.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/generate', authorize('admin'), (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ error: 'month and year required' });
  const employees = db.prepare("SELECT * FROM employees WHERE status = 'active'").all();
  const insertPay = db.prepare('INSERT OR IGNORE INTO payroll (id, employee_id, month, year, basic_salary, bonus, deductions, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  let count = 0;
  employees.forEach(emp => {
    const bonus = Math.round(emp.salary * 0.05);
    const deductions = Math.round(emp.salary * 0.1);
    const result = insertPay.run(uuidv4(), emp.id, month, year, emp.salary, bonus, deductions, emp.salary+bonus-deductions, 'pending');
    if (result.changes) count++;
  });
  res.status(201).json({ message: `Payroll generated for ${count} employee(s)`, total: employees.length });
});

router.post('/', authorize('admin'), (req, res) => {
  const { employee_id, month, year, basic_salary, bonus, deductions } = req.body;
  if (!employee_id || !month || !year || !basic_salary) return res.status(400).json({ error: 'Missing required fields' });
  const net = basic_salary + (bonus||0) - (deductions||0);
  const existing = db.prepare('SELECT * FROM payroll WHERE employee_id=? AND month=? AND year=?').get(employee_id, month, year);
  if (existing) {
    db.prepare('UPDATE payroll SET basic_salary=?, bonus=?, deductions=?, net_salary=? WHERE id=?')
      .run(basic_salary, bonus||0, deductions||0, net, existing.id);
    return res.json({ id: existing.id, message: 'Payroll updated' });
  }
  const id = uuidv4();
  db.prepare('INSERT INTO payroll (id, employee_id, month, year, basic_salary, bonus, deductions, net_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, employee_id, month, year, basic_salary, bonus||0, deductions||0, net);
  res.status(201).json({ id, message: 'Payroll created' });
});

router.put('/:id/pay', authorize('admin'), (req, res) => {
  const rec = db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Payroll record not found' });
  const paid_date = new Date().toISOString().split('T')[0];
  db.prepare("UPDATE payroll SET status = 'paid', paid_date = ? WHERE id = ?").run(paid_date, rec.id);
  res.json({ message: 'Marked as paid', paid_date });
});

router.put('/:id', authorize('admin'), (req, res) => {
  const { basic_salary, bonus, deductions, status } = req.body;
  const rec = db.prepare('SELECT * FROM payroll WHERE id = ?').get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Payroll record not found' });
  const bs=basic_salary||rec.basic_salary, bo=bonus!==undefined?bonus:rec.bonus, de=deductions!==undefined?deductions:rec.deductions;
  db.prepare('UPDATE payroll SET basic_salary=?, bonus=?, deductions=?, net_salary=?, status=? WHERE id=?')
    .run(bs, bo, de, bs+bo-de, status||rec.status, req.params.id);
  res.json({ message: 'Payroll updated' });
});

module.exports = router;
