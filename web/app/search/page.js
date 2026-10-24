'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import FriendButton from '@/components/FriendButton';
import { api } from '@/lib/api';

function Search() {
  const router = useRouter();
  const q = useSearchParams().get('q') || '';
  const [input, setInput] = useState(q);
  const [results, setResults] = useState(null);

  useEffect(() => {
    setInput(q);
    if (!q) return setResults(null);
    api(`/users?q=${encodeURIComponent(q)}`).then((d) => setResults(d.users)).catch(() => setResults([]));
  }, [q]);

  const setRel = (id, rel) => setResults((rs) => rs.map((u) => (u.id === id ? { ...u, relationship: rel } : u)));

  return (
    <section className="box">
      <h2 className="box-title">Search</h2>
      <div className="box-body">
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/search?q=${encodeURIComponent(input.trim())}`);
          }}
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Name, hometown or interest" autoFocus />
          <button className="btn">Search</button>
        </form>
        {results?.length === 0 && <p className="muted">No one matched &ldquo;{q}&rdquo;.</p>}
        <ul className="people">
          {results?.map((u) => (
            <li key={u.id} className="person">
              <Link href={`/profile/${u.id}`}><Avatar user={u} size={50} /></Link>
              <div className="person-info">
                <Link href={`/profile/${u.id}`}><strong>{u.name}</strong></Link>
                {u.hometown && <div className="muted">{u.hometown}</div>}
              </div>
              <div className="person-actions">
                {u.relationship === 'self' ? (
                  <span className="muted">That&apos;s you!</span>
                ) : (
                  <FriendButton userId={u.id} relationship={u.relationship} onChange={(rel) => setRel(u.id, rel)} />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <AppShell>
      <Suspense fallback={<p className="muted">Loading…</p>}>
        <Search />
      </Suspense>
    </AppShell>
  );
}
