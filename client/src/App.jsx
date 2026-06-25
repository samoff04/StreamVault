import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Auth from './pages/Auth';

export default function App() {
  return (
    <div className="min-h-screen bg-surface-900 text-white">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:id" element={<Watch />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1a1a2e', color: '#e4e4f0', border: '1px solid #22223b' },
        }}
      />
    </div>
  );
}