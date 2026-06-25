import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Clock, TrendingUp } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import api from '../lib/api';

const CATEGORIES = ['All', 'Tech', 'Gaming', 'Music', 'Education', 'Lifestyle', 'Sports', 'Comedy', 'General'];

function SkeletonCard() {
  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-xl shimmer" />
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full shimmer shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 shimmer rounded w-full" />
          <div className="h-3 shimmer rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [params] = useSearchParams();
  const [category, setCategory] = useState('All');
  const [tab, setTab] = useState('latest');
  const search = params.get('search') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['videos', category, search, tab],
    queryFn: async () => {
      const endpoint = tab === 'trending' ? '/videos/trending' : '/videos';
      const res = await api.get(endpoint, { params: { category, search } });
      return res.data;
    },
  });

  const videos = data?.videos || [];

  return (
    <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
      {/* Hero */}
      {!search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="relative rounded-2xl overflow-hidden mb-10 bg-gradient-to-r from-brand-700 to-purple-800 p-8 md:p-12">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #818cf8 0%, transparent 60%)' }} />
          <div className="relative z-10 max-w-lg">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-200" />
              <span className="text-brand-200 text-sm font-medium uppercase tracking-wider">Now Streaming</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
              Your next favorite video<br />is one click away
            </h1>
            <p className="text-white/70 text-sm">Discover, watch, and share — with AI-powered chapters and live watch parties.</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-800 p-1 rounded-xl">
          {[
            { id: 'latest', label: 'Latest', icon: <Clock size={14} /> },
            { id: 'trending', label: 'Trending', icon: <Flame size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                category === c
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-700 text-gray-400 hover:bg-surface-600 hover:text-white'
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Search results header */}
      {search && (
        <p className="text-gray-400 text-sm mb-6">
          Showing results for <span className="text-white font-medium">"{search}"</span>
          {' — '}{videos.length} found
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : videos.map((v, i) => <VideoCard key={v._id} video={v} index={i} />)
        }
      </div>

      {!isLoading && videos.length === 0 && (
        <div className="text-center py-24">
          <TrendingUp size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No videos found</p>
          <p className="text-gray-600 text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </main>
  );
}