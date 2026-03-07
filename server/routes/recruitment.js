const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const db = require('../database');
const { authorize } = require('../middleware/auth');

const cvStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/cvs'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cv-${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// GET all candidates (HR, admin, CEO only)
router.get('/', authorize('hr', 'admin', 'ceo'), (req, res) => {
  const { status, department, search } = req.query;
  let query = 'SELECT * FROM candidates WHERE 1=1';
  const params = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (department) { query += ' AND department = ?'; params.push(department); }
  if (search) {
    query += ' AND (full_name LIKE ? OR position_applied LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// GET pipeline summary counts
router.get('/summary', authorize('hr', 'admin', 'ceo'), (req, res) => {
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count FROM candidates GROUP BY status
  `).all();
  const summary = { applied: 0, shortlisted: 0, screened: 0, hired: 0, rejected: 0 };
  rows.forEach(r => { if (summary[r.status] !== undefined) summary[r.status] = r.count; });
  res.json(summary);
});

// GET single candidate
router.get('/:id', authorize('hr', 'admin', 'ceo'), (req, res) => {
  const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidate not found' });
  res.json(c);
});

// POST create candidate (with optional CV file)
router.post('/', authorize('hr', 'admin', 'ceo'), upload.single('cv'), (req, res) => {
  const { full_name, email, phone, position_applied, department, source, remarks } = req.body;
  if (!full_name || !position_applied || !department)
    return res.status(400).json({ error: 'Name, position, and department are required' });
  const id = uuidv4();
  const cv_filename = req.file ? req.file.filename : null;
  const cv_original_name = req.file ? req.file.originalname : null;
  db.prepare(`
    INSERT INTO candidates (id, full_name, email, phone, position_applied, department, source, status, cv_filename, cv_original_name, remarks, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'applied', ?, ?, ?, ?)
  `).run(id, full_name, email || null, phone || null, position_applied, department,
    source || 'direct', cv_filename, cv_original_name, remarks || null, req.user.employee_id || req.user.id);
  res.status(201).json({ id, message: 'Candidate added successfully' });
});

// PUT update candidate (status, remarks, interview info, etc.)
router.put('/:id', authorize('hr', 'admin', 'ceo'), upload.single('cv'), (req, res) => {
  const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidate not found' });
  const {
    full_name, email, phone, position_applied, department, source,
    status, remarks, interview_date, interview_notes, offered_salary, joining_date, rejected_reason
  } = req.body;
  const cv_filename = req.file ? req.file.filename : c.cv_filename;
  const cv_original_name = req.file ? req.file.originalname : c.cv_original_name;
  db.prepare(`
    UPDATE candidates SET
      full_name=?, email=?, phone=?, position_applied=?, department=?, source=?,
      status=?, cv_filename=?, cv_original_name=?, remarks=?,
      interview_date=?, interview_notes=?, offered_salary=?, joining_date=?, rejected_reason=?,
      updated_by=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    full_name || c.full_name,
    email !== undefined ? email : c.email,
    phone !== undefined ? phone : c.phone,
    position_applied || c.position_applied,
    department || c.department,
    source || c.source,
    status || c.status,
    cv_filename, cv_original_name,
    remarks !== undefined ? remarks : c.remarks,
    interview_date !== undefined ? interview_date : c.interview_date,
    interview_notes !== undefined ? interview_notes : c.interview_notes,
    offered_salary !== undefined ? offered_salary : c.offered_salary,
    joining_date !== undefined ? joining_date : c.joining_date,
    rejected_reason !== undefined ? rejected_reason : c.rejected_reason,
    req.user.employee_id || req.user.id,
    req.params.id
  );
  res.json({ message: 'Candidate updated successfully' });
});

// DELETE candidate
router.delete('/:id', authorize('hr', 'admin', 'ceo'), (req, res) => {
  const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Candidate not found' });
  db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
  res.json({ message: 'Candidate deleted' });
});

module.exports = router;
