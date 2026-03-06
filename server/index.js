const express = require('express');
const cors = require('cors');
const path = require('path');
const { authenticate, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public: auth routes (login, etc.)
app.use('/api/auth', require('./routes/auth'));

// Protected routes - all require login
app.use('/api/employees', authenticate, require('./routes/employees'));
app.use('/api/leaves',    authenticate, require('./routes/leaves'));
app.use('/api/attendance',authenticate, require('./routes/attendance'));
app.use('/api/payroll',   authenticate, require('./routes/payroll'));
app.use('/api/reports',   authenticate, require('./routes/reports'));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`HR App Server running on http://localhost:${PORT}`);
});
