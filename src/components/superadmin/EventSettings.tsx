'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Save, Globe, Calendar, MapPin, Type, Image, Sparkles } from 'lucide-react';
import type { EventConfig } from '@/types/superadmin';

export default function EventSettings({ token }: { token: string }) {
  const [config, setConfig] = useState<EventConfig>({
    name: 'YUVA Diplomacy Summit',
    edition: 'YDS 2026',
    dates: 'TBD',
    venue: 'TBD',
    city: 'India',
    tagline: "Shaping Tomorrow's Diplomats",
    logo_url: '',
    banner_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/superadmin/event-config', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config); })
      .finally(() => setLoading(false));
  }, [token]);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/superadmin/event-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    });
    if (res.ok) toast.success('Event settings saved');
    else toast.error('Failed to save');
    setSaving(false);
  }

  if (loading) return <SettingsLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        icon={<Globe size={18} />}
        title="Event Identity"
        description="Core information displayed across the portal, emails, and passes"
      />

      <div className="yuva-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Conference Name" icon={<Type size={14} />}>
            <input
              className="yuva-input"
              value={config.name}
              onChange={e => setConfig({ ...config, name: e.target.value })}
              placeholder="YUVA Diplomacy Summit"
            />
          </Field>
          <Field label="Edition / Short Name" icon={<Sparkles size={14} />}>
            <input
              className="yuva-input"
              value={config.edition}
              onChange={e => setConfig({ ...config, edition: e.target.value })}
              placeholder="YDS 2026"
            />
          </Field>
        </div>

        <Field label="Tagline" icon={<Type size={14} />}>
          <input
            className="yuva-input"
            value={config.tagline}
            onChange={e => setConfig({ ...config, tagline: e.target.value })}
            placeholder="Shaping Tomorrow's Diplomats"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Conference Dates" icon={<Calendar size={14} />}>
            <input
              className="yuva-input"
              value={config.dates}
              onChange={e => setConfig({ ...config, dates: e.target.value })}
              placeholder="12–13 April 2026"
            />
          </Field>
          <Field label="City" icon={<MapPin size={14} />}>
            <input
              className="yuva-input"
              value={config.city}
              onChange={e => setConfig({ ...config, city: e.target.value })}
              placeholder="New Delhi"
            />
          </Field>
        </div>

        <Field label="Venue" icon={<MapPin size={14} />}>
          <input
            className="yuva-input"
            value={config.venue}
            onChange={e => setConfig({ ...config, venue: e.target.value })}
            placeholder="The Grand Ballroom, New Delhi"
          />
        </Field>

        <div className="pt-2 border-t border-white/10">
          <p className="text-white/30 text-xs font-montserrat uppercase tracking-wider mb-4">Media Assets</p>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Logo URL" icon={<Image size={14} />}>
              <input
                className="yuva-input"
                value={config.logo_url}
                onChange={e => setConfig({ ...config, logo_url: e.target.value })}
                placeholder="https://cdn.example.com/yuva-logo.png"
              />
            </Field>
            <Field label="Banner / OG Image URL" icon={<Image size={14} />}>
              <input
                className="yuva-input"
                value={config.banner_url}
                onChange={e => setConfig({ ...config, banner_url: e.target.value })}
                placeholder="https://cdn.example.com/yuva-banner.png"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="yuva-card p-5 border border-gold/20">
        <p className="text-white/30 text-xs font-montserrat uppercase tracking-wider mb-4">Preview</p>
        <div className="text-center py-4">
          <p className="font-montserrat text-xs text-gold/60 tracking-[5px] uppercase">{config.name}</p>
          <p className="font-impact text-4xl text-cream tracking-widest mt-1">{config.edition}</p>
          <p className="font-montserrat text-sm text-white/40 mt-1 italic">"{config.tagline}"</p>
          {(config.dates !== 'TBD' || config.venue !== 'TBD') && (
            <div className="flex items-center justify-center gap-3 mt-3 text-white/30 text-xs font-montserrat">
              {config.dates !== 'TBD' && <span>📅 {config.dates}</span>}
              {config.venue !== 'TBD' && <span>📍 {config.venue}, {config.city}</span>}
            </div>
          )}
        </div>
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────

export function SectionHeader({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-2">
      <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center text-gold flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="font-montserrat font-700 text-cream text-base">{title}</h2>
        <p className="font-montserrat text-xs text-white/40 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export function Field({ label, children, icon }: {
  label: string; children: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-white/50 text-xs font-montserrat uppercase tracking-wider mb-2">
        {icon && <span className="text-white/30">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

export function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={saving}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 rounded-xl px-6 py-3 transition-all hover:bg-gold-light disabled:opacity-50"
    >
      <Save size={15} />
      {saving ? 'Saving...' : 'Save Changes'}
    </motion.button>
  );
}

export function SettingsLoader() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="yuva-card p-6">
          <div className="skeleton h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="skeleton h-10 rounded-xl" />
            <div className="skeleton h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
