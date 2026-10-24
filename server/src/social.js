import { db } from './db.js';

export function getFriendship(a, b) {
  return db
    .prepare(
      `SELECT * FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)`
    )
    .get(a, b, b, a);
}

export function areFriends(a, b) {
  return getFriendship(a, b)?.status === 'accepted';
}

/** How `other` relates to `me`: self | friends | request_sent | request_received | none */
export function relationship(me, other) {
  if (me === other) return 'self';
  const f = getFriendship(me, other);
  if (!f) return 'none';
  if (f.status === 'accepted') return 'friends';
  return f.requester_id === me ? 'request_sent' : 'request_received';
}

export function friendIds(userId) {
  return db
    .prepare(
      `SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END AS id
       FROM friendships
       WHERE status = 'accepted' AND (requester_id = ? OR addressee_id = ?)`
    )
    .all(userId, userId, userId)
    .map((r) => r.id);
}

/** Validates a user-supplied text body; returns the trimmed text or throws a 400-style error. */
export function cleanBody(body, max) {
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) throw httpError(400, 'Write something first.');
  if (text.length > max) throw httpError(400, `Keep it under ${max} characters.`);
  return text;
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
