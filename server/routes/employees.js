const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// GET all employees
router.get('/', (req, res) => {
  const { search, department, status } = req.query;
  let query = 'SELECT * FROM employees WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR employee_id LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (department) { query += ' AND department = ?'; params.push(department); }
  if (status) { query += ' AND status = ?'; params.push(status); }

  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// GET single employee
router.get('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

// POST create employee
router.post('/', (req, res) => {
  const { employee_id, first_name, last_name, email, phone, department, position, salary, join_date } = req.body;
  if (!employee_id || !first_name || !last_name || !email || !department || !position || !salary || !join_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, department, position, salary, join_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, employee_id, first_name, last_name, email, phone || null, department, position, salary, join_date);
    res.status(201).json({ id, message: 'Employee created successfully' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Employee ID or email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update employee
router.put('/:id', (req, res) => {
  const { first_name, last_name, email, phone, department, position, salary, join_date, status } = req.body;
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  try {
    db.prepare(`
      UPDATE employees SET first_name=?, last_name=?, email=?, phone=?, department=?, position=?, salary=?, join_date=?, status=?
      WHERE id=?
    `).run(
      first_name || emp.first_name, last_name || emp.last_name,
      email || emp.email, phone !== undefined ? phone : emp.phone,
      department || emp.department, position || emp.position,
      salary || emp.salary, join_date || emp.join_date,
      status || emp.status, req.params.id
    );
    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE employee
router.delete('/:id', (req, res) => {
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  db.prepare('UPDATE employees SET status = ? WHERE id = ?').run('inactive', req.params.id);
  res.json({ message: 'Employee deactivated successfully' });
});

// GET departments list
router.get('/meta/departments', (req, res) => {
  const depts = db.prepare('SELECT DISTINCT department FROM employees ORDER BY department').all();
  res.json(depts.map(d => d.department));
});

module.exports = router;
