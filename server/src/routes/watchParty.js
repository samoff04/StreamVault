import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import WatchParty from '../models/WatchParty.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, async (req, res) => {
  try {
    const { videoId } = req.body;
    const roomId = uuidv4().slice(0, 8).toUpperCase();

    const party = await WatchParty.create({
      roomId, video: videoId, host: req.user._id, members: [req.user._id],
    });
    await party.populate('video', 'title thumbnailUrl duration');
    res.status(201).json({ party });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:roomId', protect, async (req, res) => {
  try {
    const party = await WatchParty.findOne({ roomId: req.params.roomId, isActive: true })
      .populate('video', 'title thumbnailUrl videoUrl hlsUrl duration')
      .populate('host', 'username avatar')
      .populate('members', 'username avatar');
    if (!party) return res.status(404).json({ message: 'Room not found or expired' });
    res.json({ party });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;