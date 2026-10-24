'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Landing from '@/components/AuthForms';
import Avatar from '@/components/Avatar';
import { useSession } from '@/components/SessionProvider';
import { PostComposer, PostList } from '@/components/Wall';
import { api } from '@/lib/api';

function Home() {
  const { user, socket, onlineIds } = useSession();
  const [posts, setPosts] = useState(null);
  const [friends, setFriends] = useState([]);

  const loadFeed = useCallback(() => {
    api('/feed').then((d) => setPosts(d.posts)).catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    loadFeed();
    api('/friends').then((d) => setFriends(d.friends)).catch(() => {});
  }, [loadFeed]);

  useEffect(() => {
    if (!socket) return;
    socket.on('wall:new', loadFeed);
    return () => socket.off('wall:new', loadFeed);
  }, [socket, loadFeed]);

  const online = friends.filter((f) => onlineIds.has(f.id));

  return (
    <div className="two-col">
      <div>
        <section className="box">
          <h2 className="box-title">News Feed</h2>
          <div className="box-body">
            <PostComposer
              wallUserId={user.id}
              placeholder={`What are you doing right now, ${user.name.split(' ')[0]}?`}
              onPosted={(p) => setPosts((prev) => [p, ...(prev || [])])}
            />
            {posts === null ? (
              <p className="muted">Loading…</p>
            ) : (
              <PostList
                posts={posts}
                onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                emptyText="Your feed is empty. Find some friends and write on their walls!"
              />
            )}
          </div>
        </section>
      </div>
      <div>
        <section className="box">
          <h2 className="box-title">Online Friends ({online.length})</h2>
          <div className="box-body">
            {online.length === 0 && <p className="muted">None of your friends are online.</p>}
            <ul className="mini-list">
              {online.map((f) => (
                <li key={f.id}>
                  <Link href={`/messages/${f.id}`}>
                    <Avatar user={f} size={28} online /> {f.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section className="box">
          <h2 className="box-title">Quick Links</h2>
          <div className="box-body">
            <ul className="bullets">
              <li><Link href="/search">Find people you know</Link></li>
              <li><Link href={`/profile/${user.id}`}>View my wall</Link></li>
              <li><Link href="/edit-profile">Edit my profile</Link></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  const { user, ready } = useSession();
  if (!ready) return <div className="loading">Loading…</div>;
  if (!user) return <Landing />;
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}
