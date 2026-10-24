'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import FriendButton from '@/components/FriendButton';
import { useSession } from '@/components/SessionProvider';
import { api } from '@/lib/api';

function PersonRow({ person, online, children }) {
  return (
    <li className="person">
      <Link href={`/profile/${person.id}`}><Avatar user={person} size={50} online={online} /></Link>
      <div className="person-info">
        <Link href={`/profile/${person.id}`}><strong>{person.name}</strong></Link>
        {person.hometown && <div className="muted">{person.hometown}</div>}
      </div>
      <div className="person-actions">{children}</div>
    </li>
  );
}

function Friends() {
  const { socket, onlineIds } = useSession();
  const [friends, setFriends] = useState(null);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });

  const load = useCallback(() => {
    api('/friends').then((d) => setFriends(d.friends)).catch(() => setFriends([]));
    api('/friends/requests').then(setRequests).catch(() => {});
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!socket) return;
    socket.on('friends:changed', load);
    return () => socket.off('friends:changed', load);
  }, [socket, load]);

  return (
    <>
      {requests.incoming.length > 0 && (
        <section className="box">
          <h2 className="box-title">Friend Requests ({requests.incoming.length})</h2>
          <ul className="box-body people">
            {requests.incoming.map((p) => (
              <PersonRow key={p.id} person={p}>
                <FriendButton userId={p.id} relationship="request_received" onChange={load} />
              </PersonRow>
            ))}
          </ul>
        </section>
      )}

      <section className="box">
        <h2 className="box-title">My Friends {friends && `(${friends.length})`}</h2>
        <ul className="box-body people">
          {friends === null && <p className="muted">Loading…</p>}
          {friends?.length === 0 && (
            <p className="muted">You don&apos;t have any friends yet. <Link href="/search">Search for people you know.</Link></p>
          )}
          {friends?.map((f) => (
            <PersonRow key={f.id} person={f} online={onlineIds.has(f.id)}>
              <Link className="btn" href={`/messages/${f.id}`}>Message</Link>
              <FriendButton userId={f.id} relationship="friends" onChange={load} />
            </PersonRow>
          ))}
        </ul>
      </section>

      {requests.outgoing.length > 0 && (
        <section className="box">
          <h2 className="box-title">Requests You Sent</h2>
          <ul className="box-body people">
            {requests.outgoing.map((p) => (
              <PersonRow key={p.id} person={p}>
                <FriendButton userId={p.id} relationship="request_sent" onChange={load} />
              </PersonRow>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Friends />
    </AppShell>
  );
}
