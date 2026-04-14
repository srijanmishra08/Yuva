'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Eye, Code, Save, RefreshCw, Tag, Send } from 'lucide-react';
import { SectionHeader, Field, SettingsLoader } from './EventSettings';
import type { EmailTemplate } from '@/types/superadmin';

export default function EmailTemplateEditor({ token }: { token: string }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<EmailTemplate>>({});
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetch('/api/superadmin/email-templates', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.templates) setTemplates(d.templates); })
      .finally(() => setLoading(false));
  }, [token]);

  function selectTemplate(t: EmailTemplate) {
    setActiveTemplate(t.id);
    setEditValues({ subject: t.subject, body_html: t.body_html, name: t.name });
    setPreviewMode('code');
  }

  async function saveTemplate() {
    if (!activeTemplate) return;
    setSaving(true);
    const res = await fetch(`/api/superadmin/email-templates/${activeTemplate}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editValues),
    });
    if (res.ok) {
      toast.success('Email template saved!');
      setTemplates(prev => prev.map(t => t.id === activeTemplate ? { ...t, ...editValues } as EmailTemplate : t));
    } else toast.error('Failed to save template');
    setSaving(false);
  }

  async function sendTest() {
    if (!testEmail || !activeTemplate) return;
    setSendingTest(true);
    const res = await fetch('/api/superadmin/email-templates/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ template_id: activeTemplate, test_email: testEmail }),
    });
    if (res.ok) toast.success(`Test email sent to ${testEmail}!`);
    else toast.error('Failed to send test');
    setSendingTest(false);
  }

  async function resetToDefault(templateId: string) {
    if (!confirm('Reset this template to the default content? Your changes will be lost.')) return;
    const res = await fetch(`/api/superadmin/email-templates/${templateId}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      toast.success('Template reset to default');
      const d = await res.json();
      setEditValues({ subject: d.template.subject, body_html: d.template.body_html });
      setTemplates(prev => prev.map(t => t.id === templateId ? d.template : t));
    }
  }

  const activeTemplateMeta = templates.find(t => t.id === activeTemplate);

  if (loading) return <SettingsLoader />;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={<Mail size={18} />}
        title="Email Template Editor"
        description="Customize the HTML email content sent to delegates. Use template variables like {{first_name}}."
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          <p className="font-montserrat font-600 text-white/40 text-xs uppercase tracking-wider">Templates</p>
          {templates.map(t => (
            <motion.button
              key={t.id}
              onClick={() => selectTemplate(t)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                activeTemplate === t.id
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-white/4 border-white/10 hover:bg-white/8'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Mail size={13} className={activeTemplate === t.id ? 'text-gold' : 'text-white/30'} />
                <p className={`font-montserrat font-600 text-sm ${activeTemplate === t.id ? 'text-gold' : 'text-white/60'}`}>
                  {t.name}
                </p>
              </div>
              <p className="font-montserrat text-xs text-white/30 truncate">{t.subject.replace('{{delegate_id}}', 'YDS26-001')}</p>
              <div className="flex items-center gap-1 mt-2">
                <div className={`w-1.5 h-1.5 rounded-full ${t.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs font-montserrat text-white/20">{t.is_active ? 'Active' : 'Disabled'}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Editor */}
        <div className="col-span-2">
          {activeTemplate ? (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <Field label="Email Subject">
                  <input
                    className="yuva-input"
                    value={editValues.subject ?? ''}
                    onChange={e => setEditValues(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Email subject line..."
                  />
                </Field>
              </div>

              {/* Variables reference */}
              {activeTemplateMeta?.variables && activeTemplateMeta.variables.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-charcoal-dark/60 rounded-xl border border-white/10">
                  <span className="font-montserrat text-xs text-white/30 mr-1 self-center">
                    <Tag size={10} className="inline mr-1" />Variables:
                  </span>
                  {activeTemplateMeta.variables.map(v => (
                    <button
                      key={v}
                      onClick={() => {
                        const tag = `{{${v}}}`;
                        setEditValues(prev => ({ ...prev, body_html: (prev.body_html || '') + tag }));
                      }}
                      className="font-montserrat text-xs bg-gold/10 text-gold border border-gold/20 rounded-lg px-2 py-0.5 hover:bg-gold/20 transition-all"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              )}

              {/* Code / Preview toggle */}
              <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl w-fit">
                <button
                  onClick={() => setPreviewMode('code')}
                  className={`flex items-center gap-1.5 text-xs font-montserrat font-600 px-3 py-1.5 rounded-lg transition-all ${
                    previewMode === 'code' ? 'bg-white/15 text-cream' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Code size={12} /> HTML
                </button>
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`flex items-center gap-1.5 text-xs font-montserrat font-600 px-3 py-1.5 rounded-lg transition-all ${
                    previewMode === 'preview' ? 'bg-white/15 text-cream' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>

              {previewMode === 'code' ? (
                <textarea
                  className="yuva-input font-mono text-xs leading-relaxed resize-none"
                  style={{ minHeight: '360px' }}
                  value={editValues.body_html ?? ''}
                  onChange={e => setEditValues(prev => ({ ...prev, body_html: e.target.value }))}
                  placeholder="<!DOCTYPE html>..."
                  spellCheck={false}
                />
              ) : (
                <div className="bg-white rounded-2xl overflow-hidden border border-white/10" style={{ minHeight: '360px' }}>
                  <iframe
                    srcDoc={editValues.body_html?.replace(/\{\{(\w+)\}\}/g, (_, k) => `[${k}]`) || '<p style="padding:20px;color:#666">No HTML content</p>'}
                    className="w-full border-0"
                    style={{ minHeight: '360px' }}
                    title="Email Preview"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-gold text-charcoal-dark font-montserrat font-700 text-sm rounded-xl px-5 py-2.5 hover:bg-gold-light transition-all"
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  onClick={() => resetToDefault(activeTemplate)}
                  className="flex items-center gap-1.5 text-white/40 hover:text-white/60 text-sm font-montserrat border border-white/15 hover:border-white/25 rounded-xl px-4 py-2.5 transition-all"
                >
                  <RefreshCw size={13} /> Reset to Default
                </button>
              </div>

              {/* Test email */}
              <div className="p-4 bg-white/4 rounded-2xl border border-white/10">
                <p className="font-montserrat font-600 text-white/50 text-xs uppercase tracking-wider mb-3">Send Test Email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="yuva-input text-sm flex-1"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                  />
                  <button
                    onClick={sendTest}
                    disabled={sendingTest || !testEmail}
                    className="flex items-center gap-1.5 bg-white/8 hover:bg-white/12 border border-white/15 text-white/60 hover:text-cream text-sm font-montserrat font-600 rounded-xl px-4 py-2.5 transition-all disabled:opacity-40"
                  >
                    <Send size={13} />
                    {sendingTest ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-white/20 font-montserrat text-sm">
              ← Select a template to edit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
