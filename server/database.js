const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'hr.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    salary REAL NOT NULL,
    join_date TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    employee_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS leaves (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    leave_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    hours_worked REAL DEFAULT 0,
    status TEXT DEFAULT 'present',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, date)
  );

  CREATE TABLE IF NOT EXISTS payroll (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    basic_salary REAL NOT NULL,
    bonus REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    net_salary REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, month, year)
  );
`);

// Seed employees
const empCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
if (empCount.count === 0) {
  const insertEmp = db.prepare(`
    INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, department, position, salary, join_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const employees = [
    ['emp-001', 'EMP001', 'Alice', 'Johnson', 'alice@kandz.io', '555-0101', 'Development', 'Senior Developer', 95000, '2022-01-15', 'active'],
    ['emp-002', 'EMP002', 'Bob', 'Smith', 'bob@kandz.io', '555-0102', 'Development', 'Developer', 75000, '2022-06-01', 'active'],
    ['emp-003', 'EMP003', 'Carol', 'Williams', 'carol@kandz.io', '555-0103', 'HR', 'HR Manager', 80000, '2021-03-10', 'active'],
    ['emp-004', 'EMP004', 'David', 'Brown', 'david@kandz.io', '555-0104', 'Finance', 'Financial Analyst', 70000, '2023-02-20', 'active'],
    ['emp-005', 'EMP005', 'Eve', 'Davis', 'eve@kandz.io', '555-0105', 'Social Media', 'Social Media Manager', 85000, '2021-11-05', 'active'],
  ];
  employees.forEach(emp => insertEmp.run(...emp));

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const insertAtt = db.prepare(`
    INSERT OR IGNORE INTO attendance (id, employee_id, date, check_in, check_out, hours_worked, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  employees.forEach(([empId]) => {
    for (let day = 1; day <= today.getDate(); day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const dateStr = date.toISOString().split('T')[0];
        const s = Math.random() > 0.1 ? 'present' : 'absent';
        insertAtt.run(`att-${empId}-${dateStr}`, empId, dateStr,
          s === 'present' ? '09:00' : null, s === 'present' ? '17:30' : null,
          s === 'present' ? 8.5 : 0, s);
      }
    }
  });

  const insertPay = db.prepare(`
    INSERT OR IGNORE INTO payroll (id, employee_id, month, year, basic_salary, bonus, deductions, net_salary, status, paid_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  employees.forEach(([empId, , , , , , , , salary]) => {
    for (let m = 1; m <= 3; m++) {
      const d = new Date(year, month - m, 1);
      const mon = d.toLocaleString('default', { month: 'long' });
      const yr = d.getFullYear();
      const bonus = Math.round(salary * 0.05);
      const deductions = Math.round(salary * 0.1);
      insertPay.run(`pay-${empId}-${mon}-${yr}`, empId, mon, yr, salary, bonus, deductions,
        salary + bonus - deductions, 'paid', `${yr}-${String(d.getMonth() + 1).padStart(2, '0')}-28`);
    }
  });
}

// Seed users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare(`INSERT INTO users (id, name, email, password, role, employee_id) VALUES (?, ?, ?, ?, ?, ?)`);
  const h = (pw) => bcrypt.hashSync(pw, 10);
  insertUser.run('user-admin',  'Admin',         'admin@kandz.io', h('Admin@123'),  'admin',    null);
  insertUser.run('user-hr',     'Carol Williams', 'carol@kandz.io', h('HR@1234'),   'hr',       'emp-003');
  insertUser.run('user-emp001', 'Alice Johnson',  'alice@kandz.io', h('Alice@123'), 'employee', 'emp-001');
  insertUser.run('user-emp002', 'Bob Smith',      'bob@kandz.io',   h('Bob@1234'),  'employee', 'emp-002');
  insertUser.run('user-emp004', 'David Brown',    'david@kandz.io', h('David@123'), 'employee', 'emp-004');
  insertUser.run('user-emp005', 'Eve Davis',      'eve@kandz.io',   h('Eve@1234'),  'employee', 'emp-005');
}

module.exports = db;
