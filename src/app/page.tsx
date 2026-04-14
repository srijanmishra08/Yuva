'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-charcoal-dark flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bronze/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,170,51,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-montserrat text-sm tracking-[6px] text-gold/70 uppercase mb-4">
            Official Conference Portal
          </p>
          <h1 className="font-anton text-7xl md:text-9xl tracking-wider mb-2" style={{
            background: 'linear-gradient(135deg, #FFAA33 0%, #C68642 50%, #FFAA33 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            YUVA
          </h1>
          <h2 className="font-impact text-3xl md:text-5xl text-cream tracking-widest uppercase mb-2">
            Diplomacy Summit
          </h2>
          <p className="font-montserrat text-gold/80 text-xl tracking-[8px] mb-12">
            YDS 2026
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,170,51,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="yuva-btn-primary text-lg font-montserrat font-800"
            >
              Register Now — ₹499
            </motion.button>
          </Link>
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="yuva-btn-outline text-lg"
            >
              Delegate Login
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { label: 'Committees', value: '6' },
            { label: 'Delegates', value: '120+' },
            { label: 'Portfolios', value: '100+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-anton text-3xl text-gold">{stat.value}</p>
              <p className="font-montserrat text-xs text-white/40 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-center"
        >
          <Link href="/admin/login" className="text-white/20 hover:text-white/40 text-xs font-montserrat transition-colors">
            Admin Access
          </Link>
        </motion.div>
      </div>

      {/* Gold accent lines */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </main>
  );
}
