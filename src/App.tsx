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
import LoadingScreen from './components/LoadingScreen';
import { JurisdictionProvider } from './hooks/useJurisdiction';
import { StoreProvider } from './hooks/useStore';

export default function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);
  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;
  return (
    <JurisdictionProvider>
    <StoreProvider>
    <Layout>
      <Routes>
        <Route path="/" element={<WestAfricaPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/document/:id" element={<DocumentPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/west-africa" element={<WestAfricaPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
      </Routes>
    </Layout>
    </StoreProvider>
    </JurisdictionProvider>
  );
}
