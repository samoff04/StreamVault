import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Auth() {
  const [params] = useSearchParams();
  const [isRegister, setIsRegister] = useState(params.get('mode') === 'register');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const { setAuth } = useStore();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);
      setAuth(data.user, data.token);
      toast.success(isRegister ? 'Welcome to StreamVault!' : 'Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-900 via-surface-800 to-brand-700/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md">
        <div className="card p-8 glass">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Play size={20} className="text-white fill-white" />
            </div>
            <span className="text-xl font-bold gradient-text">StreamVault</span>
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {isRegister ? 'Create account' : 'Sign in'}
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            {isRegister ? 'Join millions of creators.' : 'Welcome back!'}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input name="username" value={form.username} onChange={handle} required
                  placeholder="Username" className="input-field pl-9" />
              </div>
            )}
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="email" type="email" value={form.email} onChange={handle} required
                placeholder="Email" className="input-field pl-9" />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} required
                placeholder="Password" className="input-field pl-9 pr-9" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="text-brand-400 hover:text-brand-300 font-medium">
              {isRegister ? 'Sign in' : 'Register'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}