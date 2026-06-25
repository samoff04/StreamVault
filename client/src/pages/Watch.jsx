import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Share2, Users, Bell, Send, MoreVertical } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import AIChapters from '../components/AIChapters';
import WatchParty from '../components/WatchParty';
import { useStore } from '../store/useStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

function formatViews(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function Watch() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useStore();
  const playerRef = useRef(null);
  const [partyRoom, setPartyRoom] = useState(null);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const { data } = await api.get(`/videos/${id}`);
      setLikesCount(data.video.likes?.length || 0);
      setLiked(data.video.likes?.includes(user?._id));
      return data;
    },
  });

  const video = data?.video;

  const handleLike = async () => {
    if (!isAuthenticated()) return toast.error('Sign in to like');
    try {
      const { data } = await api.post(`/videos/${id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likes);
    } catch { toast.error('Failed to like'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) return toast.error('Sign in to comment');
    if (!comment.trim()) return;
    try {
      await api.post(`/videos/${id}/comment`, { text: comment });
      setComment('');
      refetch();
      toast.success('Comment posted');
    } catch { toast.error('Failed to post comment'); }
  };

  const startWatchParty = async () => {
    if (!isAuthenticated()) return toast.error('Sign in to start a party');
    try {
      const { data } = await api.post('/watch-party/create', { videoId: id });
      setPartyRoom(data.party.roomId);
      toast.success(`Party created! Room: ${data.party.roomId}`);
    } catch { toast.error('Failed to create party'); }
  };

  const shareVideo = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 pt-24">
      <div className="aspect-video shimmer rounded-xl mb-6" />
    </div>
  );

  if (!video) return (
    <div className="max-w-7xl mx-auto px-4 pt-24 text-center py-20">
      <p className="text-gray-400">Video not found</p>
    </div>
  );

  const isOwner = user?._id === video.uploader?._id;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
      <div className={`flex gap-6 ${partyRoom ? 'flex-row' : 'flex-col lg:flex-row'}`}>
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Player */}
          <VideoPlayer
            ref={playerRef}
            src={video.videoUrl}
            hlsSrc={video.hlsUrl}
            chapters={video.chapters || []}
            onTimeUpdate={(t) => {}}
          />

          {/* Title & Actions */}
          <div className="mt-4">
            <h1 className="text-xl font-bold text-white leading-snug">{video.title}</h1>

            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{formatViews(video.views)} views</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                {video.category && (
                  <span className="bg-surface-700 px-2 py-0.5 rounded-full text-xs">{video.category}</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button onClick={handleLike}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    liked ? 'bg-brand-600 text-white' : 'bg-surface-700 text-gray-300 hover:bg-surface-600'
                  }`}>
                  <ThumbsUp size={15} /> {likesCount}
                </button>

                <button onClick={startWatchParty}
                  className="flex items-center gap-2 bg-surface-700 hover:bg-surface-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-all">
                  <Users size={15} /> Watch Party
                </button>

                <button onClick={shareVideo}
                  className="flex items-center gap-2 bg-surface-700 hover:bg-surface-600 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium transition-all">
                  <Share2 size={15} /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Uploader info */}
          <div className="flex items-center justify-between mt-5 p-4 card">
            <Link to={`/profile/${video.uploader?._id}`} className="flex items-center gap-3">
              {video.uploader?.avatar
                ? <img src={video.uploader.avatar} className="w-11 h-11 rounded-full object-cover" />
                : <div className="w-11 h-11 bg-brand-600 rounded-full flex items-center justify-center font-bold">
                    {video.uploader?.username?.[0]?.toUpperCase()}
                  </div>
              }
              <div>
                <p className="font-semibold text-sm">{video.uploader?.username}</p>
                <p className="text-xs text-gray-400">{video.uploader?.subscribers?.length || 0} subscribers</p>
              </div>
            </Link>
            <button className="btn-primary flex items-center gap-2 text-sm">
              <Bell size={14} /> Subscribe
            </button>
          </div>

          {/* Description */}
          {video.description && (
            <div className="mt-4 card p-4">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{video.description}</p>
              {video.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {video.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-brand-400 bg-brand-600/10 px-2 py-1 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Chapters */}
          <div className="mt-4">
            <AIChapters
              videoId={id}
              chapters={video.chapters}
              isOwner={isOwner}
              onSeek={(t) => playerRef.current?.seekTo(t)}
            />
          </div>

          {/* Comments */}
          <div className="mt-6">
            <h3 className="font-semibold mb-4">{video.comments?.length || 0} Comments</h3>

            {/* Post comment */}
            {isAuthenticated() && (
              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment…" className="input-field text-sm" />
                  <button type="submit" className="btn-primary px-3"><Send size={14} /></button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {video.comments?.slice().reverse().map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex gap-3">
                  <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {c.user?.avatar
                      ? <img src={c.user.avatar} className="w-full h-full rounded-full object-cover" />
                      : c.user?.username?.[0]?.toUpperCase()
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.user?.username}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{c.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Watch Party Sidebar */}
        <AnimatePresence>
          {partyRoom && (
            <WatchParty
              roomId={partyRoom}
              videoRef={playerRef}
              onClose={() => setPartyRoom(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}