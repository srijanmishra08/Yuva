'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronRight, Globe, Users, Save } from 'lucide-react';
import { SectionHeader, Field } from './EventSettings';
import type { Committee, Portfolio } from '@/types';

interface CommitteeWithPortfolios extends Committee {
  portfolios: Portfolio[];
  isExpanded?: boolean;
}

export default function CommitteeManager({ token }: { token: string }) {
  const [committees, setCommittees] = useState<CommitteeWithPortfolios[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCommittee, setShowAddCommittee] = useState(false);
  const [newCommittee, setNewCommittee] = useState({ name: '', abbreviation: '', description: '', max_seats: 25 });
  const [editingCommittee, setEditingCommittee] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Committee>>({});
  const [newPortfolioInputs, setNewPortfolioInputs] = useState<Record<string, string>>({});
  const [bulkPortfolioInput, setBulkPortfolioInput] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/superadmin/committees', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCommittees((data.committees || []).map((c: CommitteeWithPortfolios) => ({ ...c, isExpanded: false })));
    setLoading(false);
  }

  function toggleExpand(id: string) {
    setCommittees(prev => prev.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded } : c));
  }

  async function addCommittee() {
    if (!newCommittee.name || !newCommittee.abbreviation) {
      toast.error('Name and abbreviation are required');
      return;
    }
    setSaving('new');
    const res = await fetch('/api/superadmin/committees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newCommittee),
    });
    if (res.ok) {
      toast.success('Committee added!');
      setNewCommittee({ name: '', abbreviation: '', description: '', max_seats: 25 });
      setShowAddCommittee(false);
      load();
    } else {
      const e = await res.json();
      toast.error(e.error || 'Failed to add committee');
    }
    setSaving(null);
  }

  async function updateCommittee(id: string) {
    setSaving(id);
    const res = await fetch(`/api/superadmin/committees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editValues),
    });
    if (res.ok) {
      toast.success('Committee updated!');
      setEditingCommittee(null);
      load();
    } else toast.error('Failed to update');
    setSaving(null);
  }

  async function deleteCommittee(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all its portfolios. This cannot be undone.`)) return;
    const res = await fetch(`/api/superadmin/committees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success('Committee deleted'); load(); }
    else toast.error('Cannot delete — delegates may be assigned to this committee');
  }

  async function addPortfolio(committeeId: string) {
    const val = newPortfolioInputs[committeeId]?.trim();
    if (!val) return;
    const res = await fetch('/api/superadmin/portfolios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ committee_id: committeeId, country_or_role: val }),
    });
    if (res.ok) {
      toast.success('Portfolio added');
      setNewPortfolioInputs(prev => ({ ...prev, [committeeId]: '' }));
      load();
    } else toast.error('Failed to add portfolio');
  }

  async function bulkAddPortfolios(committeeId: string) {
    const raw = bulkPortfolioInput[committeeId] || '';
    const entries = raw.split('\n').map(s => s.trim()).filter(Boolean);
    if (!entries.length) return;
    const res = await fetch('/api/superadmin/portfolios/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ committee_id: committeeId, entries }),
    });
    if (res.ok) {
      const d = await res.json();
      toast.success(`Added ${d.added} portfolios`);
      setBulkPortfolioInput(prev => ({ ...prev, [committeeId]: '' }));
      load();
    } else toast.error('Bulk add failed');
  }

  async function deletePortfolio(id: string) {
    const res = await fetch(`/api/superadmin/portfolios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success('Portfolio removed'); load(); }
    else toast.error('Cannot delete — portfolio may be assigned');
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="yuva-card p-5 skeleton h-16" />)}
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader
          icon={<Globe size={18} />}
          title="Committee & Portfolio Manager"
          description="Add, edit or delete committees and their portfolio seats"
        />
        <motion.button
          onClick={() => setShowAddCommittee(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-4 py-2.5 flex-shrink-0 ml-4"
        >
          <Plus size={14} /> Add Committee
        </motion.button>
      </div>

      {/* Add Committee Form */}
      <AnimatePresence>
        {showAddCommittee && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="yuva-card p-6 border border-gold/30"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-montserrat font-700 text-gold text-sm uppercase tracking-wider">New Committee</p>
              <button onClick={() => setShowAddCommittee(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Committee Name">
                <input className="yuva-input" placeholder="United Nations Human Rights Council"
                  value={newCommittee.name} onChange={e => setNewCommittee({ ...newCommittee, name: e.target.value })} />
              </Field>
              <Field label="Abbreviation">
                <input className="yuva-input" placeholder="UNHRC"
                  value={newCommittee.abbreviation} onChange={e => setNewCommittee({ ...newCommittee, abbreviation: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Description (Optional)">
                <input className="yuva-input" placeholder="Brief description..."
                  value={newCommittee.description} onChange={e => setNewCommittee({ ...newCommittee, description: e.target.value })} />
              </Field>
              <Field label="Max Seats">
                <input className="yuva-input" type="number" min={1} max={100}
                  value={newCommittee.max_seats} onChange={e => setNewCommittee({ ...newCommittee, max_seats: parseInt(e.target.value) })} />
              </Field>
            </div>
            <div className="flex gap-3">
              <button onClick={addCommittee} disabled={saving === 'new'}
                className="bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5 hover:bg-gold-light transition-all disabled:opacity-50">
                {saving === 'new' ? 'Adding...' : 'Add Committee'}
              </button>
              <button onClick={() => setShowAddCommittee(false)} className="text-white/40 hover:text-white/60 text-sm font-montserrat transition-colors px-4">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Committee List */}
      <div className="space-y-3">
        {committees.map((committee) => {
          const filledCount = committee.portfolios?.filter(p => p.is_assigned).length ?? 0;
          const totalPortfolios = committee.portfolios?.length ?? 0;
          const fillPct = totalPortfolios > 0 ? (filledCount / totalPortfolios) * 100 : 0;

          return (
            <motion.div
              key={committee.id}
              layout
              className="yuva-card overflow-hidden"
            >
              {/* Committee Header Row */}
              <div className="p-5">
                {editingCommittee === committee.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name">
                        <input className="yuva-input text-sm" value={editValues.name ?? committee.name}
                          onChange={e => setEditValues({ ...editValues, name: e.target.value })} />
                      </Field>
                      <Field label="Abbreviation">
                        <input className="yuva-input text-sm" value={editValues.abbreviation ?? committee.abbreviation}
                          onChange={e => setEditValues({ ...editValues, abbreviation: e.target.value.toUpperCase() })} />
                      </Field>
                      <Field label="Description">
                        <input className="yuva-input text-sm" value={editValues.description ?? committee.description ?? ''}
                          onChange={e => setEditValues({ ...editValues, description: e.target.value })} />
                      </Field>
                      <Field label="Max Seats">
                        <input className="yuva-input text-sm" type="number"
                          value={editValues.max_seats ?? committee.max_seats}
                          onChange={e => setEditValues({ ...editValues, max_seats: parseInt(e.target.value) })} />
                      </Field>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateCommittee(committee.id)}
                        className="flex items-center gap-1.5 bg-gold text-charcoal-dark text-xs font-montserrat font-700 rounded-lg px-3 py-2">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingCommittee(null)}
                        className="text-white/40 hover:text-white/60 text-xs font-montserrat px-3 py-2">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleExpand(committee.id)} className="flex items-center gap-3 flex-1 text-left">
                      <div className="flex-shrink-0">
                        {committee.isExpanded
                          ? <ChevronDown size={16} className="text-white/40" />
                          : <ChevronRight size={16} className="text-white/40" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-impact text-xl text-gold tracking-wide">{committee.abbreviation}</span>
                          <span className="font-montserrat text-sm text-white/70">{committee.name}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex-1 max-w-[180px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-gold to-bronze rounded-full transition-all"
                              style={{ width: `${fillPct}%` }} />
                          </div>
                          <span className="text-xs text-white/40 font-montserrat">
                            {totalPortfolios}/{committee.max_seats} seats · {filledCount} assigned
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setEditingCommittee(committee.id); setEditValues({}); }}
                        className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-gold hover:bg-gold/10 transition-all"
                      ><Edit3 size={13} /></button>
                      <button
                        onClick={() => deleteCommittee(committee.id, committee.name)}
                        className="p-2 rounded-lg bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      ><Trash2 size={13} /></button>
                    </div>
                  </div>
                )}
              </div>

              {/* Portfolios Expand */}
              <AnimatePresence>
                {committee.isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-white/10"
                  >
                    <div className="p-5 bg-charcoal-dark/40">
                      <p className="font-montserrat font-600 text-white/40 text-xs uppercase tracking-wider mb-4">
                        Portfolios ({totalPortfolios})
                      </p>

                      {/* Portfolio grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-5">
                        {(committee.portfolios || []).map(p => (
                          <div key={p.id}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 border text-xs font-montserrat ${
                              p.is_assigned
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-green-500/10 border-green-500/20 text-green-400'
                            }`}
                          >
                            <span className="truncate">{p.country_or_role}</span>
                            {!p.is_assigned && (
                              <button
                                onClick={() => deletePortfolio(p.id)}
                                className="ml-2 opacity-40 hover:opacity-100 flex-shrink-0 transition-opacity"
                              ><X size={10} /></button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add single portfolio */}
                      <div className="flex gap-2 mb-4">
                        <input
                          className="yuva-input text-sm flex-1"
                          placeholder="Add portfolio (e.g., India, Chair, Press)"
                          value={newPortfolioInputs[committee.id] || ''}
                          onChange={e => setNewPortfolioInputs(prev => ({ ...prev, [committee.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addPortfolio(committee.id)}
                        />
                        <button
                          onClick={() => addPortfolio(committee.id)}
                          className="flex items-center gap-1.5 bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 rounded-xl px-4 text-sm font-montserrat font-600 transition-all"
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>

                      {/* Bulk add */}
                      <details className="group">
                        <summary className="font-montserrat text-xs text-white/30 hover:text-white/50 cursor-pointer transition-colors mb-2">
                          ▶ Bulk add (one per line)
                        </summary>
                        <div className="mt-2 space-y-2">
                          <textarea
                            className="yuva-input text-sm min-h-[100px] resize-none"
                            placeholder={"United States of America\nChina\nIndia\nRussian Federation"}
                            value={bulkPortfolioInput[committee.id] || ''}
                            onChange={e => setBulkPortfolioInput(prev => ({ ...prev, [committee.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => bulkAddPortfolios(committee.id)}
                            className="text-sm font-montserrat font-600 text-gold bg-gold/10 hover:bg-gold/20 border border-gold/20 rounded-xl px-4 py-2 transition-all"
                          >
                            Bulk Add Portfolios
                          </button>
                        </div>
                      </details>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {committees.length === 0 && (
          <div className="text-center py-12 text-white/20 font-montserrat">
            No committees yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
