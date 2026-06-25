import WatchParty from '../models/WatchParty.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = await User.findById(decoded.id).select('-password');
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('party:join', async ({ roomId }) => {
      socket.join(`party:${roomId}`);

      if (socket.user) {
        await WatchParty.findOneAndUpdate(
          { roomId },
          { $addToSet: { members: socket.user._id } }
        );
      }

      const party = await WatchParty.findOne({ roomId })
        .populate('members', 'username avatar');

      io.to(`party:${roomId}`).emit('party:members', {
        members: party?.members || [],
      });

      socket.to(`party:${roomId}`).emit('party:user-joined', {
        username: socket.user?.username || 'Guest',
        avatar: socket.user?.avatar || '',
      });
    });

    socket.on('party:leave', async ({ roomId }) => {
      socket.leave(`party:${roomId}`);
      socket.to(`party:${roomId}`).emit('party:user-left', {
        username: socket.user?.username || 'Guest',
      });
    });

    socket.on('party:sync', ({ roomId, currentTime, isPlaying }) => {
      socket.to(`party:${roomId}`).emit('party:sync', { currentTime, isPlaying });
      WatchParty.findOneAndUpdate({ roomId }, { currentTime, isPlaying }).exec();
    });

    socket.on('party:seek', ({ roomId, currentTime }) => {
      socket.to(`party:${roomId}`).emit('party:seek', { currentTime });
    });

    socket.on('party:message', async ({ roomId, text }) => {
      if (!socket.user || !text?.trim()) return;

      const msg = {
        user: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar,
        text: text.trim(),
        createdAt: new Date(),
      };

      await WatchParty.findOneAndUpdate({ roomId }, { $push: { messages: msg } });
      io.to(`party:${roomId}`).emit('party:message', msg);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};