'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Send, Filter, Users, Eye, Code, ChevronDown, X, Plus,
  Clock, CheckCircle, XCircle, Loader2, Mail, RefreshCw,
  Tag, BookOpen, Sparkles, AlertTriangle, History, Inbox,
} from 'lucide-react';
import { SectionHeader } from './EventSettings';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BlastFilter {
  committees: string[];
  class_year_contains: string;
  cities: string[];
  payment_status: string;
  allotment_status: string;
  checked_in: string;
  carnival_pass: string;
  portfolio_contains: string;
  referred_by_contains: string;
}

interface PreviewDelegate {
  id: string;
  delegate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  institution: string;
  class_year: string;
  city: string;
  committee_abbr?: string;
  portfolio_name?: string;
}

interface BlastRecord {
  id: string;
  subject: string;
  filters: BlastFilter;
  recipient_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_count: number;
  failed_count: number;
  sent_at: string | null;
  created_at: string;
}

const EMPTY_FILTER: BlastFilter = {
  committees: [],
  class_year_contains: '',
  cities: [],
  payment_status: '',
  allotment_status: '',
  checked_in: '',
  carnival_pass: '',
  portfolio_contains: '',
  referred_by_contains: '',
};

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1F2937 0%, #111827 100%); padding: 36px 40px; text-align: center; }
    .header h1 { color: #FFAA33; font-size: 13px; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 8px; }
    .header h2 { color: #FFF6ED; font-size: 26px; margin: 0; font-weight: 700; }
    .body { padding: 36px 40px; color: #374151; line-height: 1.7; font-size: 15px; }
    .body p { margin: 0 0 16px; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { background: #FFAA33; color: #1F2937; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 15px; }
    .footer { background: #F9FAFB; padding: 20px 40px; text-align: center; color: #9CA3AF; font-size: 12px; border-top: 1px solid #E5E7EB; }
    .badge { display: inline-block; background: #FFF6ED; border: 1px solid #FFAA33; color: #92400E; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>YUVA Diplomacy Summit</h1>
      <h2>Important Announcement</h2>
    </div>
    <div class="body">
      <p>Dear {{first_name}},</p>
      <p>Write your announcement here. You can use delegate variables like <strong>{{delegate_id}}</strong>, <strong>{{committee}}</strong>, and <strong>{{portfolio}}</strong>.</p>
      <p>Regards,<br /><strong>The YDS Organizing Committee</strong></p>
    </div>
    <div class="footer">
      YUVA Diplomacy Summit · This email was sent to {{email}}<br />
      Delegate ID: {{delegate_id}}
    </div>
  </div>
</body>
</html>`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 bg-gold/15 border border-gold/30 text-gold text-xs font-montserrat px-2.5 py-1 rounded-lg">
      {label}
      <button onClick={onRemove} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={10} />
      </button>
    </span>
  );
}

function Select({ value, onChange, children, placeholder }: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        className="yuva-select pr-8 text-sm w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmailBlast({ token }: { token: string }) {
  const [view, setView] = useState<'compose' | 'history'>('compose');

  // Filter state
  const [filters, setFilters] = useState<BlastFilter>({ ...EMPTY_FILTER });
  const [committeeInput, setCommitteeInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [availableCommittees, setAvailableCommittees] = useState<{ id: string; name: string; abbreviation: string }[]>([]);

  // Audience preview
  const [preview, setPreview] = useState<PreviewDelegate[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const PAGE_SIZE = 8;

  // Compose state
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [bodyHtml, setBodyHtml] = useState(DEFAULT_HTML);
  const [editorMode, setEditorMode] = useState<'code' | 'preview'>('code');

  // Send state
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // History
  const [history, setHistory] = useState<BlastRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const TEMPLATE_VARS = ['first_name', 'last_name', 'delegate_id', 'committee', 'portfolio', 'institution', 'email', 'city'];

  // Load committees on mount
  useEffect(() => {
    fetch('/api/superadmin/committees', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAvailableCommittees(d.committees || []));
  }, [token]);

  // Debounced audience preview whenever filters change
  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewPage(0);
    try {
      const res = await fetch('/api/superadmin/email-blast/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filters }),
      });
      const data = await res.json();
      setPreview(data.delegates || []);
    } catch {
      setPreview([]);
    } finally {
      setPreviewLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    const t = setTimeout(loadPreview, 400);
    return () => clearTimeout(t);
  }, [loadPreview]);

  async function loadHistory() {
    setHistoryLoading(true);
    const res = await fetch('/api/superadmin/email-blast/history', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setHistory(data.blasts || []);
    setHistoryLoading(false);
  }

  useEffect(() => {
    if (view === 'history') loadHistory();
  }, [view]);

  function addCommittee(abbr: string) {
    if (abbr && !filters.committees.includes(abbr)) {
      setFilters(f => ({ ...f, committees: [...f.committees, abbr] }));
    }
    setCommitteeInput('');
  }

  function addCity() {
    const c = cityInput.trim();
    if (c && !filters.cities.includes(c)) {
      setFilters(f => ({ ...f, cities: [...f.cities, c] }));
    }
    setCityInput('');
  }

  function clearFilters() {
    setFilters({ ...EMPTY_FILTER });
  }

  function insertVar(v: string) {
    setBodyHtml(h => h + `{{${v}}}`);
  }

  const activeFilterCount = [
    filters.committees.length > 0,
    !!filters.class_year_contains,
    filters.cities.length > 0,
    !!filters.payment_status,
    !!filters.allotment_status,
    !!filters.checked_in,
    !!filters.carnival_pass,
    !!filters.portfolio_contains,
    !!filters.referred_by_contains,
  ].filter(Boolean).length;

  async function send() {
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!bodyHtml.trim()) { toast.error('Email body is required'); return; }
    if (preview.length === 0) { toast.error('No recipients match your filters'); return; }
    setConfirmOpen(true);
  }

  async function confirmSend() {
    setConfirmOpen(false);
    setSending(true);
    try {
      const res = await fetch('/api/superadmin/email-blast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, preview_text: previewText, body_html: bodyHtml, filters }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ Sent to ${data.sent_count} delegates!`);
        if (data.failed_count > 0) toast.error(`${data.failed_count} failed — check history for details`);
        setSubject('');
        setPreviewText('');
        setBodyHtml(DEFAULT_HTML);
        clearFilters();
        setView('history');
      } else {
        toast.error(data.error || 'Send failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  }

  const pagedPreview = preview.slice(previewPage * PAGE_SIZE, (previewPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(preview.length / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header + view toggle */}
      <div className="flex items-start justify-between">
        <SectionHeader
          icon={<Mail size={18} />}
          title="Email Blast"
          description="Send targeted announcements to delegates with precision filters"
        />
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 ml-4 flex-shrink-0">
          <button
            onClick={() => setView('compose')}
            className={`flex items-center gap-1.5 text-xs font-montserrat font-600 px-3 py-1.5 rounded-lg transition-all ${
              view === 'compose' ? 'bg-gold text-charcoal-dark' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Sparkles size={12} /> Compose
          </button>
          <button
            onClick={() => setView('history')}
            className={`flex items-center gap-1.5 text-xs font-montserrat font-600 px-3 py-1.5 rounded-lg transition-all ${
              view === 'history' ? 'bg-gold text-charcoal-dark' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <History size={12} /> History
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'compose' ? (
          <motion.div
            key="compose"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-5 gap-6"
          >
            {/* ── LEFT: Filters + Audience ── */}
            <div className="col-span-2 space-y-4">

              {/* Filter builder */}
              <div className="yuva-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gold" />
                    <p className="font-montserrat font-700 text-cream text-sm">Audience Filters</p>
                    {activeFilterCount > 0 && (
                      <span className="bg-gold text-charcoal-dark text-xs font-montserrat font-700 px-2 py-0.5 rounded-full">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-white/30 hover:text-red-400 font-montserrat transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="p-5 space-y-5">

                  {/* Committee filter */}
                  <div>
                    <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                      Committee
                    </label>
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <select
                          className="yuva-select text-sm w-full pr-8"
                          value={committeeInput}
                          onChange={e => { addCommittee(e.target.value); e.target.value = ''; }}
                        >
                          <option value="">Select committee…</option>
                          {availableCommittees
                            .filter(c => !filters.committees.includes(c.abbreviation))
                            .map(c => (
                              <option key={c.id} value={c.abbreviation}>
                                {c.abbreviation} — {c.name}
                              </option>
                            ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                      </div>
                    </div>
                    {filters.committees.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {filters.committees.map(c => (
                          <FilterTag
                            key={c}
                            label={c}
                            onRemove={() => setFilters(f => ({ ...f, committees: f.committees.filter(x => x !== c) }))}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Portfolio contains */}
                  <div>
                    <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                      Portfolio contains
                    </label>
                    <input
                      className="yuva-input text-sm"
                      placeholder="e.g. India, Chair, Press"
                      value={filters.portfolio_contains}
                      onChange={e => setFilters(f => ({ ...f, portfolio_contains: e.target.value }))}
                    />
                  </div>

                  {/* Class/Year filter */}
                  <div>
                    <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                      Class / Year contains
                    </label>
                    <input
                      className="yuva-input text-sm"
                      placeholder="e.g. 9, 10, B.A., 2nd Year"
                      value={filters.class_year_contains}
                      onChange={e => setFilters(f => ({ ...f, class_year_contains: e.target.value }))}
                    />
                    <p className="text-white/20 text-xs font-montserrat mt-1">Partial match — "9" matches "Class 9", "Class 12 Science" etc.</p>
                  </div>

                  {/* City filter */}
                  <div>
                    <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                      City
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="yuva-input text-sm flex-1"
                        placeholder="Type city and press Enter"
                        value={cityInput}
                        onChange={e => setCityInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCity()}
                      />
                      <button
                        onClick={addCity}
                        className="px-3 bg-white/8 hover:bg-white/12 text-white/40 hover:text-cream border border-white/15 rounded-xl transition-all"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {filters.cities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {filters.cities.map(c => (
                          <FilterTag
                            key={c}
                            label={c}
                            onRemove={() => setFilters(f => ({ ...f, cities: f.cities.filter(x => x !== c) }))}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status filters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Payment</label>
                      <Select value={filters.payment_status} onChange={v => setFilters(f => ({ ...f, payment_status: v }))} placeholder="Any">
                        <option value="VERIFIED">Verified ✅</option>
                        <option value="PENDING">Pending ⏳</option>
                        <option value="FAILED">Failed ❌</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Allotment</label>
                      <Select value={filters.allotment_status} onChange={v => setFilters(f => ({ ...f, allotment_status: v }))} placeholder="Any">
                        <option value="ASSIGNED">Assigned 🏛️</option>
                        <option value="PENDING">Pending ⏳</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Checked In</label>
                      <Select value={filters.checked_in} onChange={v => setFilters(f => ({ ...f, checked_in: v }))} placeholder="Any">
                        <option value="true">Yes ✅</option>
                        <option value="false">No ❌</option>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Carnival Pass</label>
                      <Select value={filters.carnival_pass} onChange={v => setFilters(f => ({ ...f, carnival_pass: v }))} placeholder="Any">
                        <option value="true">Has Pass 🎡</option>
                        <option value="false">No Pass</option>
                      </Select>
                    </div>
                  </div>

                  {/* Referred by */}
                  <div>
                    <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                      Referred by contains
                    </label>
                    <input
                      className="yuva-input text-sm"
                      placeholder="e.g. Ravi, School Name"
                      value={filters.referred_by_contains}
                      onChange={e => setFilters(f => ({ ...f, referred_by_contains: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Live Audience Preview */}
              <div className="yuva-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-blue-400" />
                    <p className="font-montserrat font-700 text-cream text-sm">
                      Audience
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {previewLoading
                      ? <Loader2 size={13} className="text-white/30 animate-spin" />
                      : (
                        <span className={`font-impact text-xl ${preview.length > 0 ? 'text-gold' : 'text-white/20'}`}>
                          {preview.length}
                        </span>
                      )
                    }
                    <span className="text-white/30 text-xs font-montserrat">recipients</span>
                    <button onClick={loadPreview} className="p-1 text-white/20 hover:text-white/50 transition-colors">
                      <RefreshCw size={12} />
                    </button>
                  </div>
                </div>

                {preview.length === 0 && !previewLoading ? (
                  <div className="px-5 py-8 text-center">
                    <Inbox size={28} className="mx-auto text-white/10 mb-2" />
                    <p className="text-white/20 text-xs font-montserrat">
                      {activeFilterCount === 0 ? 'No filters — showing all verified delegates' : 'No delegates match these filters'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-white/5">
                      {previewLoading
                        ? [...Array(4)].map((_, i) => (
                          <div key={i} className="px-5 py-3 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg skeleton" />
                            <div className="flex-1 space-y-1.5">
                              <div className="skeleton h-3 w-28 rounded" />
                              <div className="skeleton h-2.5 w-40 rounded" />
                            </div>
                          </div>
                        ))
                        : pagedPreview.map(d => (
                          <div key={d.id} className="px-5 py-3 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-gold text-xs font-impact">
                                {d.first_name[0]}{d.last_name[0]}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-montserrat font-600 text-cream text-xs">
                                {d.first_name} {d.last_name}
                                <span className="text-white/30 font-400 ml-1.5">{d.delegate_id}</span>
                              </p>
                              <p className="text-white/30 text-xs font-montserrat truncate">{d.email}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {d.committee_abbr && (
                                  <span className="text-[10px] font-montserrat bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                    {d.committee_abbr}
                                  </span>
                                )}
                                {d.portfolio_name && (
                                  <span className="text-[10px] font-montserrat bg-white/5 text-white/40 px-1.5 py-0.5 rounded">
                                    {d.portfolio_name}
                                  </span>
                                )}
                                {d.class_year && (
                                  <span className="text-[10px] font-montserrat bg-white/5 text-white/30 px-1.5 py-0.5 rounded">
                                    {d.class_year}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                        <button
                          onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                          disabled={previewPage === 0}
                          className="text-xs font-montserrat text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                        >← Prev</button>
                        <span className="text-xs font-montserrat text-white/30">
                          {previewPage + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={previewPage === totalPages - 1}
                          className="text-xs font-montserrat text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
                        >Next →</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── RIGHT: Compose ── */}
            <div className="col-span-3 space-y-4">
              {/* Subject + Preview text */}
              <div className="yuva-card p-6 space-y-4">
                <div>
                  <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                    Email Subject *
                  </label>
                  <input
                    className="yuva-input text-base font-montserrat font-600"
                    placeholder="Important Update — YUVA Diplomacy Summit"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">
                    Preview Text <span className="text-white/20 normal-case">(shown in inbox under subject)</span>
                  </label>
                  <input
                    className="yuva-input text-sm"
                    placeholder="A quick update for all delegates…"
                    value={previewText}
                    onChange={e => setPreviewText(e.target.value)}
                  />
                </div>
              </div>

              {/* Body editor */}
              <div className="yuva-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                    <button
                      onClick={() => setEditorMode('code')}
                      className={`flex items-center gap-1.5 text-xs font-montserrat font-600 px-3 py-1.5 rounded-md transition-all ${
                        editorMode === 'code' ? 'bg-white/15 text-cream' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Code size={11} /> HTML
                    </button>
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={`flex items-center gap-1.5 text-xs font-montserrat font-600 px-3 py-1.5 rounded-md transition-all ${
                        editorMode === 'preview' ? 'bg-white/15 text-cream' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      <Eye size={11} /> Preview
                    </button>
                  </div>

                  {/* Variable inserter */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Tag size={11} className="text-white/30" />
                    {TEMPLATE_VARS.map(v => (
                      <button
                        key={v}
                        onClick={() => insertVar(v)}
                        className="text-[10px] font-montserrat bg-gold/10 text-gold border border-gold/20 rounded px-1.5 py-0.5 hover:bg-gold/20 transition-all"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {editorMode === 'code' ? (
                  <textarea
                    className="w-full bg-transparent text-white/80 font-mono text-xs leading-relaxed p-5 focus:outline-none resize-none"
                    style={{ minHeight: '460px' }}
                    value={bodyHtml}
                    onChange={e => setBodyHtml(e.target.value)}
                    spellCheck={false}
                    placeholder="<!DOCTYPE html>..."
                  />
                ) : (
                  <iframe
                    srcDoc={bodyHtml
                      .replace(/\{\{first_name\}\}/g, 'Arjun')
                      .replace(/\{\{last_name\}\}/g, 'Sharma')
                      .replace(/\{\{delegate_id\}\}/g, 'YDS26-001')
                      .replace(/\{\{committee\}\}/g, 'UNHRC')
                      .replace(/\{\{portfolio\}\}/g, 'India')
                      .replace(/\{\{institution\}\}/g, 'Delhi Public School')
                      .replace(/\{\{email\}\}/g, 'arjun@example.com')
                      .replace(/\{\{city\}\}/g, 'New Delhi')
                    }
                    className="w-full bg-white border-0"
                    style={{ minHeight: '460px' }}
                    title="Email Preview"
                  />
                )}
              </div>

              {/* Send button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${preview.length > 0 ? 'bg-green-400' : 'bg-white/20'}`} />
                  <span className="font-montserrat text-sm text-white/40">
                    {previewLoading
                      ? 'Calculating audience…'
                      : preview.length > 0
                        ? `Ready to send to ${preview.length} delegate${preview.length !== 1 ? 's' : ''}`
                        : 'No recipients — adjust filters'
                    }
                  </span>
                </div>
                <motion.button
                  onClick={send}
                  disabled={sending || preview.length === 0 || !subject.trim()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 px-6 py-3 rounded-xl hover:bg-gold-light transition-all disabled:opacity-40"
                >
                  {sending
                    ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                    : <><Send size={15} /> Send Blast</>
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          // ── HISTORY VIEW ──
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {historyLoading
              ? [...Array(4)].map((_, i) => <div key={i} className="yuva-card p-5 skeleton h-20" />)
              : history.length === 0
                ? (
                  <div className="text-center py-16">
                    <History size={36} className="mx-auto text-white/10 mb-3" />
                    <p className="text-white/20 font-montserrat text-sm">No blasts sent yet</p>
                  </div>
                )
                : history.map(blast => (
                  <BlastHistoryRow key={blast.id} blast={blast} />
                ))
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm Dialog ── */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-charcoal-dark border border-white/15 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-montserrat font-700 text-cream">Confirm Send</p>
                  <p className="font-montserrat text-xs text-white/30">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm font-montserrat">
                  <span className="text-white/40">Subject</span>
                  <span className="text-cream font-600 truncate max-w-[260px]">{subject}</span>
                </div>
                <div className="flex justify-between text-sm font-montserrat">
                  <span className="text-white/40">Recipients</span>
                  <span className="text-gold font-700">{preview.length} delegates</span>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex justify-between text-sm font-montserrat">
                    <span className="text-white/40">Filters</span>
                    <span className="text-white/60">{activeFilterCount} active</span>
                  </div>
                )}
              </div>

              <p className="font-montserrat text-xs text-white/30 mb-5">
                This will immediately send the email to all {preview.length} matching delegates. Real email addresses will be used.
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={confirmSend}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex items-center justify-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 py-3 rounded-xl"
                >
                  <Send size={14} /> Confirm Send
                </motion.button>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-5 text-white/40 hover:text-white/60 font-montserrat text-sm border border-white/15 hover:border-white/25 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── History row ──────────────────────────────────────────────────────────────

function BlastHistoryRow({ blast }: { blast: BlastRecord }) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    sent:    { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Sent' },
    sending: { icon: Loader2,     color: 'text-blue-400',  bg: 'bg-blue-400/10',  label: 'Sending…' },
    failed:  { icon: XCircle,     color: 'text-red-400',   bg: 'bg-red-400/10',   label: 'Failed' },
    draft:   { icon: BookOpen,    color: 'text-white/40',  bg: 'bg-white/5',      label: 'Draft' },
  }[blast.status] ?? { icon: BookOpen, color: 'text-white/40', bg: 'bg-white/5', label: blast.status };

  const filters = blast.filters as BlastFilter;
  const filterTags: string[] = [
    ...(filters.committees || []),
    filters.class_year_contains ? `Class: ${filters.class_year_contains}` : '',
    ...(filters.cities || []),
    filters.payment_status ? `Payment: ${filters.payment_status}` : '',
    filters.allotment_status ? `Allotment: ${filters.allotment_status}` : '',
    filters.portfolio_contains ? `Portfolio: ${filters.portfolio_contains}` : '',
  ].filter(Boolean);

  return (
    <div className="yuva-card overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-8 h-8 rounded-lg ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
          <statusConfig.icon size={15} className={`${statusConfig.color} ${blast.status === 'sending' ? 'animate-spin' : ''}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-montserrat font-700 text-cream text-sm truncate">{blast.subject}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {filterTags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] font-montserrat bg-white/6 text-white/40 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {filterTags.length > 4 && (
              <span className="text-[10px] font-montserrat text-white/20">+{filterTags.length - 4} more</span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2 justify-end">
            <span className={`text-xs font-montserrat font-600 ${statusConfig.color}`}>{statusConfig.label}</span>
            <span className="text-white/20 text-xs font-montserrat">|</span>
            <span className="font-impact text-lg text-gold">{blast.recipient_count}</span>
            <span className="text-white/30 text-xs font-montserrat">sent</span>
          </div>
          {blast.failed_count > 0 && (
            <p className="text-red-400 text-xs font-montserrat">{blast.failed_count} failed</p>
          )}
          <p className="text-white/20 text-xs font-montserrat mt-0.5 flex items-center gap-1 justify-end">
            <Clock size={10} />
            {blast.sent_at
              ? new Date(blast.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
              : new Date(blast.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`text-white/20 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-5 bg-charcoal-dark/40 space-y-4">
              {/* Filter summary */}
              <div>
                <p className="text-white/30 text-xs font-montserrat uppercase tracking-wider mb-2">Filters Used</p>
                {filterTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {filterTags.map(tag => (
                      <span key={tag} className="text-xs font-montserrat bg-gold/10 text-gold border border-gold/20 px-2.5 py-1 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/20 text-xs font-montserrat">No filters — sent to all verified delegates</p>
                )}
              </div>

              {/* Delivery stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="font-impact text-2xl text-gold">{blast.recipient_count}</p>
                  <p className="text-white/30 text-xs font-montserrat mt-0.5">Targeted</p>
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                  <p className="font-impact text-2xl text-green-400">{blast.sent_count}</p>
                  <p className="text-white/30 text-xs font-montserrat mt-0.5">Delivered</p>
                </div>
                <div className={`rounded-xl p-3 text-center ${blast.failed_count > 0 ? 'bg-red-500/10' : 'bg-white/5'}`}>
                  <p className={`font-impact text-2xl ${blast.failed_count > 0 ? 'text-red-400' : 'text-white/20'}`}>
                    {blast.failed_count}
                  </p>
                  <p className="text-white/30 text-xs font-montserrat mt-0.5">Failed</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
