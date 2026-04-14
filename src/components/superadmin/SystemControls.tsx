'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Settings, ToggleLeft, ToggleRight, AlertTriangle, Shield,
  Database, Trash2, RefreshCw, Activity, Lock, Unlock, Save
} from 'lucide-react';
import { SectionHeader, SettingsLoader } from './EventSettings';
import type { PortalSettings, RegistrationConfig } from '@/types/superadmin';

export default function SystemControls({ token }: { token: string }) {
  const [portalSettings, setPortalSettings] = useState<PortalSettings>({
    maintenance_mode: false,
    maintenance_message: 'We are performing scheduled maintenance. Please check back shortly.',
    checkin_enabled: true,
    delegate_pass_enabled: true,
    schedule_visible: true,
    committee_info_visible: true,
  });
  const [regConfig, setRegConfig] = useState<RegistrationConfig>({
    is_open: true,
    max_delegates: 120,
    registration_deadline: null,
    show_seat_counter: false,
    success_redirect: '/dashboard',
    terms_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [stats, setStats] = useState({ delegates: 0, checked_in: 0, assigned: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/superadmin/system/portal', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/superadmin/system/registration', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/superadmin/system/stats', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([portal, reg, statsData]) => {
      if (portal.config) setPortalSettings(portal.config);
      if (reg.config) setRegConfig(reg.config);
      if (statsData) setStats(statsData);
    }).finally(() => setLoading(false));
  }, [token]);

  async function savePortal() {
    setSaving('portal');
    const res = await fetch('/api/superadmin/system/portal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(portalSettings),
    });
    if (res.ok) toast.success('Portal settings saved');
    else toast.error('Failed to save');
    setSaving(null);
  }

  async function saveRegistration() {
    setSaving('reg');
    const res = await fetch('/api/superadmin/system/registration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(regConfig),
    });
    if (res.ok) toast.success('Registration settings saved');
    else toast.error('Failed to save');
    setSaving(null);
  }

  async function resetAllCheckins() {
    if (!confirm('⚠️ This will mark ALL delegates as NOT checked in. Are you absolutely sure?')) return;
    if (!confirm('Second confirmation: Reset all check-in statuses?')) return;
    const res = await fetch('/api/superadmin/system/reset-checkins', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success('All check-ins reset'); }
    else toast.error('Failed to reset check-ins');
  }

  async function purgeUnpaidOrders() {
    if (!confirm('Delete all orders that have been pending for more than 24 hours?')) return;
    const res = await fetch('/api/superadmin/system/purge-orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      toast.success(`Purged ${d.deleted} stale orders`);
    } else toast.error('Failed to purge');
  }

  if (loading) return <SettingsLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        icon={<Settings size={18} />}
        title="System Controls"
        description="Feature toggles, registration controls, and system maintenance tools"
      />

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Delegates', value: stats.delegates, icon: '👤' },
          { label: 'Checked In', value: stats.checked_in, icon: '✅' },
          { label: 'Assigned', value: stats.assigned, icon: '🏛️' },
        ].map(s => (
          <div key={s.label} className="yuva-card p-4 text-center">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-impact text-3xl text-gold">{s.value}</p>
            <p className="font-montserrat text-xs text-white/30 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Registration Control */}
      <div className="yuva-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-montserrat font-700 text-cream text-sm">Registration Settings</p>
            <p className="font-montserrat text-xs text-white/30 mt-0.5">Control who can register and when</p>
          </div>
          {/* Big Toggle */}
          <button
            onClick={() => setRegConfig(prev => ({ ...prev, is_open: !prev.is_open }))}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-montserrat font-700 text-sm transition-all ${
              regConfig.is_open
                ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                : 'bg-red-500/15 border border-red-500/30 text-red-400'
            }`}
          >
            {regConfig.is_open ? <Unlock size={14} /> : <Lock size={14} />}
            {regConfig.is_open ? 'Open' : 'Closed'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Max Delegates</label>
            <input type="number" className="yuva-input" value={regConfig.max_delegates}
              onChange={e => setRegConfig({ ...regConfig, max_delegates: parseInt(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Registration Deadline</label>
            <input type="datetime-local" className="yuva-input" value={regConfig.registration_deadline || ''}
              onChange={e => setRegConfig({ ...regConfig, registration_deadline: e.target.value || null })} />
          </div>
          <div>
            <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Success Redirect URL</label>
            <input className="yuva-input text-sm" value={regConfig.success_redirect}
              onChange={e => setRegConfig({ ...regConfig, success_redirect: e.target.value })} placeholder="/dashboard" />
          </div>
          <div>
            <label className="text-white/40 text-xs font-montserrat uppercase tracking-wider block mb-2">Terms & Conditions URL</label>
            <input className="yuva-input text-sm" value={regConfig.terms_url}
              onChange={e => setRegConfig({ ...regConfig, terms_url: e.target.value })} placeholder="https://..." />
          </div>
        </div>

        <ToggleRow
          label="Show seat counter on registration"
          sublabel="Displays remaining spots to create urgency"
          value={regConfig.show_seat_counter}
          onChange={v => setRegConfig({ ...regConfig, show_seat_counter: v })}
        />

        <div className="mt-4">
          <button onClick={saveRegistration} disabled={saving === 'reg'}
            className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5 hover:bg-gold-light transition-all disabled:opacity-50">
            <Save size={13} />
            {saving === 'reg' ? 'Saving...' : 'Save Registration Settings'}
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="yuva-card p-6">
        <p className="font-montserrat font-700 text-cream text-sm mb-2">Portal Feature Toggles</p>
        <p className="font-montserrat text-xs text-white/30 mb-5">Enable or disable portal features in real-time</p>

        <div className="space-y-1">
          <ToggleRow
            label="Delegate Pass"
            sublabel="Allow delegates to view and download their pass"
            value={portalSettings.delegate_pass_enabled}
            onChange={v => setPortalSettings({ ...portalSettings, delegate_pass_enabled: v })}
          />
          <ToggleRow
            label="QR Check-In"
            sublabel="Allow volunteers to check in delegates via QR"
            value={portalSettings.checkin_enabled}
            onChange={v => setPortalSettings({ ...portalSettings, checkin_enabled: v })}
          />
          <ToggleRow
            label="Conference Schedule"
            sublabel="Make the schedule page visible to delegates"
            value={portalSettings.schedule_visible}
            onChange={v => setPortalSettings({ ...portalSettings, schedule_visible: v })}
          />
          <ToggleRow
            label="Committee Info Page"
            sublabel="Allow delegates to browse committee descriptions"
            value={portalSettings.committee_info_visible}
            onChange={v => setPortalSettings({ ...portalSettings, committee_info_visible: v })}
          />
        </div>

        {/* Maintenance Mode */}
        <div className={`mt-4 p-4 rounded-2xl border transition-all ${
          portalSettings.maintenance_mode
            ? 'bg-red-500/10 border-red-500/40'
            : 'bg-white/4 border-white/10'
        }`}>
          <ToggleRow
            label="Maintenance Mode"
            sublabel="Show maintenance page to all non-admin users"
            value={portalSettings.maintenance_mode}
            onChange={v => setPortalSettings({ ...portalSettings, maintenance_mode: v })}
            danger
          />
          {portalSettings.maintenance_mode && (
            <div className="mt-3">
              <label className="text-white/40 text-xs font-montserrat block mb-2">Maintenance Message</label>
              <textarea
                className="yuva-input text-sm resize-none min-h-[60px]"
                value={portalSettings.maintenance_message}
                onChange={e => setPortalSettings({ ...portalSettings, maintenance_message: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <button onClick={savePortal} disabled={saving === 'portal'}
            className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5 hover:bg-gold-light transition-all disabled:opacity-50">
            <Save size={13} />
            {saving === 'portal' ? 'Saving...' : 'Save Portal Settings'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="yuva-card p-6 border border-red-500/20">
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle size={16} className="text-red-400" />
          <p className="font-montserrat font-700 text-red-400 text-sm">Danger Zone</p>
        </div>

        <div className="space-y-3">
          <DangerAction
            label="Reset All Check-Ins"
            description="Mark all delegates as not checked in. Use this before the conference starts."
            buttonLabel="Reset Check-Ins"
            onClick={resetAllCheckins}
          />
          <DangerAction
            label="Purge Stale Orders"
            description="Delete Razorpay orders older than 24h that were never completed."
            buttonLabel="Purge Orders"
            onClick={purgeUnpaidOrders}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, sublabel, value, onChange, danger = false }: {
  label: string; sublabel: string; value: boolean;
  onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className={`font-montserrat font-600 text-sm ${danger && value ? 'text-red-400' : 'text-cream'}`}>{label}</p>
        <p className="font-montserrat text-xs text-white/30 mt-0.5">{sublabel}</p>
      </div>
      <button onClick={() => onChange(!value)} className="ml-4 flex-shrink-0 transition-all">
        {value
          ? <ToggleRight size={24} className={danger ? 'text-red-400' : 'text-gold'} />
          : <ToggleLeft size={24} className="text-white/20" />}
      </button>
    </div>
  );
}

function DangerAction({ label, description, buttonLabel, onClick }: {
  label: string; description: string; buttonLabel: string; onClick: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
      <div>
        <p className="font-montserrat font-600 text-cream text-sm">{label}</p>
        <p className="font-montserrat text-xs text-white/40 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onClick}
        className="flex-shrink-0 text-xs font-montserrat font-700 text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl px-4 py-2 transition-all"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
