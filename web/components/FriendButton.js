'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from './SessionProvider';

/** Shows the right friend action for a relationship and reports the new relationship. */
export default function FriendButton({ userId, relationship, onChange }) {
  const { refreshCounts } = useSession();
  const [busy, setBusy] = useState(false);

  async function act(path, method) {
    setBusy(true);
    try {
      const res = await api(`/friends/${userId}${path}`, { method });
      onChange(res.relationship);
      refreshCounts();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  switch (relationship) {
    case 'none':
      return <button className="btn" disabled={busy} onClick={() => act('/request', 'POST')}>Add as Friend</button>;
    case 'request_sent':
      return <button className="btn btn-gray" disabled={busy} onClick={() => act('', 'DELETE')}>Cancel Request</button>;
    case 'request_received':
      return (
        <span className="btn-row">
          <button className="btn" disabled={busy} onClick={() => act('/accept', 'POST')}>Confirm Friend</button>
          <button className="btn btn-gray" disabled={busy} onClick={() => act('', 'DELETE')}>Ignore</button>
        </span>
      );
    case 'friends':
      return (
        <button
          className="btn btn-gray"
          disabled={busy}
          onClick={() => confirm('Remove this friend?') && act('', 'DELETE')}
        >
          Remove Friend
        </button>
      );
    default:
      return null;
  }
}
