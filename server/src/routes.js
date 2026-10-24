import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { requireAuth, signToken } from './auth.js';
import { PROFILE_FIELDS, db, getUser, now, publicUser } from './db.js';
import { emitToUser, isOnline, markRead } from './realtime.js';
import { areFriends, cleanBody, friendIds, getFriendship, httpError, relationship } from './social.js';

export const router = Router();

const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || !getUser(id)) throw httpError(404, 'User not found.');
  return id;
};

const withPresence = (user) => ({ ...user, online: isOnline(user.id) });

const POST_SELECT = `
  SELECT p.*, a.name AS author_name, w.name AS wall_user_name
  FROM posts p
  JOIN users a ON a.id = p.author_id
  JOIN users w ON w.id = p.wall_user_id`;

/* ---------- auth ---------- */

router.post('/auth/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (name.length < 2 || name.length > 60) throw httpError(400, 'Please enter your full name.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw httpError(400, 'Please enter a valid email.');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters.');
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw httpError(409, 'That email is already registered.');

  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(name, email, bcrypt.hashSync(password, 10), now());
  const id = Number(lastInsertRowid);
  res.status(201).json({ token: signToken(id), user: getUser(id) });
});

router.post('/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!row || !bcrypt.compareSync(String(req.body?.password || ''), row.password_hash)) {
    throw httpError(401, 'Wrong email or password.');
  }
  res.json({ token: signToken(row.id), user: publicUser(row) });
});

router.use(requireAuth);

/* ---------- me ---------- */

router.get('/me', (req, res) => res.json({ user: getUser(req.userId) }));

router.put('/me', (req, res) => {
  const updates = {};
  if (req.body?.name !== undefined) {
    const name = String(req.body.name).trim();
    if (name.length < 2 || name.length > 60) throw httpError(400, 'Please enter your full name.');
    updates.name = name;
  }
  for (const field of PROFILE_FIELDS) {
    if (req.body?.[field] !== undefined) updates[field] = String(req.body[field]).trim().slice(0, 1000);
  }
  const keys = Object.keys(updates);
  if (keys.length) {
    db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(updates), req.userId);
  }
  res.json({ user: getUser(req.userId) });
});

router.get('/me/counts', (req, res) => {
  const friendRequests = db
    .prepare("SELECT COUNT(*) AS n FROM friendships WHERE addressee_id = ? AND status = 'pending'")
    .get(req.userId).n;
  const unreadMessages = db
    .prepare('SELECT COUNT(*) AS n FROM messages WHERE recipient_id = ? AND read_at IS NULL')
    .get(req.userId).n;
  res.json({ friendRequests, unreadMessages });
});

/* ---------- users & profiles ---------- */

router.get('/users', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });
  const rows = db
    .prepare('SELECT * FROM users WHERE name LIKE ? OR hometown LIKE ? OR interests LIKE ? ORDER BY name LIMIT 50')
    .all(...Array(3).fill(`%${q}%`));
  res.json({ users: rows.map((r) => ({ ...publicUser(r), relationship: relationship(req.userId, r.id) })) });
});

router.get('/users/:id', (req, res) => {
  const id = idParam(req);
  const rel = relationship(req.userId, id);
  const user = withPresence(getUser(id));
  // Like the early days: full profile info is only visible to friends.
  if (rel !== 'self' && rel !== 'friends') {
    for (const field of PROFILE_FIELDS) if (field !== 'hometown') delete user[field];
    delete user.email;
  }
  res.json({ user, relationship: rel, friendCount: friendIds(id).length });
});

router.get('/users/:id/friends', (req, res) => {
  const ids = friendIds(idParam(req));
  res.json({ friends: ids.map((id) => withPresence(getUser(id))).sort((a, b) => a.name.localeCompare(b.name)) });
});

router.get('/users/:id/wall', (req, res) => {
  const id = idParam(req);
  const posts = db.prepare(`${POST_SELECT} WHERE p.wall_user_id = ? ORDER BY p.id DESC LIMIT 100`).all(id);
  res.json({ posts });
});

router.post('/users/:id/wall', (req, res) => {
  const wallId = idParam(req);
  if (wallId !== req.userId && !areFriends(req.userId, wallId)) {
    throw httpError(403, 'You can only write on your friends’ walls.');
  }
  const body = cleanBody(req.body?.body, 1000);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO posts (author_id, wall_user_id, body, created_at) VALUES (?, ?, ?, ?)')
    .run(req.userId, wallId, body, now());
  const post = db.prepare(`${POST_SELECT} WHERE p.id = ?`).get(Number(lastInsertRowid));
  if (wallId !== req.userId) emitToUser(wallId, 'wall:new', post);
  res.status(201).json({ post });
});

