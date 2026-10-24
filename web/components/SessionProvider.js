'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, api, getToken, setToken } from '@/lib/api';

const SessionContext = createContext(null);

export const useSession = () => useContext(SessionContext);

/** Holds the logged-in user, the realtime socket, online friends and header badge counts. */
export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [counts, setCounts] = useState({ friendRequests: 0, unreadMessages: 0 });

  useEffect(() => {
    if (!getToken()) return setReady(true);
    api('/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const refreshCounts = useCallback(() => {
    api('/me/counts').then(setCounts).catch(() => {});
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const s = io(API_URL, { auth: { token: getToken() } });
    s.on('presence:list', (ids) => setOnlineIds(new Set(ids)));
    s.on('presence', ({ userId: id, online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        online ? next.add(id) : next.delete(id);
        return next;
      })
    );
    s.on('message:new', refreshCounts);
    s.on('messages:read', refreshCounts);
    s.on('friends:changed', refreshCounts);
    setSocket(s);
    refreshCounts();
    return () => {
      s.disconnect();
      setSocket(null);
      setOnlineIds(new Set());
    };
  }, [userId, refreshCounts]);

  const login = useCallback((token, u) => {
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{ user, setUser, ready, login, logout, socket, onlineIds, counts, refreshCounts }}
    >
      {children}
    </SessionContext.Provider>
  );
}
