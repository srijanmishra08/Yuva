'use client';

import { motion } from 'framer-motion';
import type { Committee, Portfolio } from '@/types';
import { RefreshCw } from 'lucide-react';

interface Props {
  committees: Committee[];
  portfolios: Portfolio[];
  onRefresh: () => void;
}

export default function AdminPortfolioMatrix({ committees, portfolios, onRefresh }: Props) {
  function getCommitteePortfolios(committeeId: string) {
    return portfolios.filter(p => p.committee_id === committeeId);
  }

  function getFilledCount(committeeId: string) {
    return portfolios.filter(p => p.committee_id === committeeId && p.is_assigned).length;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-montserrat font-700 text-cream text-lg">Committee Portfolio Matrix</h2>
          <p className="text-white/40 text-sm font-montserrat mt-0.5">Visual overview of all seat assignments</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-gold bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-xl px-4 py-2 text-sm font-montserrat font-600 transition-all"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {committees.map((committee, idx) => {
          const cPortfolios = getCommitteePortfolios(committee.id);
          const filled = getFilledCount(committee.id);
          const total = committee.max_seats;
          const fillPercent = (filled / total) * 100;

          return (
            <motion.div
              key={committee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="yuva-card p-6"
            >
              {/* Committee Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-impact text-2xl text-gold tracking-wide">{committee.abbreviation}</span>
                    <span className={`text-xs font-montserrat px-2 py-0.5 rounded-lg ${
                      fillPercent === 100 ? 'bg-red-500/20 text-red-400' :
                      fillPercent >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {filled}/{total} filled
                    </span>
                  </div>
                  <p className="font-montserrat text-xs text-white/40">{committee.name}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/10 rounded-full mb-5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercent}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.1 }}
                  className={`h-full rounded-full ${
                    fillPercent === 100 ? 'bg-red-500' :
                    fillPercent >= 70 ? 'bg-yellow-500' :
                    'bg-gradient-to-r from-green-500 to-gold'
                  }`}
                />
              </div>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-2 gap-2">
                {cPortfolios.map((portfolio) => (
                  <div
                    key={portfolio.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-montserrat transition-all ${
                      portfolio.is_assigned
                        ? 'portfolio-assigned'
                        : 'portfolio-available'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      portfolio.is_assigned ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className="truncate">{portfolio.country_or_role}</span>
                  </div>
                ))}
                
                {/* Empty seats */}
                {Array.from({ length: Math.max(0, total - cPortfolios.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-montserrat bg-white/3 border border-dashed border-white/10 text-white/20"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <span>Open Seat</span>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="font-montserrat text-xs text-white/40">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="font-montserrat text-xs text-white/40">Assigned</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
