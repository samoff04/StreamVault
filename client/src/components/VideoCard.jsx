import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ThumbsUp, Clock } from 'lucide-react';

function formatDuration(s) {
  if (!s) return '0:00';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default function VideoCard({ video, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group">
      <Link to={`/watch/${video._id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-700 mb-3">
          {video.thumbnailUrl
            ? <img src={video.thumbnailUrl} alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full shimmer" />
          }
          {/* Duration badge */}
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {formatDuration(video.duration)}
          </span>
          {/* Play overlay */}
          <div className="absolute inset-0 bg-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex gap-3">
          <Link to={`/profile/${video.uploader?._id}`} onClick={(e) => e.stopPropagation()}>
            {video.uploader?.avatar
              ? <img src={video.uploader.avatar} className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5" />
              : <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {video.uploader?.username?.[0]?.toUpperCase()}
                </div>
            }
          </Link>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 leading-snug mb-1">
              {video.title}
            </h3>
            <p className="text-xs text-gray-400">{video.uploader?.username}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Eye size={11} /> {formatViews(video.views)}</span>
              <span className="flex items-center gap-1"><ThumbsUp size={11} /> {video.likes?.length || 0}</span>
              <span className="flex items-center gap-1"><Clock size={11} /> {timeAgo(video.createdAt)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}