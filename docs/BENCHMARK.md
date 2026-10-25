# Benchmark

A small, **sequential** benchmark of the API and chat: one client, one request at a time, about 150 operations. It answers "how long does each kind of request take?", so you can compare before and after a change such as caching or async password hashing. It does **not** simulate many simultaneous users.

Code: [`bench/bench.js`](../bench/bench.js)

## Run it

```bash
npm run bench
```

By default it:

1. Seeds a throwaway database at `server/data/bench.db` (git-ignored) with the [test accounts](TEST_ACCOUNTS.md).
2. Starts a private copy of the server on port **4100** using that database, so your dev server (port 4000) and its data are never touched.
3. Logs in as Mark and Omar and measures the operations below, one at a time.
4. Prints a table and stops the private server.

Options (pass them after `--`):

| Option | Default | Meaning |
| --- | --- | --- |
| `--rounds <n>` | `20` | Requests per endpoint and chat messages sent (1–50) |
| `--json <file>` | — | Also save results as JSON (`bench/results/` is git-ignored) |
| `--api <url>` | — | Benchmark an already-running **local** server that has the seeded accounts, instead of starting one |

Example: save a baseline, make a change, then save again and compare.

```bash
npm run bench -- --json bench/results/before.json
```

```bash
npm run bench -- --json bench/results/after.json
```

## What it measures

| Row | Operations | What it covers |
| --- | --: | --- |
| `POST /auth/login` | 5 | Login, including bcrypt password check |
| `GET /me` | 20 | Token check + one user lookup (cheapest authenticated request) |
| `GET /feed` | 20 | Friend ids + news feed query with joins |
| `GET /conversations` | 20 | Inbox query (grouping + unread counts) |
| `GET /messages/:id` | 20 | Chat history + marking messages read (a write) |
| `GET /users?q=a` | 20 | `LIKE` search across name, hometown, interests |
| `socket connect (2 users)` | 1 | Opening two Socket.io connections |
| `message:send ack` | 20 | Mark sends → server checks friendship, inserts, acknowledges |
| `message delivery` | 20 | Same message arriving at Omar's socket |

Columns are in milliseconds: `avg`, `p50` (median), `p95` (95% of requests were at least this fast) and `max`. With only 20 samples per row, p95 is effectively the slowest one or two requests, so a single hiccup can move it. Compare `avg` and `p50` first.

## Baseline

Recorded on 2026-10-24 on the development machine (Node 22.22.1, seeded data, 20 rounds), before any caching or async hashing:

| Operation | n | avg | p50 | p95 | max |
| --- | --: | --: | --: | --: | --: |
| POST /auth/login | 5 | 107.76 | 97.95 | 145.75 | 145.75 |
| GET /me | 20 | 2.79 | 2.64 | 4.36 | 4.36 |
| GET /feed | 20 | 2.96 | 2.79 | 3.9 | 3.9 |
| GET /conversations | 20 | 3.79 | 3.94 | 4.91 | 4.91 |
| GET /messages/:id | 20 | 4.54 | 3.34 | 24.94 | 24.94 |
| GET /users?q=a | 20 | 4.41 | 4.29 | 6.62 | 6.62 |
| socket connect (2 users) | 1 | 90.63 | 90.63 | 90.63 | 90.63 |
| message:send ack | 20 | 5.01 | 4.42 | 14.06 | 14.06 |
| message delivery | 20 | 4.55 | 3.83 | 12.68 | 12.68 |

Run-to-run variation is normal: an earlier run on the same machine had login at ~116 ms average and chat delivery at ~1.4 ms. Compare runs made close together on the same machine.

## What the baseline tells us

- **Login is the slowest operation by far** (~100–200 ms). The time goes into `bcrypt.compareSync`, which is deliberately slow *and* synchronous, so it blocks the whole server — including chat — while it runs. Switching to async `bcrypt.compare` (which runs off the main thread) is the highest-value change.
- **Everything else takes a few milliseconds.** At this data size the SQLite queries are already fast, so caching (friendship checks, user lookups) would save roughly 1–2 ms per request. It becomes worthwhile with much larger data or traffic; use this benchmark to confirm the gain before keeping it.
- **Chat round-trips are a few milliseconds** from send to delivery.

## Limits

- Sequential and single-client: it shows the cost of each request, not how the server behaves when many requests arrive together.
- Small dataset (20 users, ~80 messages); query times grow with data.
- Results depend on the machine and on what else is running.