router.delete('/posts/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) throw httpError(404, 'Post not found.');
  if (post.author_id !== req.userId && post.wall_user_id !== req.userId) throw httpError(403, 'Not your post.');
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

router.get('/feed', (req, res) => {
  const ids = [req.userId, ...friendIds(req.userId)];
  const marks = ids.map(() => '?').join(',');
  const posts = db
    .prepare(`${POST_SELECT} WHERE p.author_id IN (${marks}) OR p.wall_user_id IN (${marks}) ORDER BY p.id DESC LIMIT 100`)
    .all(...ids, ...ids);
  res.json({ posts });
});

/* ---------- friends ---------- */

router.get('/friends', (req, res) => {
  const friends = friendIds(req.userId).map((id) => withPresence(getUser(id)));
  res.json({ friends: friends.sort((a, b) => b.online - a.online || a.name.localeCompare(b.name)) });
});

router.get('/friends/requests', (req, res) => {
  const incoming = db
    .prepare(
      `SELECT u.* FROM friendships f JOIN users u ON u.id = f.requester_id
       WHERE f.addressee_id = ? AND f.status = 'pending' ORDER BY f.id DESC`
    )
    .all(req.userId)
    .map(publicUser);
  const outgoing = db
    .prepare(
      `SELECT u.* FROM friendships f JOIN users u ON u.id = f.addressee_id
       WHERE f.requester_id = ? AND f.status = 'pending' ORDER BY f.id DESC`
    )
    .all(req.userId)
    .map(publicUser);
  res.json({ incoming, outgoing });
});

router.post('/friends/:id/request', (req, res) => {
  const other = idParam(req);
  if (other === req.userId) throw httpError(400, 'You can’t friend yourself.');
  const existing = getFriendship(req.userId, other);
  if (existing?.status === 'accepted') throw httpError(409, 'You are already friends.');
  if (existing?.requester_id === req.userId) throw httpError(409, 'Request already sent.');
  if (existing) {
    // They already asked us: treat this as accepting.
    db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO friendships (requester_id, addressee_id, status, created_at) VALUES (?, ?, 'pending', ?)")
      .run(req.userId, other, now());
  }
  emitToUser(other, 'friends:changed', {});
  res.json({ relationship: relationship(req.userId, other) });
});

router.post('/friends/:id/accept', (req, res) => {
  const other = idParam(req);
  const f = getFriendship(req.userId, other);
  if (!f || f.status !== 'pending' || f.addressee_id !== req.userId) throw httpError(404, 'No pending request.');
  db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(f.id);
  emitToUser(other, 'friends:changed', {});
  emitToUser(other, 'presence', { userId: req.userId, online: isOnline(req.userId) });
  emitToUser(req.userId, 'presence', { userId: other, online: isOnline(other) });
  res.json({ relationship: 'friends' });
});

// Unfriend, decline a request, or cancel one you sent.
router.delete('/friends/:id', (req, res) => {
  const other = idParam(req);
  const f = getFriendship(req.userId, other);
  if (f) {
    db.prepare('DELETE FROM friendships WHERE id = ?').run(f.id);
    emitToUser(other, 'friends:changed', {});
  }
  res.json({ relationship: 'none' });
});

/* ---------- messages ---------- */

router.get('/conversations', (req, res) => {
  const me = req.userId;
  const rows = db
    .prepare(
      `SELECT m.*, u.id AS partner_id, u.name AS partner_name,
         (SELECT COUNT(*) FROM messages x WHERE x.sender_id = u.id AND x.recipient_id = ? AND x.read_at IS NULL) AS unread
       FROM (
         SELECT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS partner, MAX(id) AS last_id
         FROM messages WHERE sender_id = ? OR recipient_id = ?
         GROUP BY partner
       ) c
       JOIN messages m ON m.id = c.last_id
       JOIN users u ON u.id = c.partner
       ORDER BY m.id DESC`
    )
    .all(me, me, me, me);
  res.json({ conversations: rows.map((r) => ({ ...r, online: isOnline(r.partner_id) })) });
});

router.get('/messages/:id', (req, res) => {
  const other = idParam(req);
  const messages = db
    .prepare(
      `SELECT * FROM (
         SELECT * FROM messages
         WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
         ORDER BY id DESC LIMIT 200
       ) ORDER BY id ASC`
    )
    .all(req.userId, other, other, req.userId);
  markRead(req.userId, other);
  res.json({
    partner: withPresence(getUser(other)),
    relationship: relationship(req.userId, other),
    messages,
  });
});
