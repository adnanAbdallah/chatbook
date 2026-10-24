export const PORT = Number(process.env.PORT) || 4000;
export const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',');
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
export const DB_PATH = process.env.DB_PATH || new URL('../data/chatbook.db', import.meta.url).pathname;
