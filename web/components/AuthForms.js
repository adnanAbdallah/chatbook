'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from './SessionProvider';

function useAuthSubmit(path) {
  const { login } = useSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      const { token, user } = await api(path, { method: 'POST', body });
      login(token, user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return { submit, error, busy };
}

/** Logged-out home page: welcome blurb, login box and sign-up form. */
export default function Landing() {
  const loginForm = useAuthSubmit('/auth/login');
  const registerForm = useAuthSubmit('/auth/register');

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="logo">[ chatbook ]</span>
        </div>
      </header>
      <div className="landing">
        <section className="box welcome">
          <h2 className="box-title">Welcome to Chatbook</h2>
          <div className="box-body">
            <p>Chatbook is an online directory that connects people through social networks.</p>
            <p>You can use Chatbook to:</p>
            <ul className="bullets">
              <li>Search for people you know</li>
              <li>Add friends and write on their walls</li>
              <li>See what your friends are up to in your News Feed</li>
              <li>Chat with your friends in real time</li>
            </ul>
          </div>
        </section>

        <div className="landing-forms">
          <section className="box">
            <h2 className="box-title">Login</h2>
            <form className="box-body form" onSubmit={loginForm.submit}>
              <label>Email<input name="email" type="email" required autoComplete="email" /></label>
              <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
              {loginForm.error && <div className="error">{loginForm.error}</div>}
              <button className="btn" disabled={loginForm.busy}>Login</button>
            </form>
          </section>

          <section className="box">
            <h2 className="box-title">Sign Up</h2>
            <form className="box-body form" onSubmit={registerForm.submit}>
              <label>Full name<input name="name" required minLength={2} maxLength={60} autoComplete="name" /></label>
              <label>Email<input name="email" type="email" required autoComplete="email" /></label>
              <label>Password<input name="password" type="password" required minLength={6} autoComplete="new-password" /></label>
              {registerForm.error && <div className="error">{registerForm.error}</div>}
              <button className="btn btn-green" disabled={registerForm.busy}>Register Now!</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
