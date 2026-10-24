'use client';

import { useState } from 'react';
import AppShell from '@/components/AppShell';
import { useSession } from '@/components/SessionProvider';
import { api } from '@/lib/api';

function EditProfile() {
  const { user, setUser } = useSession();
  const [status, setStatus] = useState('');

  async function save(e) {
    e.preventDefault();
    setStatus('');
    try {
      const { user: updated } = await api('/me', { method: 'PUT', body: Object.fromEntries(new FormData(e.currentTarget)) });
      setUser(updated);
      setStatus('Your changes have been saved.');
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <section className="box">
      <h2 className="box-title">Edit My Profile</h2>
      <form className="box-body form wide" onSubmit={save}>
        <label>Full name<input name="name" defaultValue={user.name} required minLength={2} maxLength={60} /></label>
        <label>
          Sex
          <select name="sex" defaultValue={user.sex}>
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </label>
        <label>Birthday<input name="birthday" type="date" defaultValue={user.birthday} /></label>
        <label>Hometown<input name="hometown" defaultValue={user.hometown} maxLength={100} /></label>
        <label>
          Relationship status
          <select name="relationship_status" defaultValue={user.relationship_status}>
            <option value="">—</option>
            <option>Single</option>
            <option>In a relationship</option>
            <option>Engaged</option>
            <option>Married</option>
            <option>It&apos;s complicated</option>
          </select>
        </label>
        <label>Interests<input name="interests" defaultValue={user.interests} maxLength={300} /></label>
        <label>About me<textarea name="about_me" defaultValue={user.about_me} rows={4} maxLength={1000} /></label>
        {status && <div className="notice">{status}</div>}
        <button className="btn">Save Changes</button>
      </form>
    </section>
  );
}

export default function Page() {
  return (
    <AppShell>
      <EditProfile />
    </AppShell>
  );
}
