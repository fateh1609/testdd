/**
 * Simple JWT auth middleware
 * -----------------------------------------------
 *  − Reads “Authorization: Bearer <token>”
 *  − Verifies signature with JWT_SECRET
 *  − Loads user into req.user
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    /* pull token */
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    /* verify & load user */
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;                // pass user object downstream
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token validation failed' });
  }
}

module.exports = { authMiddleware };
