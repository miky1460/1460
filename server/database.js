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

  CREATE TABLE IF NOT EXISTS ops_reports (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    report_date TEXT NOT NULL,
    report_type TEXT NOT NULL,
    project_name TEXT,
    calls_made INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    avg_call_duration REAL DEFAULT 0,
    data_entries INTEGER DEFAULT 0,
    team_size INTEGER DEFAULT 0,
    team_target INTEGER DEFAULT 0,
    team_achieved INTEGER DEFAULT 0,
    team_issues TEXT,
    notes TEXT,
    status TEXT DEFAULT 'submitted',
    reviewed_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE(employee_id, report_date)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT,
    type TEXT DEFAULT 'outbound',
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    daily_target INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS office_requests (
    id TEXT PRIMARY KEY,
    requested_by TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    approved_at TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (requested_by) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    audience TEXT DEFAULT 'all',
    priority TEXT DEFAULT 'normal',
    created_by TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS finance_entries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    department TEXT,
    status TEXT DEFAULT 'pending',
    description TEXT,
    created_by TEXT NOT NULL,
    approved_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES employees(id)
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
    // HR dept
    ['emp-001', 'EMP001', 'Alice',   'Johnson', 'alice@kandz.io',   '555-0101', 'HR',         'HR Officer',        45000, '2022-01-15', 'active'],
    ['emp-002', 'EMP002', 'Bob',     'Smith',   'bob@kandz.io',     '555-0102', 'HR',         'HR Recruiter',      40000, '2022-06-01', 'active'],
    ['emp-003', 'EMP003', 'Carol',   'Williams','carol@kandz.io',   '555-0103', 'HR',         'HR Manager',        80000, '2021-03-10', 'active'],
    // Operations
    ['emp-007', 'EMP007', 'Omar',    'Sheikh',  'omar@kandz.io',    '555-0107', 'Operations', 'Operations Manager',90000, '2020-05-01', 'active'],
    ['emp-008', 'EMP008', 'Tariq',   'Mahmood', 'tariq@kandz.io',   '555-0108', 'Operations', 'Team Lead',         60000, '2021-08-01', 'active'],
    ['emp-009', 'EMP009', 'Sara',    'Khan',    'sara@kandz.io',    '555-0109', 'Operations', 'SDR Agent',         35000, '2022-03-15', 'active'],
    ['emp-012', 'EMP012', 'Usman',   'Ali',     'usman@kandz.io',   '555-0112', 'Operations', 'Data Entry Agent',  32000, '2022-07-01', 'active'],
    // Finance
    ['emp-004', 'EMP004', 'David',   'Brown',   'david@kandz.io',   '555-0104', 'Finance',    'Finance Manager',   85000, '2021-02-20', 'active'],
    ['emp-011', 'EMP011', 'Fatima',  'Raza',    'fatima@kandz.io',  '555-0111', 'Finance',    'Finance Analyst',   55000, '2022-09-01', 'active'],
    // Office
    ['emp-005', 'EMP005', 'Eve',     'Davis',   'eve@kandz.io',     '555-0105', 'Admin',      'Office Manager',    60000, '2021-11-05', 'active'],
    // CEO
    ['emp-006', 'EMP006', 'Miky',    'CEO',     'ceo@kandz.io',     '555-0106', 'Management', 'Chief Executive Officer', 200000, '2019-01-01', 'active'],
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

  // Seed projects
  const insertProject = db.prepare(`INSERT INTO projects (id, name, client, type, status, start_date, daily_target, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertProject.run('proj-001', 'Alpha Campaign',   'TechCorp Ltd',      'outbound',   'active', '2026-01-01', 150, 'Outbound sales campaign for TechCorp product launch');
  insertProject.run('proj-002', 'Data Clean 2026',  'DataSystems Inc',   'data_entry', 'active', '2026-02-01', 500, 'Data cleaning and entry project for DataSystems');
  insertProject.run('proj-003', 'Support Desk Q1',  'RetailMax',         'inbound',    'active', '2026-01-15', 200, 'Inbound customer support for RetailMax');

  // Seed ops reports (last 7 days)
  const insertOpsReport = db.prepare(`INSERT OR IGNORE INTO ops_reports (id, employee_id, report_date, report_type, project_name, calls_made, calls_answered, leads_generated, conversions, data_entries, team_size, team_target, team_achieved, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (let d = 1; d <= 7; d++) {
    const dt = new Date(today); dt.setDate(dt.getDate() - d);
    if (dt.getDay() === 0 || dt.getDay() === 6) continue;
    const ds = dt.toISOString().split('T')[0];
    // Agent Sara
    insertOpsReport.run(`rep-sara-${ds}`, 'emp-009', ds, 'agent', 'Alpha Campaign',
      80 + Math.floor(Math.random()*40), 60 + Math.floor(Math.random()*30),
      10 + Math.floor(Math.random()*10), 2 + Math.floor(Math.random()*5),
      0, 0, 0, 0, 'Productive day, good lead quality', 'reviewed');
    // Agent Usman
    insertOpsReport.run(`rep-usman-${ds}`, 'emp-012', ds, 'agent', 'Data Clean 2026',
      0, 0, 0, 0, 400 + Math.floor(Math.random()*150),
      0, 0, 0, 'Completed data batches on time', 'reviewed');
    // TL Tariq
    insertOpsReport.run(`rep-tariq-${ds}`, 'emp-008', ds, 'team_lead', 'Alpha Campaign',
      0, 0, 0, 0, 0, 8, 600, 520 + Math.floor(Math.random()*80),
      'Team performing at 90%+. Minor network issue resolved.', 'submitted');
  }

  // Seed announcements
  const insertAnn = db.prepare(`INSERT INTO announcements (id, title, content, category, audience, priority, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertAnn.run('ann-001', 'Q1 Performance Targets', 'All teams must achieve 90% of assigned targets for Q1 2026. Bonuses will be based on performance.', 'ops', 'management', 'important', 'emp-006');
  insertAnn.run('ann-002', 'Office Timings Update', 'Office hours are 9AM-6PM. Please ensure punctuality. Attendance will be strictly monitored.', 'general', 'all', 'normal', 'emp-003');
  insertAnn.run('ann-003', 'Finance Submission Deadline', 'All expense reports for February must be submitted by 10th March. No late submissions accepted.', 'finance', 'management', 'urgent', 'emp-004');

  // Seed office requests
  const insertOffReq = db.prepare(`INSERT INTO office_requests (id, requested_by, category, title, description, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertOffReq.run('req-001', 'emp-005', 'equipment',   'New Headsets for Ops Team', '10 headsets needed for new SDR agents joining next week', 'high',   'pending');
  insertOffReq.run('req-002', 'emp-005', 'stationery',  'Monthly Stationery Order',  'Standard monthly stationery restock — pens, papers, folders',  'normal', 'approved');
  insertOffReq.run('req-003', 'emp-005', 'maintenance', 'AC Repair Room 3',          'AC unit in Room 3 is not cooling properly. Needs service.',    'urgent', 'pending');

  // Seed finance entries
  const insertFin = db.prepare(`INSERT INTO finance_entries (id, type, category, title, amount, date, department, status, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const fm = today.toISOString().split('T')[0];
  insertFin.run('fin-001', 'expense', 'utilities',  'Monthly Internet & Phone',    45000,  fm, 'Admin',      'paid',    'Monthly ISP and telephone charges',   'emp-004');
  insertFin.run('fin-002', 'expense', 'equipment',  'Workstation Upgrade x5',      150000, fm, 'Operations', 'approved','New PCs for ops team expansion',       'emp-004');
  insertFin.run('fin-003', 'expense', 'rent',       'Office Rent - March 2026',    200000, fm, 'Admin',      'paid',    'Monthly office space rental',          'emp-004');
  insertFin.run('fin-004', 'budget',  'marketing',  'Q1 Marketing Budget',         500000, fm, 'Management', 'approved','Approved Q1 marketing spend',          'emp-006');
  insertFin.run('fin-005', 'invoice', 'other',      'TechCorp Project Invoice',    380000, fm, 'Operations', 'pending', 'Invoice for Alpha Campaign delivery',  'emp-011');
}

// Seed users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare(`INSERT INTO users (id, name, email, password, role, employee_id) VALUES (?, ?, ?, ?, ?, ?)`);
  const h = (pw) => bcrypt.hashSync(pw, 10);
  // Core roles
  insertUser.run('user-admin',   'Admin',             'admin@kandz.io',  h('Admin@123'),   'admin',          null);
  insertUser.run('user-ceo',     'Miky CEO',          'ceo@kandz.io',    h('CEO@1234'),    'ceo',            'emp-006');
  // HR
  insertUser.run('user-hr',      'Carol Williams',    'carol@kandz.io',  h('HR@1234'),     'hr',             'emp-003');
  insertUser.run('user-emp001',  'Alice Johnson',     'alice@kandz.io',  h('Alice@123'),   'employee',       'emp-001');
  insertUser.run('user-emp002',  'Bob Smith',         'bob@kandz.io',    h('Bob@1234'),    'employee',       'emp-002');
  // Operations
  insertUser.run('user-ops',     'Omar Sheikh',       'omar@kandz.io',   h('Ops@1234'),    'ops_manager',    'emp-007');
  insertUser.run('user-tl',      'Tariq Mahmood',     'tariq@kandz.io',  h('TL@1234'),     'team_lead',      'emp-008');
  insertUser.run('user-agent1',  'Sara Khan',         'sara@kandz.io',   h('Sara@123'),    'agent',          'emp-009');
  insertUser.run('user-agent2',  'Usman Ali',         'usman@kandz.io',  h('Usman@123'),   'agent',          'emp-012');
  // Finance
  insertUser.run('user-finance', 'David Brown',       'david@kandz.io',  h('Finance@123'), 'finance',        'emp-004');
  insertUser.run('user-fin2',    'Fatima Raza',       'fatima@kandz.io', h('Fatima@123'),  'employee',       'emp-011');
  // Office
  insertUser.run('user-office',  'Eve Davis',         'eve@kandz.io',    h('Office@123'),  'office_manager', 'emp-005');
}

module.exports = db;
