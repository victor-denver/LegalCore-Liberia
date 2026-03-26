import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import DocumentPage from './pages/DocumentPage';
import BrowsePage from './pages/BrowsePage';
import MapPage from './pages/MapPage';
import AIAssistant from './pages/AIAssistant';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/document/:id" element={<DocumentPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/ai" element={<AIAssistant />} />
      </Routes>
    </Layout>
  );
}
