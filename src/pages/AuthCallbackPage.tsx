import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { callbackUrl, consumeNext } from '../lib/authRedirect';
import './LoginPage.css';

type ProviderError = { message: string; expired: boolean };

/**
 * Supabase reports link failures on the callback URL itself, as query params on
 * some flows and in the hash fragment on others, so both have to be read.
 */
function readProviderError(): ProviderError | null {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const get = (k: string) => params.get(k) || hash.get(k);

  const raw = get('error_description') || get('error');
  if (!raw) return null;

  // otp_expired covers both halves of the same story: the token timed out, or it
  // was already spent. Either way the cure is a new link, not a new account —
  // which is what the generic "try again" was wrongly implying.
  const code = get('error_code') || '';
  const expired = code === 'otp_expired' || /expired|invalid/i.test(raw);

  return { message: raw.replace(/\+/g, ' '), expired };
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<ProviderError | null>(readProviderError);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) { navigate('/login', { replace: true }); return; }
    if (error) return;

    let done = false;
    const finish = () => { if (!done) { done = true; navigate(consumeNext(), { replace: true }); } };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) finish();
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) finish(); });

    const timeout = setTimeout(() => {
      if (!done) setError({ message: 'Sign-in took too long. Please try again.', expired: false });
    }, 15000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [navigate, error]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || sending) return;
    setSending(true);
    setResendError(null);
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl() },
    });
    setSending(false);
    if (err) { setResendError(err.message); return; }
    setSent(true);
  };

  if (!error) {
    return (
      <div className="login">
        <div className="login__card" style={{ textAlign: 'center' }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--sunrise-gold)' }} />
          <p className="login__lead" style={{ marginTop: 14 }}>Finishing sign-in…</p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="login">
        <div className="login__card" style={{ textAlign: 'center' }}>
          <MailCheck size={28} style={{ color: 'var(--leaf-live)' }} />
          <h1 style={{ marginTop: 12 }}>New link sent</h1>
          <p className="login__lead">
            Check {email.trim()} and open the newest message. The link works once, so
            open it directly rather than previewing it first.
          </p>
          <button className="login__primary" onClick={() => navigate('/login', { replace: true })}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login__card" style={{ textAlign: 'center' }}>
        <h1>{error.expired ? 'That link has expired' : 'Sign-in failed'}</h1>

        {error.expired ? (
          <>
            <p className="login__lead">
              Confirmation links work only once and time out. If you opened an older
              email, or your mail app previewed the link before you clicked it, it will
              already have been spent. Your account still exists — you just need a fresh link.
            </p>
            <form onSubmit={resend} className="login__form" style={{ textAlign: 'left' }}>
              <label>
                Email
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="The address you registered with"
                />
              </label>
              {resendError && <div className="login__alert">{resendError}</div>}
              <button type="submit" className="login__primary" disabled={sending}>
                {sending ? 'Sending…' : 'Send me a new link'}
              </button>
            </form>
            <div className="login__alt">
              <button onClick={() => navigate('/login', { replace: true })}>
                Sign in with a password instead
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="login__lead">{error.message}</p>
            <button className="login__primary" onClick={() => navigate('/login', { replace: true })}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
