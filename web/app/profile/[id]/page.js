'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import FriendButton from '@/components/FriendButton';
import { useSession } from '@/components/SessionProvider';
import { PostComposer, PostList } from '@/components/Wall';
import { api } from '@/lib/api';

const INFO = [
  ['sex', 'Sex'],
  ['birthday', 'Birthday'],
  ['hometown', 'Hometown'],
  ['relationship_status', 'Relationship Status'],
  ['interests', 'Interests'],
  ['about_me', 'About Me'],
];

function Profile({ id }) {
  const { onlineIds } = useSession();
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setProfile(null);
    setError('');
    Promise.all([api(`/users/${id}`), api(`/users/${id}/friends`), api(`/users/${id}/wall`)])
      .then(([p, f, w]) => {
        setProfile(p);
        setFriends(f.friends);
        setPosts(w.posts);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!profile) return <p className="muted">Loading…</p>;

  const { user, relationship, friendCount } = profile;
  const canPost = relationship === 'self' || relationship === 'friends';
  const info = INFO.filter(([key]) => user[key]);

  return (
    <div className="profile">
      <div className="profile-left">
        <section className="box">
          <div className="box-body center">
            <Avatar user={user} size={160} />
            <div className="profile-actions">
              {relationship === 'self' ? (
                <Link className="btn btn-gray" href="/edit-profile">Edit My Profile</Link>
              ) : (
                <>
                  <FriendButton
                    userId={user.id}
                    relationship={relationship}
                    onChange={(rel) => setProfile((p) => ({ ...p, relationship: rel }))}
                  />
                  {relationship === 'friends' && (
                    <Link className="btn" href={`/messages/${user.id}`}>Send Message</Link>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
        <section className="box">
          <h2 className="box-title">Friends ({friendCount})</h2>
          <div className="box-body friend-grid">
            {friends.length === 0 && <p className="muted">No friends yet.</p>}
            {friends.slice(0, 9).map((f) => (
              <Link key={f.id} href={`/profile/${f.id}`} className="friend-tile">
                <Avatar user={f} size={50} online={onlineIds.has(f.id)} />
                <span>{f.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="profile-right">
        <section className="box">
          <h2 className="box-title">
            {user.name}
            {onlineIds.has(user.id) && <span className="online-label"> · online now</span>}
          </h2>
          <div className="box-body">
            <h3 className="subhead">Information</h3>
            {info.length ? (
              <table className="info">
                <tbody>
                  {info.map(([key, label]) => (
                    <tr key={key}>
                      <th>{label}:</th>
                      <td>{user[key]}</td>
                    </tr>
                  ))}
                  <tr>
                    <th>Member Since:</th>
                    <td>{new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="muted">
                {relationship === 'self' || relationship === 'friends'
                  ? 'No information yet.'
                  : `Only ${user.name.split(' ')[0]}’s friends can see the full profile.`}
              </p>
            )}
          </div>
        </section>

        <section className="box">
          <h2 className="box-title">The Wall</h2>
          <div className="box-body">
            {canPost && (
              <PostComposer
                wallUserId={user.id}
                placeholder={relationship === 'self' ? 'What are you doing right now?' : `Write something on ${user.name.split(' ')[0]}’s wall…`}
                onPosted={(p) => setPosts((prev) => [p, ...prev])}
              />
            )}
            <PostList
              posts={posts}
              onDeleted={(pid) => setPosts((prev) => prev.filter((p) => p.id !== pid))}
              emptyText="No one has written on this wall yet."
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  const { id } = useParams();
  return (
    <AppShell>
      <Profile id={Number(id)} />
    </AppShell>
  );
}
