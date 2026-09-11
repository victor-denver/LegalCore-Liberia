import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, Loader2, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppConfig } from '../hooks/useAppConfig';
import './LoginPage.css';

type Mode = 'signin' | 'signup' | 'reset';
const MIN_PW = 8;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/**
 * One door for everyone. Roles are never hinted at here — an admin signs in the same
 * way as a student and only discovers the Admin link afterwards.
 */
export default function LoginPage() {
  const { enabled, status, isAdmin, profile, signInWithGoogle, signInWithPassword, signUpWithPassword, sendPasswordReset } = useAuth();
  const cfg = useAppConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const next = params.get('next') || '/';
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in → go where they were heading (admins default to their console).
  useEffect(() => {
    if (status !== 'signed-in' || profile === null) return;
    navigate(isAdmin && next === '/' ? '/admin' : next, { replace: true });
  }, [status, profile, isAdmin, next, navigate]);

  const switchMode = (m: Mode) => { setMode(m); setError(null); setNotice(null); };

  const google = async () => {
    setBusy(true); setError(null);
    const r = await signInWithGoogle(next);
    if (r.error) { setError(r.error); setBusy(false); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    let r: { error?: string; needsConfirmation?: boolean } = {};
    if (mode === 'signin') r = await signInWithPassword(email, password);
    else if (mode === 'signup') {
      if (password.length < MIN_PW) r = { error: `Use at least ${MIN_PW} characters.` };
      else {
        r = await signUpWithPassword(email, password, name);
        if (!r.error && r.needsConfirmation) setNotice(`Almost there — we sent a confirmation link to ${email.trim()}. Open it, then sign in.`);
      }
    } else {
      r = await sendPasswordReset(email);
      if (!r.error) setNotice('If that email has an account, a reset link is on its way.');
    }
    if (r.error) setError(r.error);
    setBusy(false);
  };

  const title = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your free account' : 'Reset your password';
  const lead = mode === 'signin'
    ? 'Your saved laws, briefs and alerts — on every device.'
    : mode === 'signup'
      ? 'Free, and it stays free. Reading the law never requires an account; this just keeps your library with you.'
      : "Enter your email and we'll send a link to choose a new password.";

  return (
    <div className="login">
      <div className="login__card animate-in">
        <Link to="/" className="login__back"><ArrowLeft size={14} /> Back to LegalCore</Link>

        <div className="login__brand">
          <span className="login__brand-name">LegalCore</span>
          <span className="login__brand-sub">WEST AFRICA</span>
        </div>

        {!enabled && (
          <div className="login__alert">
            Accounts are temporarily unavailable. You can still search and read the full
            library — saving works on this device in the meantime.
          </div>
        )}

        <h1>{title}</h1>
        <p className="login__lead">{lead}</p>

        <form className="login__form" onSubmit={submit}>
          {mode === 'signup' && (
            <label>
              <span><User size={13} /> Your name</span>
              <input type="text" autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </label>
          )}
          <label>
            <span><Mail size={13} /> Email</span>
            <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          {mode !== 'reset' && (
            <label>
              <span><Lock size={13} /> Password</span>
              <div className="login__pw">
                <input type={showPw ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? MIN_PW : 1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'signup' ? `At least ${MIN_PW} characters` : '••••••••••••'} />
                <button type="button" className="login__eye" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </label>
          )}

          <button type="submit" className="login__primary" disabled={busy || !enabled}>
            {busy ? <Loader2 size={16} className="spin" /> : null}
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>

        {cfg.google_login_enabled && mode !== 'reset' && (
          <>
            <div className="login__or"><span>or</span></div>
            <button className="login__google" onClick={google} disabled={busy || !enabled}>
              <GoogleMark /><span>Continue with Google</span>
            </button>
          </>
        )}

        <div className="login__alt">
          {mode !== 'signin' && <button onClick={() => switchMode('signin')}>Already have an account? Sign in</button>}
          {mode !== 'signup' && <button onClick={() => switchMode('signup')}>New here? Create a free account</button>}
          {mode === 'signin' && <button onClick={() => switchMode('reset')}>Forgot password?</button>}
        </div>

        {error && <div className="login__alert login__alert--error" role="alert">{error}</div>}
        {notice && <div className="login__alert login__alert--ok" role="status">{notice}</div>}
      </div>
    </div>
  );
}
