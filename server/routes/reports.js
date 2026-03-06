const express = require('express');
const router = express.Router();
const db = require('../database');

// GET dashboard stats
router.get('/dashboard', (req, res) => {
  const totalEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status='active'").get().count;
  const totalDepts = db.prepare("SELECT COUNT(DISTINCT department) as count FROM employees WHERE status='active'").get().count;

  const today = new Date().toISOString().split('T')[0];
  const presentToday = db.prepare("SELECT COUNT(*) as count FROM attendance WHERE date=? AND status='present'").get(today).count;
  const onLeaveToday = db.prepare("SELECT COUNT(*) as count FROM leaves WHERE status='approved' AND start_date<=? AND end_date>=?").get(today, today).count;

  const pendingLeaves = db.prepare("SELECT COUNT(*) as count FROM leaves WHERE status='pending'").get().count;

  const m = String(new Date().getMonth() + 1).padStart(2, '0');
  const y = String(new Date().getFullYear());
  const monthName = new Date().toLocaleString('default', { month: 'long' });
  const totalPayroll = db.prepare("SELECT COALESCE(SUM(net_salary),0) as total FROM payroll WHERE month=? AND year=?").get(monthName, parseInt(y)).total;
  const pendingPayroll = db.prepare("SELECT COUNT(*) as count FROM payroll WHERE month=? AND year=? AND status='pending'").get(monthName, parseInt(y)).count;

  const deptBreakdown = db.prepare("SELECT department, COUNT(*) as count FROM employees WHERE status='active' GROUP BY department ORDER BY count DESC").all();

  const recentLeaves = db.prepare(`
    SELECT l.*, e.first_name, e.last_name FROM leaves l JOIN employees e ON l.employee_id=e.id
    ORDER BY l.created_at DESC LIMIT 5
  `).all();

  res.json({
    totalEmployees, totalDepts, presentToday, onLeaveToday,
    pendingLeaves, totalPayroll, pendingPayroll, deptBreakdown, recentLeaves
  });
});

// GET daily attendance report
router.get('/attendance/daily', (req, res) => {
  const { date } = req.query;
  const d = date || new Date().toISOString().split('T')[0];

  const records = db.prepare(`
    SELECT e.employee_id as emp_code, e.first_name, e.last_name, e.department,
      COALESCE(a.check_in, '-') as check_in, COALESCE(a.check_out, '-') as check_out,
      COALESCE(a.hours_worked, 0) as hours_worked, COALESCE(a.status, 'absent') as status
    FROM employees e
    LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ?
    WHERE e.status = 'active' ORDER BY e.department, e.first_name
  `).all(d);

  const summary = {
    date: d,
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    half_day: records.filter(r => r.status === 'half_day').length,
    records
  };
  res.json(summary);
});

// GET weekly attendance report
router.get('/attendance/weekly', (req, res) => {
  const { start_date } = req.query;
  const start = start_date ? new Date(start_date) : (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d;
  })();
  const end = new Date(start); end.setDate(end.getDate() + 6);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT e.first_name, e.last_name, e.employee_id as emp_code, e.department,
      COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
      ROUND(SUM(COALESCE(a.hours_worked,0)),1) as total_hours
    FROM employees e
    LEFT JOIN attendance a ON e.id=a.employee_id AND a.date BETWEEN ? AND ?
    WHERE e.status='active' GROUP BY e.id ORDER BY e.department, e.first_name
  `).all(startStr, endStr);

  res.json({ week_start: startStr, week_end: endStr, employees: rows });
});

// GET monthly report
router.get('/attendance/monthly', (req, res) => {
  const { month, year } = req.query;
  const m = (month || String(new Date().getMonth() + 1)).padStart(2, '0');
  const y = year || String(new Date().getFullYear());

  const rows = db.prepare(`
    SELECT e.first_name, e.last_name, e.employee_id as emp_code, e.department,
      COUNT(CASE WHEN a.status='present' THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status='absent' THEN 1 END) as absent_days,
      COUNT(CASE WHEN a.status='half_day' THEN 1 END) as half_days,
      ROUND(SUM(COALESCE(a.hours_worked,0)),1) as total_hours,
      ROUND(AVG(CASE WHEN a.hours_worked>0 THEN a.hours_worked END),1) as avg_hours
    FROM employees e
    LEFT JOIN attendance a ON e.id=a.employee_id
      AND strftime('%m',a.date)=? AND strftime('%Y',a.date)=?
    WHERE e.status='active' GROUP BY e.id ORDER BY e.department, e.first_name
  `).all(m, y);

  res.json({ month: m, year: y, employees: rows });
});

// GET payroll report
router.get('/payroll', (req, res) => {
  const { month, year } = req.query;
  const monthName = month || new Date().toLocaleString('default', { month: 'long' });
  const y = parseInt(year || new Date().getFullYear());

  const rows = db.prepare(`
    SELECT e.employee_id as emp_code, e.first_name, e.last_name, e.department, e.position,
      p.basic_salary, p.bonus, p.deductions, p.net_salary, p.status, p.paid_date
    FROM payroll p JOIN employees e ON p.employee_id=e.id
    WHERE p.month=? AND p.year=? ORDER BY e.department, e.first_name
  `).all(monthName, y);

  const totals = rows.reduce((acc, r) => ({
    basic: acc.basic + r.basic_salary,
    bonus: acc.bonus + r.bonus,
    deductions: acc.deductions + r.deductions,
    net: acc.net + r.net_salary
  }), { basic: 0, bonus: 0, deductions: 0, net: 0 });

  res.json({ month: monthName, year: y, employees: rows, totals });
});

module.exports = router;
