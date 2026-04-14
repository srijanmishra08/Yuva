'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LogOut, Award, Calendar, Info, ChevronRight, Clock, CheckCircle, User } from 'lucide-react';
import type { Delegate, Committee, Portfolio } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'otp'>('login');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState<unknown>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadDelegate(session.user.email!);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadDelegate(session.user.email!);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadDelegate(email: string) {
    console.log("Session Email:", email);
    setLoading(true);
    const { data } = await supabase
      .from('delegates')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (data) {
      setDelegate(data);
      if (data.committee_assigned) {
        const { data: comm } = await supabase.from('committees').select('*').eq('id', data.committee_assigned).single();
        setCommittee(comm);
      }
      if (data.portfolio_assigned) {
        const { data: port } = await supabase.from('portfolios').select('*').eq('id', data.portfolio_assigned).single();
        setPortfolio(port);
      }
    }
    setLoading(false);
  }

  async function sendOTP() {
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      toast.error(error.message);
    } else {
      setAuthMode('otp');
      toast.success('OTP sent to your email!');
    }
    setAuthLoading(false);
  }

  async function verifyOTP() {
    setAuthLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      toast.error(error.message);
    }
    setAuthLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setDelegate(null);
    toast.success('Signed out');
  }

  // Not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <p className="text-gold/60 font-montserrat text-xs tracking-[5px] uppercase mb-2">Delegate Portal</p>
            <h1 className="font-anton text-4xl text-cream tracking-wider">DASHBOARD LOGIN</h1>
          </div>
          <div className="yuva-card p-8">
            {authMode === 'login' ? (
              <>
                <p className="font-montserrat text-white/60 text-sm mb-6 text-center">
                  Enter your registered email to receive a login OTP
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="yuva-label">Registered Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="yuva-input"
                      placeholder="delegate@example.com"
                      onKeyDown={(e) => e.key === 'Enter' && sendOTP()}
                    />
                  </div>
                  <motion.button
                    onClick={sendOTP}
                    disabled={!email || authLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="yuva-btn-primary w-full"
                  >
                    {authLoading ? 'Sending...' : 'Send OTP →'}
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <p className="font-montserrat text-white/60 text-sm mb-6 text-center">
                  Enter the 6-digit OTP sent to <span className="text-gold">{email}</span>
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="yuva-label">One-Time Password</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="yuva-input text-center text-2xl tracking-[8px] font-impact"
                      placeholder="000000"
                      maxLength={6}
                      onKeyDown={(e) => e.key === 'Enter' && verifyOTP()}
                    />
                  </div>
                  <motion.button
                    onClick={verifyOTP}
                    disabled={otp.length < 6 || authLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="yuva-btn-primary w-full"
                  >
                    {authLoading ? 'Verifying...' : 'Verify & Login →'}
                  </motion.button>
                  <button
                    onClick={() => setAuthMode('login')}
                    className="text-white/40 hover:text-gold text-sm font-montserrat w-full text-center transition-colors"
                  >
                    ← Change email
                  </button>
                </div>
              </>
            )}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-white/40 text-sm font-montserrat">Not registered yet?</p>
              <Link href="/register" className="text-gold hover:text-gold-light text-sm font-montserrat font-600 transition-colors">
                Register for YDS 2026 →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 font-montserrat text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!delegate) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="yuva-card p-8">
            <h2 className="font-anton text-2xl text-cream mb-3">No Registration Found</h2>
            <p className="text-white/50 font-montserrat text-sm mb-6">
              We couldn&apos;t find a registration linked to this email. Please register first.
            </p>
            <Link href="/register" className="yuva-btn-primary inline-block">Register Now →</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-dark">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-gold/60 font-montserrat text-xs tracking-[5px] uppercase">Welcome back</p>
            <h1 className="font-anton text-3xl md:text-4xl text-cream tracking-wider mt-0.5">
              {delegate.first_name.toUpperCase()} {delegate.last_name.toUpperCase()}
            </h1>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-white/40 hover:text-gold text-sm font-montserrat transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Delegate ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="delegate-pass rounded-3xl p-8 mb-6 shadow-gold"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-montserrat text-xs text-white/40 tracking-[5px] uppercase mb-1">Delegate ID</p>
              <p className="font-impact text-5xl tracking-widest text-gold">{delegate.delegate_id}</p>
              <p className="font-montserrat text-white/60 text-sm mt-2">{delegate.institution}</p>
              <p className="font-montserrat text-white/40 text-xs mt-0.5">{delegate.class_year}</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              {delegate.payment_status === 'VERIFIED' ? (
                <span className="badge-green"><CheckCircle size={12} /> Payment Verified</span>
              ) : (
                <span className="badge-gray"><Clock size={12} /> Payment Pending</span>
              )}
              {delegate.carnival_pass && (
                <span className="badge-gold">🎡 Carnival Pass</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Committee & Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="yuva-card p-6 mb-6"
        >
          <h3 className="form-section-title text-base mb-5">Committee Assignment</h3>
          {delegate.allotment_status === 'PENDING' ? (
            <div className="text-center py-6">
              <Clock size={32} className="text-white/20 mx-auto mb-3" />
              <p className="font-montserrat font-700 text-white/50">Pending Allotment</p>
              <p className="font-montserrat text-xs text-white/30 mt-1">Your committee will be assigned soon</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs font-montserrat uppercase tracking-wider mb-1">Committee</p>
                <p className="font-impact text-xl text-gold tracking-wide">{committee?.abbreviation || '—'}</p>
                <p className="font-montserrat text-xs text-white/50 mt-1">{committee?.name}</p>
              </div>
              <div className="bg-bronze/5 border border-bronze/20 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs font-montserrat uppercase tracking-wider mb-1">Portfolio</p>
                <p className="font-montserrat font-700 text-cream text-lg">{portfolio?.country_or_role || '—'}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {[
            { href: '/delegate-pass', icon: <Award size={20} />, label: 'View Delegate Pass', sublabel: 'QR Code & Details', color: 'text-gold', bg: 'bg-gold/10 border-gold/20 hover:bg-gold/15' },
            { href: '/schedule', icon: <Calendar size={20} />, label: 'Conference Schedule', sublabel: 'Timings & Agenda', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/15' },
            { href: '/committee-info', icon: <Info size={20} />, label: 'Committee Info', sublabel: 'Background & Resources', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20 hover:bg-purple-400/15' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`border rounded-2xl p-5 cursor-pointer transition-all duration-200 ${action.bg}`}
              >
                <div className={`mb-3 ${action.color}`}>{action.icon}</div>
                <p className="font-montserrat font-700 text-cream text-sm">{action.label}</p>
                <p className="font-montserrat text-xs text-white/40 mt-0.5">{action.sublabel}</p>
                <ChevronRight size={14} className={`mt-3 ${action.color}`} />
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Profile Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="yuva-card p-6"
        >
          <h3 className="form-section-title text-base mb-4">Registration Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Name', value: `${delegate.first_name} ${delegate.last_name}` },
              { label: 'Institution', value: delegate.institution },
              { label: 'Class / Year', value: delegate.class_year },
              { label: 'Committee Pref 1', value: delegate.pref1 || '—' },
              { label: 'Committee Pref 2', value: delegate.pref2 || '—' },
              { label: 'Amount Paid', value: `₹${delegate.amount_paid}` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-white/30 text-xs font-montserrat uppercase tracking-wider">{item.label}</p>
                <p className="text-cream text-sm font-montserrat font-500 mt-0.5 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
