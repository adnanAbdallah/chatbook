import { Server } from 'socket.io';
import { verifyToken } from './auth.js';
import { CLIENT_ORIGIN } from './config.js';
import { db, now } from './db.js';
import { areFriends, cleanBody, friendIds } from './social.js';

let io = null;
// userId -> number of open sockets (a user can have several tabs open)
const connections = new Map();

export const isOnline = (userId) => connections.has(userId);

export function emitToUser(userId, event, data) {
  io?.to(`user:${userId}`).emit(event, data);
}

function emitToFriends(userId, event, data) {
  for (const id of friendIds(userId)) emitToUser(id, event, data);
}

export function insertMessage(senderId, recipientId, body) {
  const createdAt = now();
  const { lastInsertRowid } = db
    .prepare('INSERT INTO messages (sender_id, recipient_id, body, created_at) VALUES (?, ?, ?, ?)')
    .run(senderId, recipientId, body, createdAt);
  return { id: Number(lastInsertRowid), sender_id: senderId, recipient_id: recipientId, body, created_at: createdAt, read_at: null };
}

export function markRead(readerId, senderId) {
  const { changes } = db
    .prepare('UPDATE messages SET read_at = ? WHERE recipient_id = ? AND sender_id = ? AND read_at IS NULL')
    .run(now(), readerId, senderId);
  if (changes) emitToUser(senderId, 'messages:read', { by: readerId });
}

export function attachRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } });

  io.use((socket, next) => {
    try {
      socket.userId = verifyToken(socket.handshake.auth?.token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const me = socket.userId;
    socket.join(`user:${me}`);

    const count = connections.get(me) || 0;
    connections.set(me, count + 1);
    if (count === 0) emitToFriends(me, 'presence', { userId: me, online: true });
    socket.emit('presence:list', friendIds(me).filter(isOnline));

    socket.on('message:send', ({ to, body } = {}, ack = () => {}) => {
      try {
        const recipient = Number(to);
        if (!areFriends(me, recipient)) return ack({ error: 'You can only message your friends.' });
        const message = insertMessage(me, recipient, cleanBody(body, 2000));
        emitToUser(recipient, 'message:new', message);
        emitToUser(me, 'message:new', message);
        ack({ message });
      } catch (err) {
        ack({ error: err.status ? err.message : 'Could not send message.' });
      }
    });

    socket.on('messages:read', ({ from } = {}, ack = () => {}) => {
      markRead(me, Number(from));
      ack();
    });

    socket.on('typing', ({ to } = {}) => {
      if (areFriends(me, Number(to))) emitToUser(Number(to), 'typing', { from: me });
    });

    socket.on('disconnect', () => {
      const left = connections.get(me) - 1;
      if (left > 0) return connections.set(me, left);
      connections.delete(me);
      emitToFriends(me, 'presence', { userId: me, online: false });
    });
  });
}
