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
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);
  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/document/:id" element={<DocumentPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Layout>
  );
}
