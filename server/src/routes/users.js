import express from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/videos', async (req, res) => {
  try {
    const videos = await Video.find({ uploader: req.params.id, isPublished: true })
      .populate('uploader', 'username avatar')
      .sort({ createdAt: -1 });
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/subscribe', protect, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot subscribe to yourself' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const isSubbed = target.subscribers.includes(req.user._id);
    if (isSubbed) {
      target.subscribers.pull(req.user._id);
      req.user.subscribedTo.pull(target._id);
    } else {
      target.subscribers.push(req.user._id);
      req.user.subscribedTo.push(target._id);
    }
    await target.save(); await req.user.save();
    res.json({ subscribed: !isSubbed, count: target.subscribers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;