import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { CLIENT_ORIGIN, PORT } from './config.js';
import { attachRealtime } from './realtime.js';
import { router } from './routes.js';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api', router);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong.' });
});

const server = http.createServer(app);
attachRealtime(server);
server.listen(PORT, () => console.log(`Chatbook API listening on http://localhost:${PORT}`));
