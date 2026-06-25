import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, X, Film, Image, Tag, Plus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Tech', 'Gaming', 'Music', 'Education', 'Lifestyle', 'Sports', 'Comedy', 'General'];

export default function Upload() {
  const navigate = useNavigate();
  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', category: 'General', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbPreview, setThumbPreview] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t) && form.tags.length < 10) {
      setForm({ ...form, tags: [...form.tags, t] });
      setTagInput('');
    }
  };

  const handleVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumb = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!videoFile) return toast.error('Please select a video');
    if (!form.title.trim()) return toast.error('Title is required');
    setLoading(true);

    const fd = new FormData();
    fd.append('video', videoFile);
    if (thumbFile) fd.append('thumbnail', thumbFile);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('category', form.category);
    fd.append('tags', JSON.stringify(form.tags));

    try {
      const { data } = await api.post('/videos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      toast.success('Video uploaded!');
      navigate(`/watch/${data.video._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-2">Upload Video</h1>
        <p className="text-gray-400 text-sm mb-8">Share your content with the world</p>

        <form onSubmit={submit} className="space-y-6">
          {/* Video drop zone */}
          <div
            onClick={() => videoInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${videoFile ? 'border-brand-500 bg-brand-600/10' : 'border-surface-600 hover:border-brand-600 hover:bg-surface-700/50'}`}>
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
            {videoFile ? (
              <div className="flex items-center justify-center gap-3">
                <Film size={24} className="text-brand-400" />
                <div className="text-left">
                  <p className="font-medium text-sm">{videoFile.name}</p>
                  <p className="text-xs text-gray-400">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setVideoFile(null); setVideoPreview(''); }}
                  className="ml-auto text-gray-400 hover:text-white"><X size={16} /></button>
              </div>
            ) : (
              <>
                <UploadIcon size={32} className="text-gray-500 mx-auto mb-3" />
                <p className="font-medium text-gray-300">Click or drag to upload</p>
                <p className="text-xs text-gray-500 mt-1">MP4, MOV, AVI up to 500MB</p>
              </>
            )}
          </div>

          {/* Progress */}
          {loading && progress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                <motion.div className="h-full bg-brand-500 rounded-full"
                  animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input name="title" value={form.title} onChange={handle} required
              placeholder="Enter video title" className="input-field" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={handle} rows={4}
              placeholder="Tell viewers about your video…" className="input-field resize-none" />
          </div>

          {/* Category + Thumbnail */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select name="category" value={form.category} onChange={handle} className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail</label>
              <div onClick={() => thumbInputRef.current?.click()}
                className="input-field cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white">
                <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                {thumbFile
                  ? <><img src={thumbPreview} className="w-6 h-6 rounded object-cover" /><span className="text-sm truncate">{thumbFile.name}</span></>
                  : <><Image size={15} /><span className="text-sm">Choose image</span></>
                }
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag…" className="input-field" />
              <button type="button" onClick={addTag} className="btn-ghost px-3"><Plus size={16} /></button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t, i) => (
                  <span key={i} className="flex items-center gap-1 bg-brand-600/20 text-brand-400 text-xs px-2 py-1 rounded-full">
                    #{t}
                    <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? `Uploading ${progress}%…` : 'Upload Video'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}