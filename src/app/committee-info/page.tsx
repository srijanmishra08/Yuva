'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import type { Committee } from '@/types';

export default function CommitteeInfoPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    supabase.from('committees').select('*').order('name').then(({ data }) => {
      if (data) setCommittees(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-dark py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-gold text-sm font-montserrat transition-colors">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
        </div>

        <div className="text-center mb-10">
          <p className="text-gold/60 font-montserrat text-xs tracking-[5px] uppercase mb-2">YDS 2026</p>
          <h1 className="font-anton text-4xl text-cream tracking-wider">COMMITTEES</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {committees.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="yuva-card p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="font-impact text-3xl text-gold tracking-wider">{c.abbreviation}</span>
                <div className="flex items-center gap-1 text-white/30">
                  <Users size={14} />
                  <span className="font-montserrat text-xs">{c.max_seats} seats</span>
                </div>
              </div>
              <p className="font-montserrat font-600 text-cream text-sm">{c.name}</p>
              {c.description && (
                <p className="font-montserrat text-xs text-white/40 mt-2 leading-relaxed">{c.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
