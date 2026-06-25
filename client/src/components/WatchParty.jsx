import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { Users, Send, Copy, Crown, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function WatchParty({ roomId, videoRef, onClose }) {
  const { user, token } = useStore();
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const socket = io('/', { auth: { token } });
    socketRef.current = socket;

    socket.emit('party:join', { roomId });

    socket.on('party:members', ({ members }) => setMembers(members));
    socket.on('party:message', (msg) => setMessages((p) => [...p, msg]));

    socket.on('party:sync', ({ currentTime, isPlaying }) => {
      if (!videoRef?.current) return;
      const diff = Math.abs(videoRef.current.getCurrentTime() - currentTime);
      if (diff > 1) videoRef.current.seekTo(currentTime);
      videoRef.current.setPlaying(isPlaying);
    });

    socket.on('party:seek', ({ currentTime }) => {
      videoRef?.current?.seekTo(currentTime);
    });

    socket.on('party:user-joined', ({ username }) => {
      setMessages((p) => [...p, { system: true, text: `${username} joined the party 🎉` }]);
    });

    socket.on('party:user-left', ({ username }) => {
      setMessages((p) => [...p, { system: true, text: `${username} left the party` }]);
    });

    return () => {
      socket.emit('party:leave', { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('party:message', { roomId, text: input });
    setInput('');
  };

  const syncVideo = () => {
    if (!videoRef?.current || !socketRef.current) return;
    socketRef.current.emit('party:sync', {
      roomId,
      currentTime: videoRef.current.getCurrentTime(),
      isPlaying: true,
    });
    toast.success('Synced everyone!');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/watch-party/${roomId}`);
    toast.success('Room link copied!');
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      className="flex flex-col h-full card border-l border-surface-600 w-80 shrink-0">

      {/* Header */}
      <div className="p-4 border-b border-surface-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="font-semibold text-sm">Watch Party</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>
        <div className="flex items-center gap-2">
          <code className="text-brand-400 font-mono text-sm bg-surface-700 px-2 py-1 rounded flex-1 text-center">
            {roomId}
          </code>
          <button onClick={copyLink} className="btn-ghost p-2"><Copy size={14} /></button>
        </div>
        <button onClick={syncVideo} className="btn-primary w-full mt-2 text-sm py-1.5">
          Sync Everyone Now
        </button>
      </div>

      {/* Members */}
      <div className="px-4 py-2 border-b border-surface-700">
        <div className="flex items-center gap-2 mb-2">
          <Users size={13} className="text-gray-400" />
          <span className="text-xs text-gray-400">{members.length} watching</span>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 8).map((m, i) => (
            <div key={i} title={m.username}
              className="w-7 h-7 rounded-full bg-brand-600 border-2 border-surface-800 flex items-center justify-center text-xs font-bold">
              {m.avatar
                ? <img src={m.avatar} className="w-full h-full rounded-full object-cover" />
                : m.username?.[0]?.toUpperCase()
              }
            </div>
          ))}
          {members.length > 8 && (
            <div className="w-7 h-7 rounded-full bg-surface-600 border-2 border-surface-800 flex items-center justify-center text-xs text-gray-400">
              +{members.length - 8}
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {msg.system ? (
                <p className="text-center text-xs text-gray-500">{msg.text}</p>
              ) : (
                <div className={`flex gap-2 ${msg.username === user?.username ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.avatar
                      ? <img src={msg.avatar} className="w-full h-full rounded-full object-cover" />
                      : msg.username?.[0]?.toUpperCase()
                    }
                  </div>
                  <div className={`max-w-[70%] ${msg.username === user?.username ? 'items-end' : 'items-start'} flex flex-col`}>
                    {msg.username !== user?.username && (
                      <span className="text-xs text-gray-500 mb-1">{msg.username}</span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      msg.username === user?.username
                        ? 'bg-brand-600 text-white rounded-tr-sm'
                        : 'bg-surface-700 text-gray-200 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-surface-700">
        <div className="flex gap-2">
          <input
            type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Say something…"
            className="input-field text-sm py-2"
          />
          <button onClick={sendMessage} className="btn-primary px-3">
            <Send size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}