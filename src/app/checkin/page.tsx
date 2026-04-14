'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle, XCircle, AlertCircle, Scan, User, Building2, Award } from 'lucide-react';
import type { CheckinResult } from '@/types';

export default function CheckinPage() {
  const [scanning, setScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<unknown>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      // In production, integrate with a QR scanning library like @zxing/browser
    } catch {
      toast.error('Camera access denied');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  async function processQRPayload(payload: string) {
    setLoading(true);
    try {
      const { data: authSession } = await supabase.auth.getSession();
      
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession.session ? { 'Authorization': `Bearer ${authSession.session.access_token}` } : {}),
        },
        body: JSON.stringify({ qr_payload: payload }),
      });

      const data: CheckinResult = await res.json();
      setResult(data);
      
      if (data.success) {
        if (data.already_checked_in) {
          toast('Already checked in', { icon: '⚠️' });
        } else {
          toast.success('Check-in successful!');
        }
      } else {
        toast.error(data.error || 'Check-in failed');
      }
    } catch {
      toast.error('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
      stopCamera();
    }
  }

  async function handleManualCheckin() {
    if (!manualInput.trim()) return;
    
    setLoading(true);
    try {
      const { data: authSession } = await supabase.auth.getSession();
      
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authSession.session ? { 'Authorization': `Bearer ${authSession.session.access_token}` } : {}),
        },
        body: JSON.stringify({ delegate_id: manualInput.trim().toUpperCase() }),
      });

      const data: CheckinResult = await res.json();
      setResult(data);
    } catch {
      toast.error('Check-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-charcoal-dark">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Scan size={28} className="text-gold" />
          </div>
          <p className="text-gold/60 font-montserrat text-xs tracking-[5px] uppercase mb-1">Entry Verification</p>
          <h1 className="font-anton text-3xl text-cream tracking-wider">QR CHECK-IN</h1>
          <p className="text-white/40 font-montserrat text-sm mt-1">YUVA Diplomacy Summit 2026</p>
        </div>

        {/* Camera Scanner */}
        <div className="yuva-card p-6 mb-5">
          <div className={`relative rounded-2xl overflow-hidden bg-charcoal-dark border ${scanning ? 'border-gold/50' : 'border-white/10'} aspect-square mb-4 flex items-center justify-center`}>
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold rounded-br-lg" />
                    <motion.div
                      animate={{ y: [0, 160, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-2 right-2 h-0.5 bg-gold/70"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center">
                <QrCode size={48} className="text-white/20 mx-auto mb-3" />
                <p className="font-montserrat text-white/30 text-sm">Camera preview</p>
              </div>
            )}
          </div>

          {!scanning ? (
            <motion.button
              onClick={startCamera}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="yuva-btn-primary w-full"
            >
              Start QR Scanner
            </motion.button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full py-3 rounded-xl border border-white/20 text-white/60 hover:text-white/80 font-montserrat text-sm transition-colors"
            >
              Stop Scanner
            </button>
          )}
        </div>

        {/* Manual Entry */}
        <div className="yuva-card p-5 mb-5">
          <p className="font-montserrat font-600 text-white/50 text-xs uppercase tracking-wider mb-3">Manual Entry (Delegate ID)</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value.toUpperCase())}
              className="yuva-input flex-1 font-impact tracking-widest text-gold"
              placeholder="YDS26-001"
              onKeyDown={(e) => e.key === 'Enter' && handleManualCheckin()}
            />
            <motion.button
              onClick={handleManualCheckin}
              disabled={!manualInput || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gold text-charcoal-dark font-montserrat font-700 rounded-xl px-5 py-3 disabled:opacity-50 transition-all"
            >
              {loading ? '...' : 'Check In'}
            </motion.button>
          </div>
        </div>

        {/* Result Card */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.delegate?.delegate_id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              {result.success ? (
                <div className={`yuva-card p-6 border ${result.already_checked_in ? 'border-yellow-500/40' : 'border-green-500/40'}`}>
                  <div className="flex items-center gap-3 mb-5">
                    {result.already_checked_in ? (
                      <AlertCircle size={24} className="text-yellow-400" />
                    ) : (
                      <CheckCircle size={24} className="text-green-400" />
                    )}
                    <div>
                      <p className={`font-montserrat font-800 text-base ${result.already_checked_in ? 'text-yellow-400' : 'text-green-400'}`}>
                        {result.already_checked_in ? 'Already Checked In' : 'Check-In Successful!'}
                      </p>
                      {result.delegate?.checkin_time && (
                        <p className="font-montserrat text-xs text-white/30 mt-0.5">
                          at {new Date(result.delegate.checkin_time).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {result.delegate && (
                    <div className="space-y-3">
                      <InfoRow icon={<User size={14} />} label="Delegate" value={result.delegate.name} />
                      <InfoRow icon={<Building2 size={14} />} label="Institution" value={result.delegate.institution} />
                      <InfoRow icon={<Award size={14} />} label="Committee" value={result.delegate.committee || 'Pending'} />
                      <InfoRow icon={<Award size={14} />} label="Portfolio" value={result.delegate.portfolio || 'Pending'} />
                      <div className="pt-3 border-t border-white/10">
                        <p className="font-impact text-3xl tracking-widest text-gold">{result.delegate.delegate_id}</p>
                      </div>
                    </div>
                  )}

                  {!result.already_checked_in && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setResult(null); setManualInput(''); }}
                      className="mt-5 w-full py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-montserrat font-600 text-sm transition-all hover:bg-green-500/15"
                    >
                      Scan Next Delegate →
                    </motion.button>
                  )}
                </div>
              ) : (
                <div className="yuva-card p-6 border border-red-500/40">
                  <div className="flex items-center gap-3">
                    <XCircle size={24} className="text-red-400" />
                    <div>
                      <p className="font-montserrat font-800 text-red-400">Check-In Failed</p>
                      <p className="font-montserrat text-sm text-white/50 mt-0.5">{result.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-white/30">{icon}</div>
      <div className="flex-1 flex items-center justify-between">
        <span className="font-montserrat text-xs text-white/30 uppercase tracking-wider">{label}</span>
        <span className="font-montserrat text-sm font-600 text-cream">{value}</span>
      </div>
    </div>
  );
}
