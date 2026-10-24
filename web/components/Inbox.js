'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import Avatar from './Avatar';
import { useSession } from './SessionProvider';

function ConversationList({ activeId, version }) {
  const { socket, onlineIds, user } = useSession();
  const [conversations, setConversations] = useState(null);
  const [friends, setFriends] = useState([]);

  const load = useCallback(() => {
    api('/conversations').then((d) => setConversations(d.conversations)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    api('/friends').then((d) => setFriends(d.friends)).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    socket.on('message:new', load);
    socket.on('messages:read', load);
    return () => {
      socket.off('message:new', load);
      socket.off('messages:read', load);
    };
  }, [socket, load]);

  // Re-fetch once the open conversation has been marked read, so its unread count clears.
  useEffect(() => {
    if (version) load();
  }, [version, load]);

  const talkedTo = new Set((conversations || []).map((c) => c.partner_id));
  const others = friends.filter((f) => !talkedTo.has(f.id));

  return (
    <div className="convo-list">
      <h3 className="subhead">Conversations</h3>
      {conversations === null && <p className="muted pad">Loading…</p>}
      {conversations?.length === 0 && <p className="muted pad">No messages yet.</p>}
      {conversations?.map((c) => (
        <Link key={c.partner_id} href={`/messages/${c.partner_id}`} className={`convo ${c.partner_id === activeId ? 'active' : ''}`}>
          <Avatar user={{ id: c.partner_id, name: c.partner_name }} size={36} online={onlineIds.has(c.partner_id)} />
          <span className="convo-text">
            <strong>{c.partner_name}</strong>
            <span className="muted ellipsis">{c.sender_id === user.id ? 'You: ' : ''}{c.body}</span>
          </span>
          {c.unread > 0 && <span className="badge">{c.unread}</span>}
        </Link>
      ))}
      {others.length > 0 && (
        <>
          <h3 className="subhead">Start a chat</h3>
          {others.map((f) => (
            <Link key={f.id} href={`/messages/${f.id}`} className={`convo ${f.id === activeId ? 'active' : ''}`}>
              <Avatar user={f} size={36} online={onlineIds.has(f.id)} />
              <span className="convo-text"><strong>{f.name}</strong></span>
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

function ChatWindow({ partnerId, onSeen }) {
  const { socket, onlineIds, user, refreshCounts } = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    setData(null);
    setError('');
    api(`/messages/${partnerId}`)
      .then((d) => {
        setData(d);
        refreshCounts();
        onSeen();
      })
      .catch((err) => setError(err.message));
  }, [partnerId, refreshCounts, onSeen]);

  useEffect(() => {
    if (!socket) return;
    let typingTimer;
    const onMessage = (m) => {
      const involvesPartner = m.sender_id === partnerId || m.recipient_id === partnerId;
      if (!involvesPartner) return;
      setData((d) => (d && !d.messages.some((x) => x.id === m.id) ? { ...d, messages: [...d.messages, m] } : d));
      if (m.sender_id === partnerId) {
        setTyping(false);
        socket.emit('messages:read', { from: partnerId }, () => {
          refreshCounts();
          onSeen();
        });
      }
    };
    const onRead = ({ by }) => {
      if (by !== partnerId) return;
      setData((d) => d && { ...d, messages: d.messages.map((m) => (m.sender_id === user.id && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)) });
    };
    const onTyping = ({ from }) => {
      if (from !== partnerId) return;
      setTyping(true);
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => setTyping(false), 3000);
    };
    socket.on('message:new', onMessage);
    socket.on('messages:read', onRead);
    socket.on('typing', onTyping);
    return () => {
      clearTimeout(typingTimer);
      socket.off('message:new', onMessage);
      socket.off('messages:read', onRead);
      socket.off('typing', onTyping);
    };
  }, [socket, partnerId, user.id, refreshCounts, onSeen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages.length, typing]);

  function onChange(e) {
    setText(e.target.value);
    if (socket && Date.now() - lastTypingSent.current > 1500) {
      lastTypingSent.current = Date.now();
      socket.emit('typing', { to: partnerId });
    }
  }

  function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !socket) return;
    setText('');
    socket.emit('message:send', { to: partnerId, body }, (res) => {
      if (res.error) {
        setError(res.error);
        setText(body);
      }
    });
  }

  if (error && !data) return <div className="chat"><p className="error pad">{error}</p></div>;
  if (!data) return <div className="chat"><p className="muted pad">Loading…</p></div>;

  const { partner, messages, relationship } = data;
  const online = onlineIds.has(partner.id);
  const lastMine = [...messages].reverse().find((m) => m.sender_id === user.id);

  return (
    <div className="chat">
      <div className="chat-head">
        <Avatar user={partner} size={32} online={online} />
        <div>
          <Link href={`/profile/${partner.id}`}><strong>{partner.name}</strong></Link>
          <div className="muted">{online ? 'Online now' : 'Offline'}</div>
        </div>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && <p className="muted center">Say hi to {partner.name.split(' ')[0]}!</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble-row ${m.sender_id === user.id ? 'mine' : ''}`}>
            <div className="bubble" title={new Date(m.created_at).toLocaleString()}>{m.body}</div>
          </div>
        ))}
        {lastMine?.read_at && messages[messages.length - 1] === lastMine && <div className="seen">Seen</div>}
        {typing && <div className="typing">{partner.name.split(' ')[0]} is typing…</div>}
        <div ref={bottomRef} />
      </div>
      {relationship === 'friends' ? (
        <form className="chat-input" onSubmit={send}>
          <input value={text} onChange={onChange} placeholder="Write a message…" maxLength={2000} autoFocus />
          <button className="btn" disabled={!text.trim()}>Send</button>
        </form>
      ) : (
        <p className="muted pad">You need to be friends with {partner.name} to send messages.</p>
      )}
      {error && data && <p className="error pad">{error}</p>}
    </div>
  );
}

export default function Inbox({ partnerId }) {
  const [version, setVersion] = useState(0);
  const onSeen = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <section className="box">
      <h2 className="box-title">My Messages</h2>
      <div className="inbox">
        <ConversationList activeId={partnerId} version={version} />
        {partnerId ? (
          <ChatWindow key={partnerId} partnerId={partnerId} onSeen={onSeen} />
        ) : (
          <div className="chat empty">
            <p className="muted">Pick a conversation or a friend to start chatting.</p>
          </div>
        )}
      </div>
    </section>
  );
}
