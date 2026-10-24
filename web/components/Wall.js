'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, timeAgo } from '@/lib/api';
import Avatar from './Avatar';
import { useSession } from './SessionProvider';

export function PostComposer({ wallUserId, placeholder, onPosted }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { post } = await api(`/users/${wallUserId}/wall`, { method: 'POST', body: { body } });
      setBody('');
      onPosted(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholder} rows={3} maxLength={1000} />
      {error && <div className="error">{error}</div>}
      <div className="composer-actions">
        <button className="btn" disabled={busy || !body.trim()}>Post</button>
      </div>
    </form>
  );
}

export function PostList({ posts, onDeleted, emptyText = 'Nothing here yet.' }) {
  const { user } = useSession();

  async function remove(id) {
    if (!confirm('Delete this post?')) return;
    await api(`/posts/${id}`, { method: 'DELETE' });
    onDeleted(id);
  }

  if (!posts.length) return <p className="muted">{emptyText}</p>;
  return (
    <ul className="posts">
      {posts.map((p) => {
        const author = { id: p.author_id, name: p.author_name };
        const onOtherWall = p.author_id !== p.wall_user_id;
        return (
          <li key={p.id} className="post">
            <Link href={`/profile/${p.author_id}`}><Avatar user={author} size={40} /></Link>
            <div className="post-body">
              <div className="post-head">
                <Link href={`/profile/${p.author_id}`}>{p.author_name}</Link>
                {onOtherWall && (
                  <>
                    {' wrote on '}
                    <Link href={`/profile/${p.wall_user_id}`}>{p.wall_user_name}</Link>
                    {'’s wall'}
                  </>
                )}
              </div>
              <p>{p.body}</p>
              <div className="post-meta">
                {timeAgo(p.created_at)}
                {(p.author_id === user.id || p.wall_user_id === user.id) && (
                  <> · <button className="linklike" onClick={() => remove(p.id)}>delete</button></>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
