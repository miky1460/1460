const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'hr-app-secret-key-2025';

// Verify JWT and attach user to request
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please login again' });
  }
}

// Only allow specific roles
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do this' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, JWT_SECRET };
