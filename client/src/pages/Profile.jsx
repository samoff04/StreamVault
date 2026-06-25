import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Eye, Film } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import api from '../lib/api';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function Profile() {
  const { id } = useParams();
  const { user: me, isAuthenticated } = useStore();

  const { data: userData } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const r = await api.get(`/users/${id}`);
      return r.data;
    },
  });

  const { data: videosData } = useQuery({
    queryKey: ['user-videos', id],
    queryFn: async () => {
      const r = await api.get(`/users/${id}/videos`);
      return r.data;
    },
  });

  const profile = userData?.user;
  const videos = videosData?.videos || [];

  const totalViews = videos.reduce(
    (acc, v) => acc + (v.views || 0),
    0
  );

  const handleSubscribe = async () => {
    if (!isAuthenticated()) {
      return toast.error('Sign in to subscribe');
    }

    try {
      await api.post(`/users/${id}/subscribe`);
      toast.success('Subscription updated!');
    } catch {
      toast.error('Failed');
    }
  };

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-24">
        <div className="h-40 rounded-3xl shimmer" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
      {/* Banner */}
      <div className="relative h-52 rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-800">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, #c084fc 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Profile Card */}
      <div className="relative bg-surface-800 border border-surface-700 rounded-b-3xl px-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-6">
          
          {/* Avatar */}
          <div className="-mt-16">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-surface-800 shadow-2xl"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-brand-600 border-4 border-surface-800 shadow-2xl flex items-center justify-center text-4xl font-bold">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 pb-3">
            <h1 className="text-3xl font-bold">
              {profile.username}
            </h1>

            {profile.bio && (
              <p className="text-gray-400 mt-2 max-w-2xl">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Subscribe Button */}
          {me?._id !== id && (
            <button
              onClick={handleSubscribe}
              className="btn-primary md:mb-4"
            >
              Subscribe
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-8 mt-6 pt-6 border-t border-surface-700">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span className="font-bold">
              {profile.subscribers?.length || 0}
            </span>
            <span className="text-gray-400">Subscribers</span>
          </div>

          <div className="flex items-center gap-2">
            <Film size={16} />
            <span className="font-bold">
              {videos.length}
            </span>
            <span className="text-gray-400">Videos</span>
          </div>

          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span className="font-bold">
              {totalViews >= 1000
                ? `${(totalViews / 1000).toFixed(1)}K`
                : totalViews}
            </span>
            <span className="text-gray-400">Views</span>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6">
          Videos
        </h2>

        {videos.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No videos uploaded yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video, index) => (
              <VideoCard
                key={video._id}
                video={video}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}