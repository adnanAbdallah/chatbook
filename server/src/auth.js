import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config.js';
import { db } from './db.js';

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: '7d' });
}

/** Returns the user id for a valid token of an existing user, otherwise throws. */
export function verifyToken(token) {
  const userId = Number(jwt.verify(token, JWT_SECRET).sub);
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) throw new Error('Unknown user');
  return userId;
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  try {
    req.userId = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in.' });
  }
}
