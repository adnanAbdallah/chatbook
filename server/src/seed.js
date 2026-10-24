// Wipes the database and fills it with the demo data from seed-data.js.
// Run: npm run seed  (account list: docs/TEST_ACCOUNTS.md)
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { DEMO_PASSWORD, conversations, emailFor, friendships, pendingRequests, posts, users } from './seed-data.js';

const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

// Catch inconsistent seed data before touching the database.
const pairKey = (a, b) => [a, b].sort().join('|');
const friendSet = new Set(friendships.map(([a, b]) => pairKey(a, b)));
const known = new Set(users.map((u) => u.key));
for (const [a, b] of [...friendships, ...pendingRequests, ...posts.map(([x, y]) => [x, y]), ...conversations.map((c) => c.between)]) {
  if (!known.has(a) || !known.has(b)) throw new Error(`Unknown user key in seed data: ${a} / ${b}`);
}
for (const [a, b] of pendingRequests) {
  if (friendSet.has(pairKey(a, b))) throw new Error(`${a} and ${b} are both friends and pending`);
}
for (const { between: [a, b] } of conversations) {
  if (!friendSet.has(pairKey(a, b))) throw new Error(`Conversation between non-friends: ${a} / ${b}`);
}
for (const [author, wall] of posts) {
  if (author !== wall && !friendSet.has(pairKey(author, wall))) throw new Error(`Wall post between non-friends: ${author} / ${wall}`);
}

db.exec('BEGIN');
try {
  db.exec('DELETE FROM messages; DELETE FROM posts; DELETE FROM friendships; DELETE FROM users;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'friendships', 'posts', 'messages');");

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const insertUser = db.prepare(
    `INSERT INTO users (name, email, password_hash, sex, birthday, hometown, relationship_status, interests, about_me, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const id = {};
  users.forEach((u, i) => {
    id[u.key] = Number(
      insertUser.run(u.name, emailFor(u.key), hash, u.sex, u.birthday, u.hometown, u.relationship_status, u.interests, u.about_me, ago(20_000 - i * 100)).lastInsertRowid
    );
  });

  const friend = db.prepare('INSERT INTO friendships (requester_id, addressee_id, status, created_at) VALUES (?, ?, ?, ?)');
  for (const [a, b] of friendships) friend.run(id[a], id[b], 'accepted', ago(10_000));
  for (const [from, to] of pendingRequests) friend.run(id[from], id[to], 'pending', ago(90));

  const post = db.prepare('INSERT INTO posts (author_id, wall_user_id, body, created_at) VALUES (?, ?, ?, ?)');
  for (const [author, wall, body, minutes] of [...posts].sort((a, b) => b[3] - a[3])) {
    post.run(id[author], id[wall], body, ago(minutes));
  }

  // Insert all messages in chronological order so ids follow time.
  const allMessages = conversations.flatMap(({ between: [a, b], messages }) =>
    messages.map(([sender, body, minutes, unread]) => ({ sender, recipient: sender === a ? b : a, body, minutes, unread }))
  );
  allMessages.sort((x, y) => y.minutes - x.minutes);
  const message = db.prepare('INSERT INTO messages (sender_id, recipient_id, body, created_at, read_at) VALUES (?, ?, ?, ?, ?)');
  for (const m of allMessages) {
    message.run(id[m.sender], id[m.recipient], m.body, ago(m.minutes), m.unread ? null : ago(m.minutes - 1));
  }
  db.exec('COMMIT');

  console.log(
    `Seeded ${users.length} users, ${friendships.length} friendships, ${pendingRequests.length} pending requests, ` +
      `${posts.length} wall posts and ${allMessages.length} messages.`
  );
  console.log('Accounts, passwords and relationships: docs/TEST_ACCOUNTS.md');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}
