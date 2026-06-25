import mongoose from 'mongoose';

const watchPartySchema = new mongoose.Schema({
  roomId:    { type: String, required: true, unique: true },
  video:     { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  host:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:  { type: Boolean, default: true },
  currentTime: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  messages: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username:  String,
    avatar:    String,
    text:      String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export default mongoose.model('WatchParty', watchPartySchema);