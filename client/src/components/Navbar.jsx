import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Search, Upload, Bell, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Play size={16} className="text-white fill-white" />
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">StreamVault</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated() ? (
            <>
              <Link to="/upload" className="btn-primary flex items-center gap-2 text-sm hidden sm:flex">
                <Upload size={15} /> Upload
              </Link>
              <button className="btn-ghost p-2 relative">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
              </button>
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 btn-ghost px-2">
                  {user?.avatar
                    ? <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {user?.username?.[0]?.toUpperCase()}
                      </div>
                  }
                </button>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 top-12 w-48 card shadow-2xl p-2 z-50">
                    <Link to={`/profile/${user?._id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm"
                      onClick={() => setMenuOpen(false)}>
                      <User size={15} /> Profile
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-700 text-sm text-red-400">
                      <LogOut size={15} /> Logout
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/auth?mode=register" className="btn-primary text-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}