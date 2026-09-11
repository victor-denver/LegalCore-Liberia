import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Client-side route guard. This is UX only — real enforcement is Row Level
 * Security in Postgres, so a user who bypasses this still sees nothing they
 * aren't allowed to.
 */
export default function ProtectedRoute({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  const { status, profile, isAdmin } = useAuth();
  const location = useLocation();

  // Wait for session (and, for admin routes, for the profile row) before deciding.
  if (status === 'loading' || (status === 'signed-in' && requireAdmin && profile === null)) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  if (status === 'signed-out') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
