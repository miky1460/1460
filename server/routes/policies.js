const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const multer = require('multer');
const db = require('../database');
const { authorize } = require('../middleware/auth');

const fileStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads/policies'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `policy-${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// GET all policies (all authenticated users can view)
router.get('/', (req, res) => {
  const { category, status } = req.query;
  let query = 'SELECT * FROM policies WHERE 1=1';
  const params = [];
  // Non-HR can only see active policies
  if (!['hr', 'admin', 'ceo'].includes(req.user.role)) {
    query += ' AND status = ?'; params.push('active');
  } else if (status) {
    query += ' AND status = ?'; params.push(status);
  }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY category, title';
  res.json(db.prepare(query).all(...params));
});

// GET single policy
router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Policy not found' });
  res.json(p);
});

// POST create policy
router.post('/', authorize('hr', 'admin', 'ceo'), upload.single('file'), (req, res) => {
  const { title, category, description, content, version, effective_date } = req.body;
  if (!title || !category)
    return res.status(400).json({ error: 'Title and category are required' });
  const id = uuidv4();
  const file_filename = req.file ? req.file.filename : null;
  const file_original_name = req.file ? req.file.originalname : null;
  db.prepare(`
    INSERT INTO policies (id, title, category, description, content, file_filename, file_original_name, version, effective_date, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(id, title, category, description || null, content || null,
    file_filename, file_original_name, version || '1.0', effective_date || null,
    req.user.employee_id || req.user.id);
  res.status(201).json({ id, message: 'Policy created successfully' });
});

// PUT update policy
router.put('/:id', authorize('hr', 'admin', 'ceo'), upload.single('file'), (req, res) => {
  const p = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Policy not found' });
  const { title, category, description, content, version, effective_date, status } = req.body;
  const file_filename = req.file ? req.file.filename : p.file_filename;
  const file_original_name = req.file ? req.file.originalname : p.file_original_name;
  db.prepare(`
    UPDATE policies SET title=?, category=?, description=?, content=?, file_filename=?, file_original_name=?,
    version=?, effective_date=?, status=?, updated_by=?, updated_at=datetime('now') WHERE id=?
  `).run(
    title || p.title, category || p.category,
    description !== undefined ? description : p.description,
    content !== undefined ? content : p.content,
    file_filename, file_original_name,
    version || p.version,
    effective_date !== undefined ? effective_date : p.effective_date,
    status || p.status,
    req.user.employee_id || req.user.id,
    req.params.id
  );
  res.json({ message: 'Policy updated successfully' });
});

// DELETE policy
router.delete('/:id', authorize('hr', 'admin', 'ceo'), (req, res) => {
  const p = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Policy not found' });
  db.prepare('DELETE FROM policies WHERE id = ?').run(req.params.id);
  res.json({ message: 'Policy deleted' });
});

module.exports = router;
