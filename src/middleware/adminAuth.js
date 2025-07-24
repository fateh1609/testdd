// backend/src/middleware/adminAuth.js
const jwtAuth = require('./jwtAuth');

module.exports = [
  jwtAuth,
  (req, res, next) => {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin only' });
  }
];
