'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { DollarSign, Plus, Trash2, ToggleLeft, ToggleRight, Edit3, Check, X } from 'lucide-react';
import { SectionHeader, Field, SaveButton, SettingsLoader } from './EventSettings';
import type { PricingConfig, PricingAddon } from '@/types/superadmin';

export default function PricingManager({ token }: { token: string }) {
  const [config, setConfig] = useState<PricingConfig>({
    base_fee: 499,
    base_fee_description: 'Registration Fee + Food + Participation',
    addons: [],
    currency: 'INR',
    currency_symbol: '₹',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddAddon, setShowAddAddon] = useState(false);
  const [newAddon, setNewAddon] = useState({ label: '', description: '', price: 0 });
  const [editingAddon, setEditingAddon] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/superadmin/pricing', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.config) setConfig(d.config); })
      .finally(() => setLoading(false));
  }, [token]);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/superadmin/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(config),
    });
    if (res.ok) toast.success('Pricing saved! Registration form will update immediately.');
    else toast.error('Failed to save pricing');
    setSaving(false);
  }

  function addAddon() {
    if (!newAddon.label || newAddon.price <= 0) { toast.error('Label and price required'); return; }
    const addon: PricingAddon = {
      id: `addon_${Date.now()}`,
      label: newAddon.label,
      description: newAddon.description,
      price: newAddon.price,
      enabled: true,
    };
    setConfig(prev => ({ ...prev, addons: [...prev.addons, addon] }));
    setNewAddon({ label: '', description: '', price: 0 });
    setShowAddAddon(false);
  }

  function removeAddon(id: string) {
    setConfig(prev => ({ ...prev, addons: prev.addons.filter(a => a.id !== id) }));
  }

  function toggleAddon(id: string) {
    setConfig(prev => ({
      ...prev,
      addons: prev.addons.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a),
    }));
  }

  function updateAddon(id: string, updates: Partial<PricingAddon>) {
    setConfig(prev => ({
      ...prev,
      addons: prev.addons.map(a => a.id === id ? { ...a, ...updates } : a),
    }));
  }

  const totalMax = config.base_fee + config.addons.filter(a => a.enabled).reduce((s, a) => s + a.price, 0);

  if (loading) return <SettingsLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <SectionHeader
        icon={<DollarSign size={18} />}
        title="Pricing Configuration"
        description="Set registration fees and optional add-ons. Changes reflect on the registration form immediately after saving."
      />

      {/* Base Fee */}
      <div className="yuva-card p-6">
        <p className="font-montserrat font-700 text-white/60 text-xs uppercase tracking-wider mb-4">Base Registration Fee</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fee Amount (₹)">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-montserrat font-700">₹</span>
              <input
                type="number" min={0}
                className="yuva-input pl-8 text-xl font-montserrat font-700 text-gold"
                value={config.base_fee}
                onChange={e => setConfig({ ...config, base_fee: parseInt(e.target.value) || 0 })}
              />
            </div>
          </Field>
          <Field label="Description (shown on form)">
            <input
              className="yuva-input"
              value={config.base_fee_description}
              onChange={e => setConfig({ ...config, base_fee_description: e.target.value })}
              placeholder="Includes Registration + Food + Participation"
            />
          </Field>
        </div>
      </div>

      {/* Add-ons */}
      <div className="yuva-card p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="font-montserrat font-700 text-white/60 text-xs uppercase tracking-wider">Optional Add-ons</p>
          <button
            onClick={() => setShowAddAddon(true)}
            className="flex items-center gap-1.5 text-xs font-montserrat font-600 text-gold bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg px-3 py-1.5 transition-all"
          >
            <Plus size={12} /> Add Add-on
          </button>
        </div>

        <AnimatePresence>
          {showAddAddon && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-charcoal-dark/60 rounded-2xl p-4 mb-4 border border-gold/20 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Label">
                  <input className="yuva-input text-sm" placeholder="Carnival & Sundowner Pass"
                    value={newAddon.label} onChange={e => setNewAddon({ ...newAddon, label: e.target.value })} />
                </Field>
                <Field label="Price (₹)">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-montserrat">₹</span>
                    <input type="number" min={0} className="yuva-input pl-8 text-sm"
                      value={newAddon.price || ''}
                      onChange={e => setNewAddon({ ...newAddon, price: parseInt(e.target.value) || 0 })} />
                  </div>
                </Field>
                <div className="col-span-2">
                  <Field label="Description">
                    <input className="yuva-input text-sm" placeholder="Add exclusive carnival & sundowner experience"
                      value={newAddon.description} onChange={e => setNewAddon({ ...newAddon, description: e.target.value })} />
                  </Field>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addAddon} className="bg-gold text-charcoal-dark font-montserrat font-700 text-xs rounded-lg px-4 py-2">
                  Add
                </button>
                <button onClick={() => setShowAddAddon(false)} className="text-white/40 text-xs font-montserrat px-3">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {config.addons.map(addon => (
            <div key={addon.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
              addon.enabled ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5 opacity-50'
            }`}>
              {editingAddon === addon.id ? (
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="yuva-input text-sm" value={addon.label}
                      onChange={e => updateAddon(addon.id, { label: e.target.value })} placeholder="Label" />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold text-sm">₹</span>
                      <input type="number" className="yuva-input text-sm pl-7" value={addon.price}
                        onChange={e => updateAddon(addon.id, { price: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <input className="yuva-input text-sm" value={addon.description}
                    onChange={e => updateAddon(addon.id, { description: e.target.value })} placeholder="Description" />
                  <button onClick={() => setEditingAddon(null)}
                    className="flex items-center gap-1 text-xs text-gold font-montserrat">
                    <Check size={12} /> Done
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-montserrat font-700 text-cream text-sm">{addon.label}</p>
                    {!addon.enabled && <span className="text-xs text-white/30 font-montserrat">(disabled)</span>}
                  </div>
                  <p className="font-montserrat text-xs text-white/40 mt-0.5">{addon.description}</p>
                </div>
              )}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-montserrat font-700 text-gold">+₹{addon.price}</span>
                <button onClick={() => setEditingAddon(editingAddon === addon.id ? null : addon.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-gold hover:bg-gold/10 transition-all">
                  <Edit3 size={12} />
                </button>
                <button onClick={() => toggleAddon(addon.id)}
                  className="transition-colors">
                  {addon.enabled
                    ? <ToggleRight size={20} className="text-gold" />
                    : <ToggleLeft size={20} className="text-white/20" />}
                </button>
                <button onClick={() => removeAddon(addon.id)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {config.addons.length === 0 && (
            <p className="text-white/20 text-sm font-montserrat text-center py-4">No add-ons configured</p>
          )}
        </div>
      </div>

      {/* Total Preview */}
      <div className="yuva-card p-5 border border-gold/20">
        <p className="font-montserrat text-xs text-white/30 uppercase tracking-wider mb-3">Live Price Preview</p>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex gap-3 text-sm font-montserrat">
              <span className="text-white/40">Base fee</span>
              <span className="text-cream font-600">{config.currency_symbol}{config.base_fee}</span>
            </div>
            {config.addons.filter(a => a.enabled).map(a => (
              <div key={a.id} className="flex gap-3 text-sm font-montserrat">
                <span className="text-white/40">+ {a.label}</span>
                <span className="text-cream font-600">{config.currency_symbol}{a.price}</span>
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="font-montserrat text-xs text-white/30">Maximum total</p>
            <p className="font-impact text-4xl text-gold">{config.currency_symbol}{totalMax}</p>
          </div>
        </div>
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}
