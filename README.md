# chatbook

A small social network in the spirit of the earliest social sites, with real-time chat between friends.

- **web/** – Next.js (App Router, React 19) frontend on http://localhost:3000
- **server/** – Node.js backend: Express REST API + Socket.io realtime + SQLite (Node's built-in `node:sqlite`, no DB server needed) on http://localhost:4000

## Features

- Sign up / log in (bcrypt-hashed passwords, JWT sessions)
- Profiles with info (sex, birthday, hometown, relationship status, interests, about me) – full info visible to friends only
- Friend requests: send, confirm, ignore, cancel, unfriend
- The Wall: write on your own wall or your friends' walls
- News Feed of your and your friends' wall activity
- Search people by name, hometown or interest
- Real-time 1:1 chat between friends: online presence, typing indicator, unread badges, "Seen" receipts

## Requirements

Node.js 22.13 or newer (for `node:sqlite`).

## Run it

```bash
npm run install:all
```

```bash
npm run seed
```

```bash
npm run dev
```

Then open http://localhost:3000. `npm run seed` wipes the database and creates demo users (`mark@`, `sara@`, `omar@`, `emma@chatbook.test`); their shared password is `DEMO_PASSWORD` in `server/src/seed.js`. Log in as two different users in two browsers (or a normal + private window) to chat with yourself.

## Configuration

| Variable | Where | Default |
| --- | --- | --- |
| `PORT` | server | `4000` |
| `CLIENT_ORIGIN` | server | `http://localhost:3000` (comma-separated list allowed) |
| `JWT_SECRET` | server | `dev-secret-change-me` – **set this in production** |
| `DB_PATH` | server | `server/data/chatbook.db` |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:4000` |
