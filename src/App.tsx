import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import DocumentPage from './pages/DocumentPage';
import BrowsePage from './pages/BrowsePage';
import MapPage from './pages/MapPage';
import AIAssistant from './pages/AIAssistant';
import AboutPage from './pages/AboutPage';
import WestAfricaPage from './pages/WestAfricaPage';
import SavedPage from './pages/SavedPage';
import ComparePage from './pages/ComparePage';
import MethodologyPage from './pages/MethodologyPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/AdminPage';
import PlansPage from './pages/PlansPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthGate from './components/AuthGate';
import LoadingScreen from './components/LoadingScreen';
import { JurisdictionProvider } from './hooks/useJurisdiction';
import { StoreProvider } from './hooks/useStore';
import { AuthProvider } from './hooks/useAuth';

export default function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);
  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;
  return (
    <AuthProvider>
    <JurisdictionProvider>
    <StoreProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<WestAfricaPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<AuthGate feature="search"><SearchPage /></AuthGate>} />
        <Route path="/document/:id" element={<DocumentPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/ai" element={<AuthGate feature="ai"><AIAssistant /></AuthGate>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/west-africa" element={<WestAfricaPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/plans" element={<PlansPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/reset" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
      </Routes>
    </Layout>
    </StoreProvider>
    </JurisdictionProvider>
    </AuthProvider>
  );
}
