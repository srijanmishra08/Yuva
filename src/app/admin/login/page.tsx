'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Verify admin role
    const { data: admin, error: adminErr } = await supabase
      .from('admins')
      .select('role, is_active')
      .eq('id', data.user.id)
      .single();

      console.log("AUTH USER ID:", data.user.id);
      console.log("ADMIN QUERY RESULT:", admin);
      console.log("ADMIN QUERY ERROR:", adminErr);

    if (adminErr || !admin || !admin.is_active) {
      toast.error('Access denied. You are not an authorized admin.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    toast.success(`Welcome back! Logged in as ${admin.role}`);
    router.push('/admin');
  }

  async function handleForgotPassword() {

    if (!email) {
      toast.error("Enter your email first")
      return
    }
  
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password"
    })
  
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Password reset email sent")
    }
  
  }

  return (
    <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,170,51,0.04) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-gold" />
          </div>
          <p className="text-gold/60 font-montserrat text-xs tracking-[5px] uppercase mb-1">Admin Access</p>
          <h1 className="font-anton text-3xl text-cream tracking-wider">CONTROL CENTER</h1>
          <p className="text-white/30 font-montserrat text-sm mt-1">YUVA Diplomacy Summit 2026</p>
        </div>

        <div className="yuva-card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="yuva-label">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="yuva-input"
                placeholder="admin@funology.in"
                required
              />
            </div>
            <div>
              <label className="yuva-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="yuva-input pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="yuva-btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : 'Access Dashboard →'}
            </motion.button>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-gold/70 hover:text-gold underline text-center w-full mt-3"
              >
                Forgot Password?
              </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
