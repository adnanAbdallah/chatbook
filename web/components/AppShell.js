'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from './SessionProvider';

function Badge({ n }) {
  return n > 0 ? <span className="badge">{n}</span> : null;
}

/** Page frame for logged-in pages: blue top bar, left nav, content. Sends guests to the login page. */
export default function AppShell({ children }) {
  const { user, ready, logout, counts } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState('');

  useEffect(() => {
    if (ready && !user) router.replace('/');
  }, [ready, user, router]);

  if (!user) return <div className="loading">Loading…</div>;

  const nav = [
    ['/', 'Home'],
    [`/profile/${user.id}`, 'My Profile'],
    ['/friends', 'My Friends', counts.friendRequests],
    ['/messages', 'My Messages', counts.unreadMessages],
    ['/edit-profile', 'Edit Profile'],
  ];

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="logo">[ chatbook ]</Link>
          <nav className="toplinks">
            <Link href="/">home</Link>
            <Link href="/search">search</Link>
            <Link href="/friends">friends</Link>
            <Link href="/messages">messages</Link>
            <button
              className="linklike"
              onClick={() => {
                logout();
                router.replace('/');
              }}
            >
              logout
            </button>
          </nav>
        </div>
      </header>
      <div className="page">
        <aside className="sidenav">
          <form
            className="quicksearch"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <input placeholder="quick search" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <ul>
            {nav.map(([href, label, n]) => (
              <li key={href}>
                <Link href={href} className={pathname === href ? 'active' : ''}>
                  {label} <Badge n={n} />
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <main className="content">{children}</main>
      </div>
      <footer className="footer">chatbook © 2026 · a Next.js + Node.js demo</footer>
    </>
  );
}
