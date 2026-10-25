// Small, sequential benchmark of the Chatbook API and chat.
// By default it seeds a throwaway database, starts a private server on port 4100,
// measures ~150 operations one at a time from a single client, then stops the server.
// Run from the repo root: npm run bench   (options: npm run bench -- --help)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { io } from 'socket.io-client';

const SERVER_DIR = fileURLToPath(new URL('../server/', import.meta.url));
const BENCH_DB = fileURLToPath(new URL('../server/data/bench.db', import.meta.url));
const BENCH_PORT = 4100;
const PASSWORD = 'password123'; // seeded test password, see server/src/seed-data.js

const { values: opts } = parseArgs({
  options: {
    rounds: { type: 'string', default: '20' },
    api: { type: 'string' },
    json: { type: 'string' },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (opts.help) {
  console.log(`Usage: npm run bench -- [options]

  --rounds <n>   requests per endpoint and chat messages sent (1-50, default 20)
  --api <url>    use an already-running local server instead of starting one
                 (it must contain the seeded test accounts)
  --json <file>  also save the results as JSON, e.g. to compare before/after a change`);
  process.exit(0);
}

const rounds = Number(opts.rounds);
if (!Number.isInteger(rounds) || rounds < 1 || rounds > 50) throw new Error('--rounds must be a whole number from 1 to 50');
if (opts.api && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/.test(opts.api)) {
  throw new Error('--api must point at a local server (localhost / 127.0.0.1)');
}
const API = (opts.api || `http://localhost:${BENCH_PORT}`).replace(/\/$/, '');

/* ---------- private server ---------- */

function runNode(script, env) {
  return spawn(process.execPath, ['--disable-warning=ExperimentalWarning', script], {
    cwd: SERVER_DIR,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

async function startPrivateServer() {
  const env = { DB_PATH: BENCH_DB, PORT: String(BENCH_PORT) };
  const seed = runNode('src/seed.js', env);
  const code = await new Promise((resolve) => seed.on('exit', resolve));
  if (code !== 0) throw new Error('Seeding the benchmark database failed');

  const server = runNode('src/index.js', env);
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) throw new Error(`Benchmark server exited (is port ${BENCH_PORT} already in use?)`);
    try {
      if ((await fetch(`${API}/health`)).ok) return server;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  server.kill();
  throw new Error('Benchmark server did not start within 5 seconds');
}

/* ---------- measuring ---------- */

async function call(path, { token, body } = {}) {
  const start = performance.now();
  const res = await fetch(`${API}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${data.error}`);
  return { ms: performance.now() - start, data };
}

const login = (who) => call('/auth/login', { body: { email: `${who}@chatbook.test`, password: PASSWORD } });

function connect(token) {
  return new Promise((resolve, reject) => {
    const socket = io(API, { auth: { token }, forceNew: true, transports: ['websocket'], reconnection: false });
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

function summarize(samples) {
  const v = [...samples].sort((a, b) => a - b);
  const at = (p) => v[Math.min(v.length - 1, Math.floor(p * v.length))];
  const round = (x) => Math.round(x * 100) / 100;
  return { n: v.length, avg: round(v.reduce((s, x) => s + x, 0) / v.length), p50: round(at(0.5)), p95: round(at(0.95)), max: round(v[v.length - 1]) };
}

async function measure() {
  const results = {};
  const record = (name, ms) => (results[name] ||= []).push(ms);

  // Logins are measured separately: password checking (bcrypt) dominates them.
  for (const who of ['mark', 'omar', 'sara', 'liam', 'emma']) record('POST /auth/login', (await login(who)).ms);
  const mark = (await login('mark')).data;
  const omar = (await login('omar')).data;

  await call('/me', { token: mark.token }); // warm-up, not measured

  const endpoints = [
    ['GET /me', '/me'],
    ['GET /feed', '/feed'],
    ['GET /conversations', '/conversations'],
    ['GET /messages/:id', `/messages/${omar.user.id}`],
    ['GET /users?q=a', '/users?q=a'],
  ];
  for (const [name, path] of endpoints) {
    for (let i = 0; i < rounds; i++) record(name, (await call(path, { token: mark.token })).ms);
  }

  const connectStart = performance.now();
  const markSocket = await connect(mark.token);
  const omarSocket = await connect(omar.token);
  record('socket connect (2 users)', performance.now() - connectStart);

  // One message at a time: wait for the ack and for Omar to receive it before sending the next.
  try {
    for (let i = 0; i < rounds; i++) {
      const sentAt = performance.now();
      const delivered = new Promise((resolve) => omarSocket.once('message:new', () => resolve(performance.now() - sentAt)));
      const ack = await new Promise((resolve) => markSocket.emit('message:send', { to: omar.user.id, body: `bench ${i}` }, resolve));
      if (ack.error) throw new Error(`message:send: ${ack.error}`);
      record('message:send ack', performance.now() - sentAt);
      record('message delivery', await delivered);
    }
  } finally {
    markSocket.disconnect();
    omarSocket.disconnect();
  }
  return results;
}

/* ---------- main ---------- */

const server = opts.api ? null : await startPrivateServer();
try {
  console.log(`Benchmarking ${API} — sequential, single client, ${rounds} rounds per endpoint\n`);
  const results = await measure();
  const summary = Object.fromEntries(Object.entries(results).map(([name, xs]) => [name, summarize(xs)]));
  const total = Object.values(results).reduce((n, xs) => n + xs.length, 0);

  console.table(summary);
  console.log(`${total} operations measured · times in ms`);

  if (opts.json) {
    // npm runs this script inside bench/, so resolve the path against where `npm run` was typed.
    const file = path.resolve(process.env.INIT_CWD || process.cwd(), opts.json);
    const report = { date: new Date().toISOString(), node: process.version, api: API, rounds, summary };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
    console.log(`Saved results to ${path.relative(process.env.INIT_CWD || process.cwd(), file)}`);
  }
} finally {
  server?.kill();
}
