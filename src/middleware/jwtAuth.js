// backend/src/middleware/jwtAuth.js
const jwt  = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function jwtAuth (req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const token   = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the full user (with role) to req.user
    const user = await User.findByPk(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;            // role, flags, etc. now available
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
