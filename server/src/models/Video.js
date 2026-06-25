import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  timestamp: Number,
  title:     String,
  summary:   String,
});

const commentSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:      { type: String, required: true, maxlength: 500 },
  likes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

const videoSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  slug:        { type: String, unique: true },
  uploader:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoUrl:    { type: String, required: true },
  hlsUrl:      { type: String, default: '' },
  thumbnailUrl:{ type: String, default: '' },
  duration:    { type: Number, default: 0 },
  views:       { type: Number, default: 0 },
  likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags:        [String],
  category:    { type: String, default: 'General' },
  isPublished: { type: Boolean, default: true },
  quality:     { type: String, enum: ['360p','480p','720p','1080p'], default: '720p' },
  fileSize:    { type: Number, default: 0 },
  chapters:    [chapterSchema],
  comments:    [commentSchema],
  cloudinaryId:{ type: String, default: '' },
}, { timestamps: true });

videoSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default mongoose.model('Video', videoSchema);