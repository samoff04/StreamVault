import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, Loader } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function AIChapters({ videoId, chapters: initial, isOwner, onSeek }) {
  const [chapters, setChapters] = useState(initial || []);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);

  const generateChapters = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/videos/${videoId}/ai-chapters`);
      setChapters(data.chapters);
      toast.success('AI chapters generated!');
    } catch {
      toast.error('Failed to generate chapters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-400" />
          <h3 className="font-semibold text-sm">AI Smart Chapters</h3>
          <span className="bg-brand-600/20 text-brand-400 text-xs px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && chapters.length === 0 && (
            <button onClick={generateChapters} disabled={loading}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
              {loading ? <><Loader size={12} className="animate-spin" /> Generating…</> : <><Sparkles size={12} /> Generate</>}
            </button>
          )}
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
            <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {chapters.length > 0 ? (
              <div className="space-y-1">
                {chapters.map((ch, i) => (
                  <button key={i} onClick={() => onSeek?.(ch.timestamp)}
                    className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-surface-700 transition-colors group">
                    <span className="text-brand-400 text-xs font-mono mt-0.5 shrink-0 group-hover:text-brand-300">
                      {formatTime(ch.timestamp)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-200 group-hover:text-white">{ch.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{ch.summary}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                {isOwner ? 'Generate AI chapters to auto-segment your video.' : 'No chapters yet.'}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}