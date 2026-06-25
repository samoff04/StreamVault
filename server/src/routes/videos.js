import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import Anthropic from '@anthropic-ai/sdk';
import cloudinary from '../config/cloudinary.js';
import Video from '../models/Video.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };
    if (search) query.$text = { $search: search };
    if (category && category !== 'All') query.category = category;

    const videos = await Video.find(query)
      .populate('uploader', 'username avatar subscribers')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Video.countDocuments(query);
    res.json({ videos, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const videos = await Video.find({ isPublished: true })
      .populate('uploader', 'username avatar')
      .sort({ views: -1, createdAt: -1 })
      .limit(8);
    res.json({ videos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploader', 'username avatar bio subscribers')
      .populate('comments.user', 'username avatar');
    if (!video) return res.status(404).json({ message: 'Video not found' });

    video.views += 1;
    await video.save();
    res.json({ video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/upload', protect, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]), async (req, res) => {
  try {
    const { title, description, tags, category } = req.body;
    if (!req.files?.video) return res.status(400).json({ message: 'Video file required' });

    const videoFile = req.files.video[0];
    const videoB64 = `data:${videoFile.mimetype};base64,${videoFile.buffer.toString('base64')}`;

    const videoUpload = await cloudinary.uploader.upload(videoB64, {
      resource_type: 'video',
      folder: 'streamvault/videos',
      public_id: `video_${uuidv4()}`,
      eager: [
        { streaming_profile: 'hd', format: 'm3u8' },
      ],
      eager_async: true,
    });

    let thumbnailUrl = '';
    if (req.files?.thumbnail) {
      const thumbFile = req.files.thumbnail[0];
      const thumbB64 = `data:${thumbFile.mimetype};base64,${thumbFile.buffer.toString('base64')}`;
      const thumbUpload = await cloudinary.uploader.upload(thumbB64, { folder: 'streamvault/thumbnails' });
      thumbnailUrl = thumbUpload.secure_url;
    } else {
      thumbnailUrl = cloudinary.url(videoUpload.public_id, {
        resource_type: 'video', format: 'jpg', transformation: [{ start_offset: '5' }],
      });
    }

    const slug = `${title.toLowerCase().replace(/\s+/g, '-')}-${uuidv4().slice(0, 6)}`;
    const video = await Video.create({
      title, description, slug,
      uploader: req.user._id,
      videoUrl: videoUpload.secure_url,
      hlsUrl: videoUpload.eager?.[0]?.secure_url || videoUpload.secure_url,
      thumbnailUrl,
      duration: Math.round(videoUpload.duration || 0),
      fileSize: videoFile.size,
      tags: tags ? JSON.parse(tags) : [],
      category: category || 'General',
      cloudinaryId: videoUpload.public_id,
    });

    await video.populate('uploader', 'username avatar');
    res.status(201).json({ video });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/ai-chapters', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.uploader.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    const prompt = `You are an expert video editor. Given a video titled "${video.title}" with description: "${video.description}" and duration ${video.duration} seconds, generate exactly 5 meaningful chapter timestamps.

Return ONLY a JSON array like this (no markdown, no explanation):
[
  {"timestamp": 0, "title": "Introduction", "summary": "Brief what happens here"},
  {"timestamp": 45, "title": "Chapter Name", "summary": "Brief summary"},
  ...
]

Make timestamps realistic and evenly distributed across ${video.duration} seconds. Chapter titles should be specific to the content.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const chapters = JSON.parse(raw);

    video.chapters = chapters;
    await video.save();
    res.json({ chapters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const uid = req.user._id;
    const liked = video.likes.includes(uid);
    if (liked) video.likes.pull(uid);
    else { video.likes.push(uid); video.dislikes.pull(uid); }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length, liked: !liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    video.comments.push({ user: req.user._id, text: text.trim() });
    await video.save();
    await video.populate('comments.user', 'username avatar');

    res.status(201).json({ comment: video.comments[video.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;