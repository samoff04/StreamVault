import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '', maxlength: 300 },
  role:     { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
  subscribers:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subscribedTo:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  watchHistory: [{
    video:     { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    watchedAt: { type: Date, default: Date.now },
    progress:  { type: Number, default: 0 },
  }],
  savedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);