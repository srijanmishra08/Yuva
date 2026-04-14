'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Plus, Trash2, Shield, ShieldCheck, ToggleLeft, ToggleRight, X, ChevronDown, Clock, Check } from 'lucide-react';
import { SectionHeader, Field, SettingsLoader } from './EventSettings';
import type { AdminUser } from '@/types/superadmin';

export default function AdminManager({ token }: { token: string }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'ADMIN' });
  const [adding, setAdding] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/superadmin/admins', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.admins) setAdmins(data.admins);
    setLoading(false);
  }

  async function addAdmin() {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error('All fields required');
      return;
    }
    setAdding(true);
    const res = await fetch('/api/superadmin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newAdmin),
    });
    if (res.ok) {
      toast.success(`Admin "${newAdmin.name}" created`);
      setNewAdmin({ name: '', email: '', password: '', role: 'ADMIN' });
      setShowAddForm(false);
      load();
    } else {
      const e = await res.json();
      toast.error(e.error || 'Failed to create admin');
    }
    setAdding(false);
  }

  async function toggleActive(id: string, currentState: boolean, name: string) {
    const action = currentState ? 'deactivate' : 'activate';
    if (!confirm(`${action === 'deactivate' ? 'Deactivate' : 'Activate'} "${name}"?`)) return;
    const res = await fetch(`/api/superadmin/admins/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !currentState }),
    });
    if (res.ok) { toast.success(`Admin ${action}d`); load(); }
    else toast.error('Failed to update admin');
  }

  async function changeRole(id: string, newRole: string) {
    setChangingRole(id);
    const res = await fetch(`/api/superadmin/admins/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) { toast.success('Role updated'); load(); }
    else toast.error('Failed to update role');
    setChangingRole(null);
  }

  async function deleteAdmin(id: string, name: string) {
    if (!confirm(`Permanently delete admin "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/superadmin/admins/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { toast.success('Admin deleted'); load(); }
    else toast.error('Cannot delete admin');
  }

  const activeAdmins = admins.filter(a => a.is_active);
  const inactiveAdmins = admins.filter(a => !a.is_active);

  if (loading) return <SettingsLoader />;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <SectionHeader
          icon={<Users size={18} />}
          title="Admin User Management"
          description="Create, deactivate, or change roles for admin accounts"
        />
        <motion.button
          onClick={() => setShowAddForm(true)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-4 py-2.5 flex-shrink-0 ml-4"
        >
          <Plus size={14} /> Add Admin
        </motion.button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Admins', value: admins.length, color: 'text-white/60' },
          { label: 'Active', value: activeAdmins.length, color: 'text-green-400' },
          { label: 'Super Admins', value: admins.filter(a => a.role === 'SUPER_ADMIN').length, color: 'text-gold' },
        ].map(stat => (
          <div key={stat.label} className="yuva-card p-4 text-center">
            <p className={`font-impact text-3xl ${stat.color}`}>{stat.value}</p>
            <p className="font-montserrat text-xs text-white/30 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Add Admin Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="yuva-card p-6 border border-gold/30"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-montserrat font-700 text-gold text-sm uppercase tracking-wider">Create Admin Account</p>
              <button onClick={() => setShowAddForm(false)} className="text-white/30 hover:text-white/60"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Full Name *">
                <input className="yuva-input" placeholder="Priya Sharma"
                  value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} />
              </Field>
              <Field label="Email Address *">
                <input className="yuva-input" type="email" placeholder="admin@funology.in"
                  value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} />
              </Field>
              <Field label="Initial Password *">
                <input className="yuva-input" type="password" placeholder="Min. 8 characters"
                  value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} />
              </Field>
              <Field label="Role">
                <div className="relative">
                  <select className="yuva-select pr-10" value={newAdmin.role}
                    onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </Field>
            </div>
            <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-4">
              <p className="text-yellow-400/80 text-xs font-montserrat">
                ⚠️ The admin will receive an email to confirm their account. Share the initial password with them securely.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={addAdmin} disabled={adding}
                className="bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5 hover:bg-gold-light transition-all disabled:opacity-50">
                {adding ? 'Creating...' : 'Create Admin'}
              </button>
              <button onClick={() => setShowAddForm(false)} className="text-white/40 text-sm font-montserrat px-4">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Admins */}
      <div className="yuva-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 bg-white/3">
          <p className="font-montserrat font-600 text-white/50 text-xs uppercase tracking-wider">Active Admins ({activeAdmins.length})</p>
        </div>
        <div className="divide-y divide-white/5">
          {activeAdmins.map(admin => (
            <AdminRow
              key={admin.id}
              admin={admin}
              changingRole={changingRole}
              onChangeRole={changeRole}
              onToggleActive={toggleActive}
              onDelete={deleteAdmin}
            />
          ))}
          {activeAdmins.length === 0 && (
            <p className="text-center text-white/20 font-montserrat text-sm py-6">No active admins</p>
          )}
        </div>
      </div>

      {/* Inactive Admins */}
      {inactiveAdmins.length > 0 && (
        <div className="yuva-card overflow-hidden opacity-60">
          <div className="px-5 py-3 border-b border-white/10 bg-white/3">
            <p className="font-montserrat font-600 text-white/40 text-xs uppercase tracking-wider">
              Deactivated ({inactiveAdmins.length})
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {inactiveAdmins.map(admin => (
              <AdminRow
                key={admin.id}
                admin={admin}
                changingRole={changingRole}
                onChangeRole={changeRole}
                onToggleActive={toggleActive}
                onDelete={deleteAdmin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminRow({ admin, changingRole, onChangeRole, onToggleActive, onDelete }: {
  admin: AdminUser;
  changingRole: string | null;
  onChangeRole: (id: string, role: string) => void;
  onToggleActive: (id: string, active: boolean, name: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        admin.role === 'SUPER_ADMIN' ? 'bg-gold/20' : 'bg-white/8'
      }`}>
        {admin.role === 'SUPER_ADMIN'
          ? <ShieldCheck size={16} className="text-gold" />
          : <Shield size={16} className="text-white/40" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-montserrat font-600 text-cream text-sm">{admin.name}</p>
        <p className="font-montserrat text-xs text-white/30 mt-0.5 truncate">{admin.email}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Role toggle */}
        <select
          value={admin.role}
          onChange={e => onChangeRole(admin.id, e.target.value)}
          disabled={changingRole === admin.id}
          className="bg-white/8 border border-white/10 text-xs font-montserrat text-white/60 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold cursor-pointer"
        >
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>

        {/* Active toggle */}
        <button
          onClick={() => onToggleActive(admin.id, admin.is_active, admin.name)}
          title={admin.is_active ? 'Deactivate' : 'Activate'}
          className="p-1.5 rounded-lg hover:bg-white/8 transition-all"
        >
          {admin.is_active
            ? <ToggleRight size={20} className="text-green-400" />
            : <ToggleLeft size={20} className="text-white/20" />}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(admin.id, admin.name)}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
        ><Trash2 size={13} /></button>
      </div>

      <div className="flex items-center gap-1 text-white/20">
        <Clock size={11} />
        <span className="font-montserrat text-xs">{new Date(admin.created_at).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  );
}
