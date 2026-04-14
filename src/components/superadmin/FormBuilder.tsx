'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FormInput, Plus, Trash2, Edit3, GripVertical,
  Eye, EyeOff, ToggleLeft, ToggleRight, Check, X, ChevronDown
} from 'lucide-react';
import { SectionHeader, Field, SettingsLoader } from './EventSettings';
import type { FormField } from '@/types/superadmin';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

const SECTIONS = [
  { value: 'delegate',   label: '👤 Delegate Details' },
  { value: 'address',    label: '📍 Address Details' },
  { value: 'parent',     label: '👨‍👩‍👧 Parent / Guardian' },
  { value: 'additional', label: '✨ Additional Info' },
  { value: 'committee',  label: '🏛️ Committee Preferences' },
  { value: 'experience', label: '🎖️ Experience' },
  { value: 'referral',   label: '🔗 Referral' },
];

const SECTION_COLORS: Record<string, string> = {
  delegate: 'border-l-gold',
  address: 'border-l-blue-400',
  parent: 'border-l-green-400',
  additional: 'border-l-purple-400',
  committee: 'border-l-orange-400',
  experience: 'border-l-pink-400',
  referral: 'border-l-yellow-400',
};

export default function FormBuilder({ token }: { token: string }) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [newField, setNewField] = useState<Partial<FormField>>({
    label: '', placeholder: '', field_type: 'text', section: 'delegate',
    is_required: false, is_visible: true, help_text: '', options: [],
  });
  const [pendingChanges, setPendingChanges] = useState(false);

  useEffect(() => {
    fetch('/api/superadmin/form-fields', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.fields) setFields(d.fields); })
      .finally(() => setLoading(false));
  }, [token]);

  async function saveAll() {
    setSaving(true);
    const res = await fetch('/api/superadmin/form-fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields }),
    });
    if (res.ok) {
      toast.success('Form fields saved! Registration form updated.');
      setPendingChanges(false);
    } else toast.error('Failed to save form fields');
    setSaving(false);
  }

  async function addField() {
    if (!newField.label) { toast.error('Label is required'); return; }
    const fieldKey = newField.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (fields.find(f => f.field_key === fieldKey)) {
      toast.error('A field with this key already exists'); return;
    }
    const sectionFields = fields.filter(f => f.section === newField.section);
    const newF: FormField = {
      id: `new_${Date.now()}`,
      field_key: fieldKey,
      label: newField.label!,
      placeholder: newField.placeholder || '',
      field_type: newField.field_type as FormField['field_type'],
      section: newField.section || 'delegate',
      is_required: newField.is_required || false,
      is_visible: true,
      sort_order: sectionFields.length + 1,
      options: newField.options || [],
      validation_rules: {},
      help_text: newField.help_text || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFields(prev => [...prev, newF]);
    setNewField({ label: '', placeholder: '', field_type: 'text', section: 'delegate', is_required: false, is_visible: true, help_text: '' });
    setShowAddField(false);
    setPendingChanges(true);
    toast.success('Field added — remember to save!');
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setPendingChanges(true);
  }

  function removeField(id: string) {
    if (!confirm('Remove this field? This may break existing registrations.')) return;
    setFields(prev => prev.filter(f => f.id !== id));
    setPendingChanges(true);
  }

  function toggleVisible(id: string) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, is_visible: !f.is_visible } : f));
    setPendingChanges(true);
  }

  function reorderSection(sectionId: string, newOrder: FormField[]) {
    const otherFields = fields.filter(f => f.section !== sectionId);
    const reindexed = newOrder.map((f, i) => ({ ...f, sort_order: i + 1 }));
    setFields([...otherFields, ...reindexed]);
    setPendingChanges(true);
  }

  const visibleSections = activeSection === 'all'
    ? SECTIONS.map(s => s.value)
    : [activeSection];

  const displayedFields = fields.filter(f =>
    activeSection === 'all' || f.section === activeSection
  );

  if (loading) return <SettingsLoader />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionHeader
          icon={<FormInput size={18} />}
          title="Registration Form Builder"
          description="Add, reorder, or hide fields. Drag to reorder within sections."
        />
        <div className="flex gap-2">
          {pendingChanges && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={saveAll}
              disabled={saving}
              className="flex items-center gap-1.5 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-4 py-2.5"
            >
              <Check size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          )}
          <button
            onClick={() => setShowAddField(true)}
            className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 text-white/70 hover:text-cream border border-white/15 font-montserrat font-600 text-sm rounded-xl px-4 py-2.5 transition-all"
          >
            <Plus size={14} /> Add Field
          </button>
        </div>
      </div>

      {/* Section Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSection('all')}
          className={`text-xs font-montserrat font-600 px-3 py-1.5 rounded-xl transition-all ${
            activeSection === 'all' ? 'bg-gold text-charcoal-dark' : 'bg-white/8 text-white/40 hover:text-white/60'
          }`}
        >All Sections</button>
        {SECTIONS.map(s => (
          <button key={s.value}
            onClick={() => setActiveSection(s.value)}
            className={`text-xs font-montserrat font-600 px-3 py-1.5 rounded-xl transition-all ${
              activeSection === s.value ? 'bg-gold text-charcoal-dark' : 'bg-white/8 text-white/40 hover:text-white/60'
            }`}
          >{s.label}</button>
        ))}
      </div>

      {/* Add Field Form */}
      <AnimatePresence>
        {showAddField && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="yuva-card p-6 border border-gold/30"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-montserrat font-700 text-gold text-sm uppercase tracking-wider">New Form Field</p>
              <button onClick={() => setShowAddField(false)} className="text-white/30 hover:text-white/60">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Field label="Field Label *">
                <input className="yuva-input" placeholder="e.g., LinkedIn Profile"
                  value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} />
              </Field>
              <Field label="Placeholder Text">
                <input className="yuva-input" placeholder="e.g., linkedin.com/in/..."
                  value={newField.placeholder} onChange={e => setNewField({ ...newField, placeholder: e.target.value })} />
              </Field>
              <Field label="Field Type">
                <div className="relative">
                  <select className="yuva-select pr-10"
                    value={newField.field_type}
                    onChange={e => setNewField({ ...newField, field_type: e.target.value as FormField['field_type'] })}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </Field>
              <Field label="Section">
                <div className="relative">
                  <select className="yuva-select pr-10"
                    value={newField.section}
                    onChange={e => setNewField({ ...newField, section: e.target.value })}>
                    {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </Field>
              <div className="col-span-2">
                <Field label="Help Text (Optional)">
                  <input className="yuva-input" placeholder="Appears below the field as guidance"
                    value={newField.help_text} onChange={e => setNewField({ ...newField, help_text: e.target.value })} />
                </Field>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <div
                onClick={() => setNewField({ ...newField, is_required: !newField.is_required })}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                  newField.is_required ? 'bg-gold border-gold' : 'border-white/30'
                }`}
              >
                {newField.is_required && <Check size={12} className="text-charcoal-dark" />}
              </div>
              <span className="font-montserrat text-sm text-white/60">Required field</span>
            </label>
            <div className="flex gap-2">
              <button onClick={addField} className="bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5">
                Add Field
              </button>
              <button onClick={() => setShowAddField(false)} className="text-white/40 text-sm font-montserrat px-4">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fields by Section */}
      {visibleSections.map(sectionId => {
        const sectionFields = fields
          .filter(f => f.section === sectionId)
          .sort((a, b) => a.sort_order - b.sort_order);
        const sectionMeta = SECTIONS.find(s => s.value === sectionId);
        if (sectionFields.length === 0 && activeSection !== 'all') return null;

        return (
          <div key={sectionId} className="yuva-card overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/3">
              <p className="font-montserrat font-600 text-white/60 text-sm">{sectionMeta?.label}</p>
              <span className="text-xs text-white/30 font-montserrat">{sectionFields.length} fields</span>
            </div>

            {/* Reorderable Fields */}
            <Reorder.Group
              axis="y"
              values={sectionFields}
              onReorder={(newOrder) => reorderSection(sectionId, newOrder)}
              className="divide-y divide-white/5"
            >
              {sectionFields.map(field => (
                <Reorder.Item key={field.id} value={field} className="focus:outline-none">
                  <div className={`flex items-center gap-3 px-5 py-3.5 bg-charcoal-dark/20 hover:bg-white/3 transition-all border-l-2 ${
                    SECTION_COLORS[sectionId] || 'border-l-white/10'
                  } ${!field.is_visible ? 'opacity-40' : ''}`}>
                    {/* Drag handle */}
                    <GripVertical size={14} className="text-white/20 cursor-grab active:cursor-grabbing flex-shrink-0" />

                    {/* Field info */}
                    <div className="flex-1 min-w-0">
                      {editingField === field.id ? (
                        <div className="grid grid-cols-3 gap-2 py-1">
                          <input className="yuva-input text-xs py-1.5" value={field.label}
                            onChange={e => updateField(field.id, { label: e.target.value })} placeholder="Label" />
                          <input className="yuva-input text-xs py-1.5" value={field.placeholder}
                            onChange={e => updateField(field.id, { placeholder: e.target.value })} placeholder="Placeholder" />
                          <input className="yuva-input text-xs py-1.5" value={field.help_text}
                            onChange={e => updateField(field.id, { help_text: e.target.value })} placeholder="Help text" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="font-montserrat font-600 text-cream text-sm truncate">{field.label}</p>
                          {field.is_required && <span className="text-gold text-xs">*required</span>}
                          <span className="text-white/20 text-xs font-montserrat bg-white/5 px-2 py-0.5 rounded-lg">
                            {field.field_type}
                          </span>
                          <span className="text-white/20 text-xs font-montserrat hidden md:inline">
                            {field.field_key}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => updateField(field.id, { is_required: !field.is_required })}
                        title={field.is_required ? 'Make optional' : 'Make required'}
                        className={`p-1.5 rounded-lg text-xs transition-all ${field.is_required ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/20 hover:text-white/40'}`}>
                        *
                      </button>
                      <button onClick={() => toggleVisible(field.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-white/50 hover:bg-white/8 transition-all">
                        {field.is_visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                      <button onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                        className={`p-1.5 rounded-lg transition-all ${editingField === field.id ? 'bg-gold/20 text-gold' : 'text-white/20 hover:text-gold hover:bg-gold/10'}`}>
                        {editingField === field.id ? <Check size={13} /> : <Edit3 size={13} />}
                      </button>
                      <button onClick={() => removeField(field.id)}
                        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {sectionFields.length === 0 && (
              <div className="px-5 py-6 text-center text-white/20 text-sm font-montserrat">
                No fields in this section
              </div>
            )}
          </div>
        );
      })}

      {pendingChanges && (
        <div className="sticky bottom-4 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-charcoal-dark border border-gold/40 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-gold"
          >
            <span className="text-white/60 text-sm font-montserrat">You have unsaved changes</span>
            <button
              onClick={saveAll}
              disabled={saving}
              className="bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2 hover:bg-gold-light transition-all"
            >
              {saving ? 'Saving...' : 'Save Now'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
