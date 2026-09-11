import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './LoginPage.css';

/** Landing page for password-reset emails. Supabase signs the user in via the link; we then set a new password. */
export default function ResetPasswordPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (pw.length < 8) { setError('Use at least 8 characters.'); return; }
    if (pw !== pw2) { setError('Passwords do not match.'); return; }
    setBusy(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setError(error.message); return; }
    navigate('/', { replace: true });
  };

  return (
    <div className="login">
      <div className="login__card animate-in">
        <h1>Choose a new password</h1>
        <p className="login__lead">{status === 'signed-in' ? 'Minimum 8 characters. A short sentence you can remember works well.' : 'Waiting for the reset link to verify…'}</p>
        <form className="login__form" onSubmit={submit}>
          <label><span><Lock size={13} /> New password</span><input type="password" autoComplete="new-password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label><span><Lock size={13} /> Confirm</span><input type="password" autoComplete="new-password" minLength={8} required value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          <button type="submit" className="login__primary" disabled={busy || status !== 'signed-in'}>{busy ? <Loader2 size={16} className="spin" /> : null} Update password</button>
        </form>
        {error && <div className="login__alert login__alert--error" role="alert">{error}</div>}
      </div>
    </div>
  );
}
