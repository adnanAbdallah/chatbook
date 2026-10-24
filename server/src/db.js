import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from './config.js';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    sex TEXT NOT NULL DEFAULT '',
    birthday TEXT NOT NULL DEFAULT '',
    hometown TEXT NOT NULL DEFAULT '',
    relationship_status TEXT NOT NULL DEFAULT '',
    interests TEXT NOT NULL DEFAULT '',
    about_me TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  -- One row per pair of users. status: 'pending' (requester asked) or 'accepted'.
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
    created_at TEXT NOT NULL,
    UNIQUE (requester_id, addressee_id)
  );

  -- Wall posts: author_id wrote on wall_user_id's wall (same id = status update).
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wall_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    read_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_posts_wall ON posts (wall_user_id, id);
  CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id, id);
  CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages (sender_id, recipient_id, id);
  CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages (recipient_id, read_at);
`);

export const now = () => new Date().toISOString();

export const PROFILE_FIELDS = ['sex', 'birthday', 'hometown', 'relationship_status', 'interests', 'about_me'];

export function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...user } = row;
  return user;
}

export function getUser(id) {
  return publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
}
