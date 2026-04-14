'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, X, ChevronDown, Bell } from 'lucide-react';
import { SectionHeader, Field, SettingsLoader } from './EventSettings';
import type { Announcement } from '@/types/superadmin';

const ANNOUNCEMENT_TYPES = [
  { value: 'info',    label: '💬 Info',    style: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { value: 'warning', label: '⚠️ Warning', style: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  { value: 'success', label: '✅ Success', style: 'bg-green-500/10 border-green-500/30 text-green-400' },
  { value: 'urgent',  label: '🚨 Urgent',  style: 'bg-red-500/10 border-red-500/30 text-red-400' },
];

export default function AnnouncementManager({ token }: { token: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', type: 'info', target_audience: 'all',
    show_on_dashboard: true, show_on_register: false, expires_at: '',
  });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/superadmin/announcements', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.announcements) setAnnouncements(data.announcements);
    setLoading(false);
  }

  async function create() {
    if (!form.title || !form.message) { toast.error('Title and message required'); return; }
    setSaving(true);
    const res = await fetch('/api/superadmin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, expires_at: form.expires_at || null }),
    });
    if (res.ok) {
      toast.success('Announcement created!');
      setForm({ title: '', message: '', type: 'info', target_audience: 'all', show_on_dashboard: true, show_on_register: false, expires_at: '' });
      setShowForm(false);
      load();
    } else toast.error('Failed to create announcement');
    setSaving(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const res = await fetch(`/api/superadmin/announcements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !current }),
    });
    if (res.ok) { load(); }
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return;
    const res = await fetch(`/api/superadmin/announcements/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success('Deleted'); load(); }
  }

  if (loading) return <SettingsLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader
          icon={<Megaphone size={18} />}
          title="Announcements & Banners"
          description="Show notices to delegates and admins on their dashboards"
        />
        <motion.button
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-4 py-2.5 flex-shrink-0 ml-4"
        >
          <Plus size={14} /> New Announcement
        </motion.button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="yuva-card p-6 border border-gold/30"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-montserrat font-700 text-gold text-sm uppercase tracking-wider">New Announcement</p>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <Field label="Title *">
                <input className="yuva-input" placeholder="Important Update" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </Field>
              <Field label="Message *">
                <textarea className="yuva-input min-h-[80px] resize-none" placeholder="Write your announcement here..."
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Type">
                  <div className="relative">
                    <select className="yuva-select pr-8 text-sm" value={form.type}
                      onChange={e => setForm({ ...form, type: e.target.value })}>
                      {ANNOUNCEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </Field>
                <Field label="Audience">
                  <div className="relative">
                    <select className="yuva-select pr-8 text-sm" value={form.target_audience}
                      onChange={e => setForm({ ...form, target_audience: e.target.value })}>
                      <option value="all">Everyone</option>
                      <option value="delegates">Delegates Only</option>
                      <option value="admins">Admins Only</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </Field>
                <Field label="Expires At">
                  <input type="datetime-local" className="yuva-input text-sm" value={form.expires_at}
                    onChange={e => setForm({ ...form, expires_at: e.target.value })} />
                </Field>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm({ ...form, show_on_dashboard: !form.show_on_dashboard })}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${form.show_on_dashboard ? 'bg-gold border-gold' : 'border-white/30'}`}>
                    {form.show_on_dashboard && <span className="text-charcoal-dark text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-white/50 font-montserrat">Show on Dashboard</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setForm({ ...form, show_on_register: !form.show_on_register })}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${form.show_on_register ? 'bg-gold border-gold' : 'border-white/30'}`}>
                    {form.show_on_register && <span className="text-charcoal-dark text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-white/50 font-montserrat">Show on Register</span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={create} disabled={saving}
                  className="bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5 disabled:opacity-50">
                  {saving ? 'Posting...' : 'Post Announcement'}
                </button>
                <button onClick={() => setShowForm(false)} className="text-white/40 text-sm font-montserrat px-4">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.length === 0 && (
          <div className="text-center py-10 text-white/20 font-montserrat text-sm">
            <Bell size={32} className="mx-auto mb-3 opacity-20" />
            No announcements yet
          </div>
        )}
        {announcements.map(ann => {
          const typeMeta = ANNOUNCEMENT_TYPES.find(t => t.value === ann.type);
          return (
            <motion.div
              key={ann.id}
              layout
              className={`yuva-card p-5 border transition-all ${ann.is_active ? '' : 'opacity-40'}`}
            >
              <div className="flex items-start gap-4">
                <span className={`text-xs font-montserrat px-2.5 py-1 rounded-xl border flex-shrink-0 ${typeMeta?.style}`}>
                  {typeMeta?.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-montserrat font-700 text-cream text-sm">{ann.title}</p>
                  <p className="font-montserrat text-xs text-white/50 mt-1 leading-relaxed">{ann.message}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="font-montserrat text-xs text-white/30">
                      👥 {ann.target_audience === 'all' ? 'Everyone' : ann.target_audience}
                    </span>
                    {ann.show_on_dashboard && <span className="font-montserrat text-xs text-white/30">📊 Dashboard</span>}
                    {ann.show_on_register && <span className="font-montserrat text-xs text-white/30">📝 Register</span>}
                    {ann.expires_at && (
                      <span className="font-montserrat text-xs text-white/30">
                        ⏰ Expires {new Date(ann.expires_at).toLocaleDateString('en-IN')}
                      </span>
                    )}
                    <span className="font-montserrat text-xs text-white/20">
                      {new Date(ann.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(ann.id, ann.is_active)}>
                    {ann.is_active
                      ? <ToggleRight size={20} className="text-green-400" />
                      : <ToggleLeft size={20} className="text-white/20" />}
                  </button>
                  <button onClick={() => remove(ann.id)}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
