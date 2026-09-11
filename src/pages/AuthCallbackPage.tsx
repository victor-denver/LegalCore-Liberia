import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { consumeNext } from '../lib/authRedirect';
import './LoginPage.css';

function readProviderError(): string | null {
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return params.get('error_description') || hash.get('error_description') || params.get('error');
}

/**
 * OAuth / magic-link landing page.
 * supabase-js (detectSessionInUrl + PKCE) exchanges the `?code=` for a session on load;
 * we just wait for it, then send the user where they were going.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(readProviderError);

  useEffect(() => {
    if (!supabase) { navigate('/login', { replace: true }); return; }
    if (error) return;

    let done = false;
    const finish = () => { if (!done) { done = true; navigate(consumeNext(), { replace: true }); } };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) finish();
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) finish(); });

    const timeout = setTimeout(() => { if (!done) setError('Sign-in took too long. Please try again.'); }, 15000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout); };
  }, [navigate, error]);

  return (
    <div className="login">
      <div className="login__card" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <h1>Sign-in failed</h1>
            <p className="login__lead">{error}</p>
            <button className="login__primary" onClick={() => navigate('/login', { replace: true })}>Try again</button>
          </>
        ) : (
          <>
            <Loader2 size={28} className="spin" style={{ color: 'var(--sunrise-gold)' }} />
            <p className="login__lead" style={{ marginTop: 14 }}>Finishing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}
