# Architecture

Chatbook is a small social network in the style of the earliest social sites: profiles, friends, walls, a news feed and real-time 1:1 chat between friends. It is split into two independent apps that talk over HTTP and WebSockets.

| Part | Folder | Runs on | Docs |
| --- | --- | --- | --- |
| Frontend (Next.js) | [`web/`](../web) | http://localhost:3000 | [FRONTEND.md](FRONTEND.md) |
| Backend REST API (Express) | [`server/`](../server) | http://localhost:4000/api | [BACKEND.md](BACKEND.md) |
| Realtime (Socket.io) | [`server/src/realtime.js`](../server/src/realtime.js) | ws://localhost:4000 | [REALTIME.md](REALTIME.md) |
| Database (SQLite) | `server/data/chatbook.db` | in-process | [DATABASE.md](DATABASE.md) |
| Test data | [`server/src/seed-data.js`](../server/src/seed-data.js) | `npm run seed` | [TEST_ACCOUNTS.md](TEST_ACCOUNTS.md) |

## Tech stack

| Layer | Technology | Version | Why |
| --- | --- | --- | --- |
| Runtime | Node.js | ≥ 22.13 (dev: 22.22) | Runs both apps; provides the built-in `node:sqlite` module |
| Frontend framework | [Next.js](https://nextjs.org) (App Router, Turbopack) | 16.4 | Routing, dev server, production build |
| UI library | React | 19.3 | Components and state |
| Realtime client | socket.io-client | 4.8 | WebSocket connection to the backend |
| Styling | Plain CSS ([`globals.css`](../web/app/globals.css)) | — | One stylesheet, retro blue look, no CSS framework |
| HTTP server | [Express](https://expressjs.com) | 5.3 | REST API, JSON parsing, error handling |
| Realtime server | [Socket.io](https://socket.io) | 4.8 | Chat, presence, typing, notifications |
| Database | SQLite via `node:sqlite` (`DatabaseSync`) | built into Node | Zero-setup file database, synchronous queries |
| Password hashing | bcryptjs | 3.0 | Pure-JS bcrypt, no native build |
| Auth tokens | jsonwebtoken (JWT, HS256) | 9.0 | Stateless sessions, 7-day expiry |
| CORS | cors | 2.8 | Lets the frontend on :3000 call the API on :4000 |
| Dev tooling | concurrently | 9.2 | `npm run dev` starts both apps in one terminal |

Everything is plain JavaScript (ES modules on the server, JSX in the web app); there is no TypeScript or build step on the server.

## Repository layout

```
chat application/
├── package.json            # root scripts: install:all, dev, seed, docs:accounts, bench
├── bench/bench.js          # small sequential benchmark (npm run bench)
├── README.md               # quick start
├── docs/                   # ← you are here
├── server/                 # Node.js backend
│   ├── package.json
│   ├── data/               # SQLite file (git-ignored, created on first run)
│   └── src/
│       ├── index.js        # entry: Express app + HTTP server + Socket.io
│       ├── config.js       # env-based settings (port, origin, secret, db path)
│       ├── db.js           # opens SQLite, creates tables, user helpers
│       ├── auth.js         # JWT sign/verify, requireAuth middleware
│       ├── social.js       # friendship queries, input validation, httpError
│       ├── routes.js       # all REST endpoints under /api
│       ├── realtime.js     # Socket.io: chat, presence, typing, emitToUser
│       ├── seed-data.js    # demo accounts, friendships, posts, messages
│       ├── seed.js         # wipes + fills the database from seed-data.js
│       └── gen-accounts-doc.js  # writes docs/TEST_ACCOUNTS.md
└── web/                    # Next.js frontend
    ├── package.json
    ├── next.config.mjs     # pins Turbopack root to web/
    ├── jsconfig.json       # "@/..." import alias
    ├── lib/api.js          # fetch wrapper, token storage, timeAgo
    ├── components/         # SessionProvider, AppShell, Inbox, Wall, ...
    └── app/                # routes (one folder per URL)
```

## System overview

```mermaid
flowchart LR
    subgraph Browser["Browser (localhost:3000)"]
        UI["Next.js pages<br/>(React client components)"]
        SP["SessionProvider<br/>user · socket · online friends · badge counts"]
        LS[("localStorage<br/>JWT token")]
        UI --> SP
        SP <--> LS
    end

    subgraph Server["Node.js server (localhost:4000)"]
        EX["Express<br/>REST API /api/*"]
        AUTH["auth.js<br/>JWT verify"]
        IO["Socket.io<br/>realtime.js"]
        SOC["social.js<br/>friendship rules"]
        DB[("SQLite<br/>server/data/chatbook.db")]
        EX --> AUTH
        IO --> AUTH
        EX --> SOC
        IO --> SOC
        EX --> DB
        IO --> DB
        SOC --> DB
        EX -- "emitToUser()<br/>notifications" --> IO
    end

    UI -- "HTTP JSON<br/>Authorization: Bearer token" --> EX
    SP <-- "WebSocket<br/>auth: { token }" --> IO
```

Two channels connect the apps:

- **REST (HTTP + JSON)** for everything that reads or changes data on request: auth, profiles, friends, walls, feed, conversation history.
- **Socket.io (WebSocket)** for things that must arrive without a page refresh: new chat messages, read receipts, typing, friends coming online/offline, and "something changed" nudges after friend requests or wall posts.

Chat messages are *sent* over the socket (with an acknowledgement) and *loaded* over REST.

## How the software works

### Page load and login

```mermaid
flowchart TD
    A([User opens localhost:3000]) --> B{JWT in localStorage?}
    B -- No --> L[Show landing page<br/>Login + Sign Up forms]
    B -- Yes --> C[GET /api/me]
    C -- 200 --> E[Set user in SessionProvider]
    C -- 401 --> D[Delete token] --> L
    L --> F[POST /api/auth/login or /register]
    F -- error --> G[Show error under the form] --> L
    F -- "{ token, user }" --> H[Save token to localStorage] --> E
    E --> I[Open Socket.io connection with token]
    I --> J[Server sends presence:list<br/>= online friends]
    E --> K[GET /api/me/counts<br/>badges: friend requests, unread messages]
    J --> M([Logged-in pages render:<br/>News Feed, profile, friends, messages])
    K --> M
```

### What a user can do

```mermaid
flowchart TD
    Home([News Feed]) --> Post[Write a status update<br/>POST /api/users/:me/wall]
    Home --> Search[Search people<br/>GET /api/users?q=]
    Search --> Profile[View profile<br/>GET /api/users/:id + /friends + /wall]
    Profile --> Rel{Relationship?}
    Rel -- none --> Add[Add as Friend<br/>POST /api/friends/:id/request]
    Rel -- request_received --> Accept[Confirm<br/>POST /api/friends/:id/accept]
    Rel -- request_sent --> Cancel[Cancel<br/>DELETE /api/friends/:id]
    Rel -- friends --> Wall[Write on their wall<br/>POST /api/users/:id/wall]
    Rel -- friends --> Chat[Send Message<br/>/messages/:id]
    Rel -- friends --> Unfriend[Remove Friend<br/>DELETE /api/friends/:id]
    Add -. "socket: friends:changed" .-> Other([Other user's badge updates])
    Accept -. "socket: friends:changed + presence" .-> Other
    Wall -. "socket: wall:new" .-> Other
    Chat --> Send[Type + Send<br/>socket: message:send]
    Send -. "socket: message:new" .-> Other
```

### Sending a chat message (end to end)

```mermaid
sequenceDiagram
    autonumber
    participant A as Mark's browser
    participant S as Server (Socket.io)
    participant DB as SQLite
    participant B as Omar's browser

    A->>S: emit typing { to: Omar }
    S->>S: areFriends(Mark, Omar)?
    S-->>B: typing { from: Mark }
    Note over B: shows "Mark is typing…" for 3s
    A->>S: emit message:send { to: Omar, body } (with ack)
    S->>S: areFriends? cleanBody (1–2000 chars)
    S->>DB: INSERT INTO messages
    S-->>B: message:new (room user:Omar)
    S-->>A: message:new (room user:Mark, all Mark's tabs)
    S-->>A: ack { message }
    Note over B: chat open with Mark → append bubble
    B->>S: emit messages:read { from: Mark } (with ack)
    S->>DB: UPDATE messages SET read_at
    S-->>A: messages:read { by: Omar }
    Note over A: shows "Seen" under last message
    S-->>B: ack → refresh badges + conversation list
```

More detail on each step is in [REALTIME.md](REALTIME.md).

## Security model (in short)

- Passwords are hashed with bcrypt (10 rounds); hashes are never sent to clients (`publicUser()` strips them).
- Every `/api/*` route except register/login requires `Authorization: Bearer <JWT>`; sockets require the same token in the handshake.
- Friendship rules are enforced on the server, not only in the UI: only friends can chat or write on each other's walls, and non-friends see a reduced profile (name + hometown).
- Inputs are length-limited (posts 1000 chars, messages 2000, JSON body 100 KB) and SQL uses prepared statements throughout.
- **Before deploying:** set `JWT_SECRET`, put the API behind HTTPS, and set `CLIENT_ORIGIN` / `NEXT_PUBLIC_API_URL` to the real hosts. There is no rate limiting or email verification yet.
