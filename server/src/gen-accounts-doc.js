// Writes docs/TEST_ACCOUNTS.md from seed-data.js so the doc always matches what `npm run seed` creates.
// Run: npm run docs:accounts
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEMO_PASSWORD, conversations, emailFor, friendships, pendingRequests, posts, users } from './seed-data.js';

const OUT = fileURLToPath(new URL('../../docs/TEST_ACCOUNTS.md', import.meta.url));

const byKey = Object.fromEntries(users.map((u, i) => [u.key, { ...u, id: i + 1 }]));
const name = (key) => byKey[key].name;
const first = (key) => name(key).split(' ')[0];

const friendsOf = (key) =>
  friendships.flatMap(([a, b]) => (a === key ? [b] : b === key ? [a] : [])).sort((x, y) => name(x).localeCompare(name(y)));
const incoming = (key) => pendingRequests.filter(([, to]) => to === key).map(([from]) => from);
const outgoing = (key) => pendingRequests.filter(([from]) => from === key).map(([, to]) => to);
const unreadFor = (key) =>
  conversations.reduce(
    (n, { between, messages }) => n + (between.includes(key) ? messages.filter(([s, , , u]) => u && s !== key).length : 0),
    0
  );
const list = (keys) => (keys.length ? keys.map(first).join(', ') : '—');

const lines = [];
const out = (...l) => lines.push(...l);

out(
  '# Test accounts',
  '',
  '> Generated from `server/src/seed-data.js` by `npm run docs:accounts`. Edit the seed data, not this file.',
  '',
  'Load these accounts into the local database with `npm run seed` (from the repo root). Seeding **wipes all existing data** first.',
  '',
  `All accounts use the password **\`${DEMO_PASSWORD}\`**. These are local test accounts only — never reuse this password anywhere real.`,
  '',
  `**Totals:** ${users.length} users · ${friendships.length} friendships · ${pendingRequests.length} pending friend requests · ` +
    `${posts.length} wall posts · ${conversations.reduce((n, c) => n + c.messages.length, 0)} messages in ${conversations.length} conversations.`,
  '',
  '## Accounts',
  '',
  '| ID | Name | Email | Hometown | Friends | Requests in / out | Unread messages |',
  '| --: | --- | --- | --- | --: | :-: | --: |'
);
for (const u of users) {
  out(
    `| ${byKey[u.key].id} | ${u.name} | \`${emailFor(u.key)}\` | ${u.hometown} | ${friendsOf(u.key).length} | ` +
      `${incoming(u.key).length} / ${outgoing(u.key).length} | ${unreadFor(u.key) || '—'} |`
  );
}

out('', '## Relationships', '', '### Friends of each user', '', '| User | Friends | Incoming requests from | Sent requests to |', '| --- | --- | --- | --- |');
for (const u of users) {
  out(`| **${u.name}** | ${list(friendsOf(u.key))} | ${list(incoming(u.key))} | ${list(outgoing(u.key))} |`);
}

out('', '### Pending friend requests', '', '| From | To |', '| --- | --- |');
for (const [from, to] of pendingRequests) out(`| ${name(from)} | ${name(to)} |`);

out(
  '',
  '### Friendship graph',
  '',
  'Solid lines are friendships; dotted arrows are pending requests (from → to).',
  '',
  '```mermaid',
  'graph LR'
);
for (const [a, b] of friendships) out(`  ${a}["${first(a)}"] --- ${b}["${first(b)}"]`);
for (const [from, to] of pendingRequests) out(`  ${from}["${first(from)}"] -.-> ${to}["${first(to)}"]`);
out('```');

out('', '## Conversations', '', 'Messages can only be sent between friends, so every conversation is between two friends.', '', '| Between | Messages | Unread | Last message |', '| --- | --: | --- | --- |');
for (const { between: [a, b], messages } of conversations) {
  const unread = messages.filter(([, , , u]) => u);
  const unreadText = unread.length ? `${unread.length} for ${first(unread[0][0] === a ? b : a)}` : '—';
  const [lastSender, lastText] = messages[messages.length - 1];
  out(`| ${name(a)} ↔ ${name(b)} | ${messages.length} | ${unreadText} | ${first(lastSender)}: “${lastText}” |`);
}

out(
  '',
  '## Suggested test scenarios',
  '',
  '| Log in as | Try this |',
  '| --- | --- |',
  `| ${name('mark')} | Has the most going on: ${friendsOf('mark').length} friends, ${incoming('mark').length} incoming friend requests (${list(incoming('mark'))}), ` +
    `a request waiting on ${first('diego')}, unread messages from ${first('omar')} and ${first('liam')}, and a ${conversations.find((c) => c.between.join() === 'mark,chloe').messages.length}-message thread with ${first('chloe')} for scrolling. |`,
  `| ${name('mark')} + ${name('omar')} | Open two browsers (normal + private window), log in as both, and chat: check live delivery, typing indicator, online dot and “Seen”. |`,
  `| ${name('emma')} | Has a pending request to ${first('mark')}; log in as ${first('mark')} in another window and accept it to see both sides update. |`,
  `| ${name('ben')} | New user with no friends and two unanswered requests — check empty feed, empty inbox and that profiles show limited info. |`,
  `| ${name('sara')} | Unread message from ${first('olivia')} and an incoming request from ${first('noah')}. |`,
  `| ${name('lucas')} | Search for “football” or “chess” to find people by interest. |`,
  `| Any non-friend | Visit a stranger’s profile (e.g. ${first('mark')} → /profile/${byKey.diego.id}): only name and hometown are visible, and you can’t write on the wall or message them. |`,
  ''
);

fs.mkdirSync(new URL('../../docs/', import.meta.url), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'));
console.log(`Wrote ${OUT}`);
