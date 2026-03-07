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

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position_applied TEXT NOT NULL,
    department TEXT NOT NULL,
    source TEXT DEFAULT 'direct',
    status TEXT DEFAULT 'applied',
    cv_filename TEXT,
    cv_original_name TEXT,
    remarks TEXT,
    interview_date TEXT,
    interview_notes TEXT,
    offered_salary REAL,
    joining_date TEXT,
    rejected_reason TEXT,
    created_by TEXT NOT NULL,
    updated_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES employees(id)
  );

  CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    content TEXT,
    file_filename TEXT,
    file_original_name TEXT,
    version TEXT DEFAULT '1.0',
    effective_date TEXT,
    status TEXT DEFAULT 'active',
    created_by TEXT NOT NULL,
    updated_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES employees(id)
  );

`);// Seed employees
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

  // HR Department Bookkeeping
  insertFin.run('fin-006', 'expense', 'recruitment',  'Job Portal Subscription',       12000, fm, 'HR',         'pending',  'Rozee.pk monthly subscription for hiring',     'emp-003');
  insertFin.run('fin-007', 'expense', 'training',     'Customer Service Training',      35000, fm, 'HR',         'approved', 'External trainer for SDR onboarding batch',    'emp-003');
  insertFin.run('fin-008', 'expense', 'staff_welfare','Eid Bonus Distribution',        120000, fm, 'HR',         'paid',     'Eid bonus for all staff',                     'emp-003');
  insertFin.run('fin-009', 'budget',  'hr_events',    'Employee Appreciation Day',      50000, fm, 'HR',         'pending',  'Q1 staff appreciation event budget request',   'emp-003');

  // Operations Department Bookkeeping
  insertFin.run('fin-010', 'expense', 'tools_software','CRM Software License',          28000, fm, 'Operations', 'approved', 'Monthly CRM tool for agents',                 'emp-007');
  insertFin.run('fin-011', 'expense', 'project_cost', 'Alpha Campaign Setup Cost',      45000, fm, 'Operations', 'paid',     'Infra and setup for Alpha Campaign launch',    'emp-007');
  insertFin.run('fin-012', 'expense', 'agent_bonus',  'SDR Performance Bonus Feb',      60000, fm, 'Operations', 'pending',  'Bonus for top 3 agents — February',           'emp-007');
  insertFin.run('fin-013', 'invoice', 'client_expense','RetailMax Support Invoice',    220000, fm, 'Operations', 'pending',  'Monthly invoice to RetailMax for inbound desk','emp-007');

  // Admin/Office Department Bookkeeping
  insertFin.run('fin-014', 'expense', 'office_supplies','Monthly Stationery',           8500,  fm, 'Admin',      'approved', 'Pens, paper, folders for all depts',          'emp-005');
  insertFin.run('fin-015', 'expense', 'maintenance',   'AC Service Charges',           15000, fm, 'Admin',      'pending',  'AC repair and servicing for Room 3 and 4',    'emp-005');
  insertFin.run('fin-016', 'expense', 'utilities',     'Internet & Electricity March',  55000, fm, 'Admin',      'paid',     'Monthly utility bills',                       'emp-005');

  // Seed HR policies
  const insertPolicy = db.prepare(`INSERT INTO policies (id, title, category, description, content, version, effective_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertPolicy.run('pol-001', 'Attendance & Punctuality Policy', 'Attendance',
    'Rules governing employee attendance, timings, and punctuality.',
    `1. Office hours are 9:00 AM to 6:00 PM, Monday to Saturday.\n2. Employees must check in by 9:15 AM. Late arrivals beyond 9:15 AM will be marked as half-day.\n3. Three late arrivals in a month will result in one day salary deduction.\n4. Unplanned absences must be notified to HR before 9:30 AM via WhatsApp or call.\n5. Attendance records are reviewed monthly and impact performance appraisals.`,
    '1.0', '2026-01-01', 'active', 'emp-003');
  insertPolicy.run('pol-002', 'Leave Policy', 'Leave',
    'Types of leaves, entitlements, and application procedures.',
    `1. Annual Leave: 14 days per year. Requires 5 days advance notice for planned leaves.\n2. Sick Leave: 7 days per year. Medical certificate required for more than 2 consecutive days.\n3. Casual Leave: 5 days per year. For personal emergencies with same-day or prior notification.\n4. Leave without Pay (LWP): Granted at management discretion after all paid leaves are exhausted.\n5. Leave applications must be submitted via the HR portal and approved by line manager + HR.\n6. Unused annual leave can be carried forward up to 5 days to next year.`,
    '1.0', '2026-01-01', 'active', 'emp-003');
  insertPolicy.run('pol-003', 'Code of Conduct', 'Conduct',
    'Standards of professional behavior and ethics at KANDZ.',
    `1. All employees must maintain professional conduct at all times in the office.\n2. Harassment, discrimination, or bullying of any form is strictly prohibited and grounds for immediate termination.\n3. Confidential company and client information must not be shared externally.\n4. Mobile phone usage during work hours should be limited to work-related activities.\n5. Employees must maintain cleanliness and hygiene of their workstations.\n6. Disputes between employees must be reported to HR for resolution. Direct confrontation is prohibited.\n7. Social media posts about the company require prior approval from management.`,
    '1.0', '2026-01-01', 'active', 'emp-003');
  insertPolicy.run('pol-004', 'Compensation & Benefits Policy', 'Compensation',
    'Salary structure, bonuses, increments, and benefits.',
    `1. Salaries are processed on the 28th of every month.\n2. Performance bonuses are awarded quarterly based on KPI achievement (target: 90%+).\n3. Annual increments are reviewed every January based on performance appraisal scores.\n4. Eid bonus (one month salary) is paid before each Eid holiday.\n5. Employees are eligible for health insurance after 6 months of service.\n6. Travel allowance is provided for client visits and official travel as per grade.\n7. All salary deductions (late marks, LWP, etc.) are communicated to the employee 5 days before payment.`,
    '1.0', '2026-01-01', 'active', 'emp-003');
  insertPolicy.run('pol-005', 'Recruitment & Hiring Policy', 'Recruitment',
    'Hiring process, screening criteria, and onboarding standards.',
    `1. All vacancies must be approved by the department head and HR Manager before posting.\n2. Job postings are done on Rozee.pk, LinkedIn, and through employee referrals.\n3. CV Screening → Phone Screen → Interview → Assessment → Offer → Onboarding.\n4. Hiring decisions require sign-off from HR Manager + Department Head.\n5. Background verification is mandatory for all hires before joining date.\n6. New hires serve a 3-month probation period. Extension up to 6 months at management discretion.\n7. Offer letters must be issued within 48 hours of final selection approval.`,
    '1.0', '2026-01-01', 'active', 'emp-003');
  insertPolicy.run('pol-006', 'Data Protection & Confidentiality', 'Compliance',
    'Policy on handling of company, client, and employee data.',
    `1. All employee and client data is strictly confidential.\n2. Company systems and data must only be accessed using authorized credentials.\n3. Sharing login credentials with colleagues is strictly prohibited.\n4. Data must not be copied to personal devices or external storage without HR approval.\n5. Upon resignation or termination, all company assets and data access are revoked immediately.\n6. Violations of data protection policy are subject to disciplinary action including termination and legal proceedings.`,
    '1.0', '2026-01-01', 'active', 'emp-003');

  // Seed candidates
  const insertCandidate = db.prepare(`INSERT INTO candidates (id, full_name, email, phone, position_applied, department, source, status, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  insertCandidate.run('cand-001', 'Ahmed Raza',       'ahmed.raza@gmail.com',     '0300-1234567', 'SDR Agent',          'Operations', 'Rozee.pk',  'applied',     'Good communication skills, fresher. Needs assessment.', 'emp-003');
  insertCandidate.run('cand-002', 'Sana Mirza',       'sana.mirza@gmail.com',     '0311-9876543', 'HR Recruiter',       'HR',         'LinkedIn',  'shortlisted', 'Strong HR background, 2 years experience. Schedule interview.', 'emp-003');
  insertCandidate.run('cand-003', 'Bilal Chaudhry',   'bilal.ch@yahoo.com',       '0321-4567890', 'Team Lead',          'Operations', 'Referral',  'screened',    'Excellent ops experience. Panel interview pending. Very promising.', 'emp-003');
  insertCandidate.run('cand-004', 'Nadia Hussain',    'nadia.h@gmail.com',        '0333-2345678', 'Finance Analyst',    'Finance',    'Rozee.pk',  'hired',       'Hired! Strong Excel and financial reporting skills. Joining 15 March.', 'emp-003');
  insertCandidate.run('cand-005', 'Zubair Khan',      'zubair.khan@hotmail.com',  '0345-6789012', 'Data Entry Agent',   'Operations', 'Walk-in',   'applied',     'Average typing speed, needs to improve. Gave test.', 'emp-003');
  insertCandidate.run('cand-006', 'Hina Farooq',      'hina.farooq@gmail.com',    '0301-3456789', 'Office Coordinator', 'Admin',      'LinkedIn',  'shortlisted', 'Good admin background. Shortlisted for F2F interview.', 'emp-003');
  insertCandidate.run('cand-007', 'Kamran Iqbal',     'kamran.iqbal@gmail.com',   '0312-8765432', 'SDR Agent',          'Operations', 'Rozee.pk',  'screened',    'Cleared phone screen. Awaiting panel interview slot.', 'emp-003');
  insertCandidate.run('cand-008', 'Ayesha Siddiqui',  'ayesha.s@gmail.com',       '0322-5678901', 'HR Officer',         'HR',         'Referral',  'rejected',    'Not a cultural fit. Overqualified for current opening.', 'emp-003');
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
