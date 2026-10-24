// Fills the database with a few demo users, friendships, wall posts and messages.
// Every demo account uses the password below. Run: npm run seed
import bcrypt from 'bcryptjs';
import { db } from './db.js';

const DEMO_PASSWORD = 'password123';

const people = [
  { name: 'Mark Lee', email: 'mark@chatbook.test', hometown: 'Dobbs Ferry, NY', relationship_status: 'Single', interests: 'Coding, fencing, the classics', about_me: 'Building things in my dorm room.' },
  { name: 'Sara Chen', email: 'sara@chatbook.test', hometown: 'San Francisco, CA', relationship_status: 'In a relationship', interests: 'Photography, hiking', about_me: 'Always up for a road trip.' },
  { name: 'Omar Haddad', email: 'omar@chatbook.test', hometown: 'Beirut, Lebanon', relationship_status: 'Single', interests: 'Football, chess, falafel', about_me: 'CS major. Ask me about chess.' },
  { name: 'Emma Brown', email: 'emma@chatbook.test', hometown: 'Boston, MA', relationship_status: "It's complicated", interests: 'Music, theater', about_me: 'Lead vocals in a band nobody has heard of (yet).' },
];

const ago = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

db.exec('DELETE FROM messages; DELETE FROM posts; DELETE FROM friendships; DELETE FROM users;');
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'friendships', 'posts', 'messages');");

const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
const insertUser = db.prepare(
  `INSERT INTO users (name, email, password_hash, sex, birthday, hometown, relationship_status, interests, about_me, created_at)
   VALUES (?, ?, ?, '', '', ?, ?, ?, ?, ?)`
);
const ids = people.map((p) =>
  Number(insertUser.run(p.name, p.email, hash, p.hometown, p.relationship_status, p.interests, p.about_me, ago(10_000)).lastInsertRowid)
);
const [mark, sara, omar, emma] = ids;

const friend = db.prepare('INSERT INTO friendships (requester_id, addressee_id, status, created_at) VALUES (?, ?, ?, ?)');
friend.run(mark, sara, 'accepted', ago(5000));
friend.run(mark, omar, 'accepted', ago(4000));
friend.run(sara, omar, 'accepted', ago(3000));
friend.run(emma, mark, 'pending', ago(60));

const post = db.prepare('INSERT INTO posts (author_id, wall_user_id, body, created_at) VALUES (?, ?, ?, ?)');
post.run(mark, mark, 'is excited to launch this thing.', ago(300));
post.run(sara, mark, 'Congrats on the launch! 🎉', ago(240));
post.run(omar, sara, 'Chess rematch this weekend?', ago(120));
post.run(sara, sara, 'just got back from Yosemite.', ago(45));

const message = db.prepare('INSERT INTO messages (sender_id, recipient_id, body, created_at, read_at) VALUES (?, ?, ?, ?, ?)');
message.run(sara, mark, 'Hey! Saw your new site.', ago(30), ago(29));
message.run(mark, sara, 'Thanks! Tell your friends 😄', ago(28), ago(27));
message.run(omar, mark, 'Are you coming to the study group tonight?', ago(10), null);

console.log(`Seeded ${ids.length} users. Log in with any of:`);
for (const p of people) console.log(`  ${p.email}`);
console.log('Password for all demo accounts is in server/src/seed.js (DEMO_PASSWORD).');
