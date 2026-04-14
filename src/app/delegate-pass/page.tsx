'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Download, Award, QrCode } from 'lucide-react';
import type { Delegate, Committee, Portfolio } from '@/types';
import toast from 'react-hot-toast';

export default function DelegatePassPage() {
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const passRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      
      const { data } = await supabase
        .from('delegates')
        .select('*')
        .eq('email', session.user.email)
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
        if (data.delegate_id) {
          // Fetch QR from API
          const res = await fetch(`/api/delegates/${data.id}/qr`);
          if (res.ok) {
            const blob = await res.blob();
            setQrDataUrl(URL.createObjectURL(blob));
          }
        }
      }
      setLoading(false);
    });
  }, []);

  async function downloadPass() {
    if (!passRef.current) return;
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(passRef.current, {
        backgroundColor: '#111827',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `${delegate?.delegate_id}-pass.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Pass downloaded!');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!delegate) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/50 font-montserrat mb-4">Please log in to view your delegate pass</p>
          <Link href="/dashboard" className="yuva-btn-primary inline-block">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-dark py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-gold text-sm font-montserrat transition-colors">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <motion.button
            onClick={downloadPass}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold rounded-xl px-4 py-2 text-sm font-montserrat font-600 transition-all"
          >
            <Download size={14} />
            Download Pass
          </motion.button>
        </div>

        {/* THE PASS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          ref={passRef}
        >
          <div className="delegate-pass rounded-3xl overflow-hidden" style={{ minHeight: '560px' }}>
            {/* Header Strip */}
            <div className="px-8 pt-8 pb-6" style={{
              background: 'linear-gradient(135deg, rgba(255,170,51,0.15) 0%, rgba(198,134,66,0.1) 100%)',
              borderBottom: '1px solid rgba(255,170,51,0.2)',
            }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-montserrat text-gold/60 text-xs tracking-[5px] uppercase mb-0.5">YUVA DIPLOMACY SUMMIT</p>
                  <h2 className="font-impact text-3xl text-cream tracking-widest">YDS 2026</h2>
                </div>
                <Award size={28} className="text-gold/60" />
              </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-6">
              <div className="flex gap-6">
                {/* Details */}
                <div className="flex-1 space-y-5">
                  <div>
                    <p className="text-white/30 text-xs font-montserrat uppercase tracking-widest mb-1">Delegate</p>
                    <p className="font-montserrat font-800 text-cream text-xl leading-tight">
                      {delegate.first_name} {delegate.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs font-montserrat uppercase tracking-widest mb-1">Institution</p>
                    <p className="font-montserrat font-500 text-white/80 text-sm">{delegate.institution}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs font-montserrat uppercase tracking-widest mb-1">Committee</p>
                    <p className="font-impact text-2xl text-gold tracking-wide">
                      {committee?.abbreviation || 'PENDING'}
                    </p>
                    <p className="font-montserrat text-xs text-white/40 mt-0.5">{committee?.name || 'Allotment Pending'}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs font-montserrat uppercase tracking-widest mb-1">Portfolio</p>
                    <p className="font-montserrat font-700 text-white/90 text-sm">
                      {portfolio?.country_or_role || 'Pending Allotment'}
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-cream/10 flex items-center justify-center border border-white/10">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode size={40} className="text-white/20" />
                    )}
                  </div>
                  <p className="text-white/20 text-xs font-montserrat text-center">Scan for check-in</p>
                </div>
              </div>

              {/* Delegate ID Bar */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/30 text-xs font-montserrat uppercase tracking-widest">Delegate ID</p>
                    <p className="font-impact text-3xl tracking-widest text-gold mt-0.5">{delegate.delegate_id}</p>
                  </div>
                  <div className="text-right">
                    {delegate.carnival_pass && (
                      <span className="badge-gold text-xs">🎡 Carnival Pass</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Strip */}
            <div className="px-8 py-4 bg-black/20 border-t border-white/5">
              <div className="flex items-center justify-between">
                <p className="font-montserrat text-white/20 text-xs">portal.funology.in</p>
                <p className="font-montserrat text-white/20 text-xs">YDS-2026-OFFICIAL</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Note */}
        {delegate.allotment_status === 'PENDING' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl"
          >
            <p className="text-yellow-400 text-sm font-montserrat text-center">
              ⏳ Committee allotment is in progress. Your pass will update once assigned.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
