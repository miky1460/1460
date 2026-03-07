const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded files (CVs, policy attachments)
app.use('/uploads', authenticate, express.static(path.join(__dirname, 'uploads')));

// Public: auth routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/employees',    authenticate, require('./routes/employees'));
app.use('/api/leaves',       authenticate, require('./routes/leaves'));
app.use('/api/attendance',   authenticate, require('./routes/attendance'));
app.use('/api/payroll',      authenticate, require('./routes/payroll'));
app.use('/api/reports',      authenticate, require('./routes/reports'));
app.use('/api/operations',   authenticate, require('./routes/operations'));
app.use('/api/finance',      authenticate, require('./routes/finance'));
app.use('/api/office',       authenticate, require('./routes/office'));
app.use('/api/announcements',authenticate, require('./routes/announcements'));
app.use('/api/recruitment',  authenticate, require('./routes/recruitment'));
app.use('/api/policies',     authenticate, require('./routes/policies'));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`KANDZ App Server running on http://localhost:${PORT}`);
});
