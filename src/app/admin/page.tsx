'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Users, Grid3X3, UserPlus, Upload, Settings,
  LogOut, Search, Filter, ChevronDown, Check,
  Send, Eye, RefreshCw, Download, Shield
} from 'lucide-react';
import type { AdminDelegate, Committee, Portfolio, Admin } from '@/types';
import AdminPortfolioMatrix from '@/components/admin/AdminPortfolioMatrix';
import AdminManualEntry from '@/components/admin/AdminManualEntry';
import AdminCSVImport from '@/components/admin/AdminCSVImport';

type TabType = 'delegates' | 'matrix' | 'manual' | 'import' | 'settings';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [delegates, setDelegates] = useState<AdminDelegate[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('delegates');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [session, setSession] = useState<unknown>(null);
  const [stats, setStats] = useState({ total: 0, verified: 0, assigned: 0, checkedIn: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin/login'); return; }
      setSession(session);
      
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (!adminData || !adminData.is_active) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }
      
      setAdmin(adminData);
      await Promise.all([loadDelegates(), loadCommittees(), loadPortfolios()]);
      setLoading(false);
    });
  }, []);

  async function loadDelegates() {
    const { data } = await supabase
      .from('admin_delegates_view')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setDelegates(data);
      setStats({
        total: data.length,
        verified: data.filter((d: AdminDelegate) => d.payment_status === 'VERIFIED').length,
        assigned: data.filter((d: AdminDelegate) => d.allotment_status === 'ASSIGNED').length,
        checkedIn: data.filter((d: AdminDelegate) => d.checked_in).length,
      });
    }
  }

  async function loadCommittees() {
    const { data } = await supabase.from('committees').select('*').order('name');
    if (data) setCommittees(data);
  }

  async function loadPortfolios() {
    const { data } = await supabase.from('portfolios').select('*');
    if (data) setPortfolios(data);
  }

  async function assignCommitteePortfolio(delegateId: string, committeeId: string, portfolioId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const res = await fetch('/api/admin/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ delegateId, committeeId, portfolioId }),
    });

    if (res.ok) {
      toast.success('Portfolio assigned!');
      await Promise.all([loadDelegates(), loadPortfolios()]);
    } else {
      const err = await res.json();
      toast.error(err.error || 'Assignment failed');
    }
  }

  async function sendConfirmationEmail(delegateId: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    const res = await fetch('/api/admin/send-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ delegateId }),
    });

    if (res.ok) {
      toast.success('Confirmation email sent!');
    } else {
      toast.error('Failed to send email');
    }
  }

  async function exportCSV() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    if (admin?.role !== 'SUPER_ADMIN') {
      toast.error('CSV export requires Super Admin access');
      return;
    }

    const res = await fetch('/api/admin/export', {
      headers: { 'Authorization': `Bearer ${session.session.access_token}` },
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yds-delegates-${Date.now()}.csv`;
      a.click();
      toast.success('CSV exported!');
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  const filteredDelegates = delegates.filter(d => {
    const matchesSearch = searchQuery === '' || 
      `${d.first_name} ${d.last_name} ${d.delegate_id} ${d.institution}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'pending' && d.allotment_status === 'PENDING') ||
      (filterStatus === 'assigned' && d.allotment_status === 'ASSIGNED') ||
      (filterStatus === 'checkedin' && d.checked_in);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 font-montserrat text-sm">Loading admin console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-dark">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,170,51,0.025) 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-charcoal-dark border-r border-white/10 z-40 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <p className="font-montserrat text-xs text-gold/50 tracking-[5px] uppercase">Admin Console</p>
          <h2 className="font-impact text-2xl text-cream tracking-widest mt-0.5">YDS 2026</h2>
        </div>

        {/* Admin Info */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center">
              <Shield size={14} className="text-gold" />
            </div>
            <div>
              <p className="font-montserrat text-xs text-cream font-600">{admin?.name}</p>
              <p className="font-montserrat text-xs text-white/30">{admin?.role}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {([
            { id: 'delegates', icon: Users, label: 'Delegates', count: stats.total },
            { id: 'matrix', icon: Grid3X3, label: 'Portfolio Matrix' },
            { id: 'manual', icon: UserPlus, label: 'Manual Entry' },
            ...(admin?.role === 'SUPER_ADMIN' ? [
              { id: 'import', icon: Upload, label: 'CSV Import' },
              { id: 'settings', icon: Settings, label: 'Settings' },
            ] : []),
          ] as { id: TabType; icon: React.ElementType; label: string; count?: number }[]).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <item.icon size={16} />
              <span className="font-montserrat text-sm font-500">{item.label}</span>
              {item.count !== undefined && (
                <span className="ml-auto bg-white/10 text-white/50 text-xs rounded-lg px-2 py-0.5">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {admin?.role === 'SUPER_ADMIN' && (
            <>
              <Link href="/admin/settings">
                <button className="w-full flex items-center gap-2 text-gold hover:text-gold-light bg-gold/10 hover:bg-gold/15 border border-gold/20 text-sm font-montserrat font-600 px-4 py-2.5 rounded-xl transition-all">
                  <Settings size={14} />
                  Super Admin Settings
                </button>
              </Link>
              <button
                onClick={exportCSV}
                className="w-full flex items-center gap-2 text-white/40 hover:text-gold text-sm font-montserrat px-4 py-2 rounded-xl hover:bg-gold/10 transition-all"
              >
                <Download size={14} />
                Export CSV
              </button>
            </>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 text-white/40 hover:text-red-400 text-sm font-montserrat px-4 py-2 rounded-xl hover:bg-red-400/10 transition-all"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-charcoal-dark/90 backdrop-blur-xl border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-montserrat font-700 text-cream text-lg">
                {activeTab === 'delegates' && 'Delegate Management'}
                {activeTab === 'matrix' && 'Portfolio Matrix'}
                {activeTab === 'manual' && 'Manual Delegate Entry'}
                {activeTab === 'import' && 'CSV Import'}
                {activeTab === 'settings' && 'System Settings'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Stats Pills */}
              <div className="hidden md:flex items-center gap-2">
                {[
                  { label: 'Total', value: stats.total, color: 'text-white/60' },
                  { label: 'Verified', value: stats.verified, color: 'text-green-400' },
                  { label: 'Assigned', value: stats.assigned, color: 'text-gold' },
                  { label: 'Checked In', value: stats.checkedIn, color: 'text-blue-400' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-white/5 rounded-xl px-3 py-1.5">
                    <span className={`font-montserrat font-700 text-sm ${s.color}`}>{s.value}</span>
                    <span className="font-montserrat text-xs text-white/30">{s.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { loadDelegates(); loadPortfolios(); }}
                className="p-2 rounded-xl text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'delegates' && (
              <motion.div key="delegates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DelegateTable
                  delegates={filteredDelegates}
                  committees={committees}
                  portfolios={portfolios}
                  adminRole={admin?.role || 'ADMIN'}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  onAssign={assignCommitteePortfolio}
                  onSendEmail={sendConfirmationEmail}
                />
              </motion.div>
            )}
            {activeTab === 'matrix' && (
              <motion.div key="matrix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AdminPortfolioMatrix
                  committees={committees}
                  portfolios={portfolios}
                  onRefresh={() => { loadCommittees(); loadPortfolios(); loadDelegates(); }}
                />
              </motion.div>
            )}
            {activeTab === 'manual' && (
              <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AdminManualEntry
                  committees={committees}
                  onSuccess={() => { loadDelegates(); setActiveTab('delegates'); }}
                />
              </motion.div>
            )}
            {activeTab === 'import' && admin?.role === 'SUPER_ADMIN' && (
              <motion.div key="import" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AdminCSVImport onSuccess={loadDelegates} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Delegate Table Component
// ============================================================

function DelegateTable({
  delegates, committees, portfolios, adminRole,
  searchQuery, setSearchQuery, filterStatus, setFilterStatus,
  onAssign, onSendEmail,
}: {
  delegates: AdminDelegate[];
  committees: Committee[];
  portfolios: Portfolio[];
  adminRole: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (f: string) => void;
  onAssign: (dId: string, cId: string, pId: string) => void;
  onSendEmail: (dId: string) => void;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [assignState, setAssignState] = useState<Record<string, { committee: string; portfolio: string }>>({});

  function getAvailablePortfolios(committeeId: string) {
    return portfolios.filter(p => p.committee_id === committeeId && !p.is_assigned);
  }

  function handleAssign(delegateId: string) {
    const state = assignState[delegateId];
    if (!state?.committee || !state?.portfolio) {
      toast.error('Please select both committee and portfolio');
      return;
    }
    onAssign(delegateId, state.committee, state.portfolio);
    setExpandedRow(null);
  }

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="yuva-input pl-11"
            placeholder="Search by name, ID, or institution..."
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="yuva-select pr-10 min-w-[180px]"
          >
            <option value="all">All Delegates</option>
            <option value="pending">Pending Allotment</option>
            <option value="assigned">Assigned</option>
            <option value="checkedin">Checked In</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="yuva-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="yuva-table">
            <thead>
              <tr>
                <th>Delegate</th>
                <th>Class / Year</th>
                <th>Pref 1</th>
                <th>Pref 2</th>
                <th>Experience</th>
                <th>ID</th>
                <th>Committee</th>
                <th>Portfolio</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {delegates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-white/30 font-montserrat">
                    No delegates found
                  </td>
                </tr>
              ) : (
                delegates.map((d) => (
                  <>
                    <tr key={d.id} className="cursor-pointer" onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}>
                      <td>
                        <p className="font-montserrat font-600 text-cream text-sm">{d.first_name} {d.last_name}</p>
                        <p className="font-montserrat text-xs text-white/40 truncate max-w-[150px]">{d.institution}</p>
                      </td>
                      <td className="text-sm">{d.class_year}</td>
                      <td><span className="badge-gray text-xs">{d.pref1 || '—'}</span></td>
                      <td><span className="badge-gray text-xs">{d.pref2 || '—'}</span></td>
                      <td>
                        <span className="text-xs text-white/40 line-clamp-1 max-w-[100px]">
                          {d.experience ? '✓ Yes' : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="font-impact text-gold text-sm tracking-wide">{d.delegate_id || '—'}</span>
                      </td>
                      <td>
                        {d.committee_assigned ? (
                          <span className="badge-gold text-xs">
                            {committees.find(c => c.id === d.committee_assigned)?.abbreviation || 'Assigned'}
                          </span>
                        ) : (
                          <span className="badge-gray text-xs">Pending</span>
                        )}
                      </td>
                      <td>
                        <span className="text-xs text-white/60 truncate max-w-[100px] block">
                          {d.portfolio_assigned
                            ? portfolios.find(p => p.id === d.portfolio_assigned)?.country_or_role || 'Assigned'
                            : '—'}
                        </span>
                      </td>
                      <td>
                        {d.checked_in ? (
                          <span className="badge-green text-xs"><Check size={10} /> In</span>
                        ) : d.allotment_status === 'ASSIGNED' ? (
                          <span className="badge-gold text-xs">Assigned</span>
                        ) : (
                          <span className="badge-gray text-xs">Pending</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {d.allotment_status === 'ASSIGNED' && (
                            <button
                              onClick={() => onSendEmail(d.id)}
                              className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                              title="Send Confirmation Email"
                            >
                              <Send size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => setExpandedRow(expandedRow === d.id ? null : d.id)}
                            className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-all"
                            title="Assign Portfolio"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedRow === d.id && (
                      <tr key={`${d.id}-expand`}>
                        <td colSpan={10} className="bg-gold/5 border-t border-gold/10">
                          <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-montserrat font-700 text-gold text-xs uppercase tracking-wider mb-2">Delegate Details</h4>
                                {d.experience && (
                                  <div className="text-xs text-white/60 font-montserrat bg-charcoal rounded-xl p-3">
                                    <p className="text-white/30 uppercase text-[10px] tracking-wider mb-1">Experience</p>
                                    {d.experience}
                                  </div>
                                )}
                              </div>
                              <div className="md:col-span-2">
                                <h4 className="font-montserrat font-700 text-gold text-xs uppercase tracking-wider mb-3">Assign Portfolio</h4>
                                <div className="flex flex-col md:flex-row gap-3">
                                  <div className="relative flex-1">
                                    <select
                                      className="yuva-select text-sm pr-8"
                                      value={assignState[d.id]?.committee || ''}
                                      onChange={(e) => setAssignState(prev => ({
                                        ...prev,
                                        [d.id]: { committee: e.target.value, portfolio: '' }
                                      }))}
                                    >
                                      <option value="">Select Committee</option>
                                      {committees.map(c => (
                                        <option key={c.id} value={c.id}>{c.abbreviation} — {c.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="relative flex-1">
                                    <select
                                      className="yuva-select text-sm pr-8"
                                      value={assignState[d.id]?.portfolio || ''}
                                      onChange={(e) => setAssignState(prev => ({
                                        ...prev,
                                        [d.id]: { ...prev[d.id], portfolio: e.target.value }
                                      }))}
                                      disabled={!assignState[d.id]?.committee}
                                    >
                                      <option value="">Select Portfolio</option>
                                      {getAvailablePortfolios(assignState[d.id]?.committee || '').map(p => (
                                        <option key={p.id} value={p.id}>{p.country_or_role}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    onClick={() => handleAssign(d.id)}
                                    className="bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-6 py-2.5 hover:bg-gold-light transition-colors whitespace-nowrap"
                                  >
                                    Assign →
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
