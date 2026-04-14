'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, DollarSign, FormInput, Users, Mail,
  Megaphone, Settings, ChevronLeft, Layers, Shield,
  AlertTriangle, Activity, Globe, Zap, SendHorizonal
} from 'lucide-react';
import type { SuperAdminTab } from '@/types/superadmin';

// Tab panel components
import EventSettings from '@/components/superadmin/EventSettings';
import CommitteeManager from '@/components/superadmin/CommitteeManager';
import PricingManager from '@/components/superadmin/PricingManager';
import FormBuilder from '@/components/superadmin/FormBuilder';
import AdminManager from '@/components/superadmin/AdminManager';
import EmailTemplateEditor from '@/components/superadmin/EmailTemplateEditor';
import AnnouncementManager from '@/components/superadmin/AnnouncementManager';
import SystemControls from '@/components/superadmin/SystemControls';
import EmailBlast from '@/components/superadmin/EmailBlast';

const TABS: {
  id: SuperAdminTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}[] = [
  { id: 'event',        label: 'Event',          sublabel: 'Name, dates, venue',       icon: Calendar,       color: 'text-gold' },
  { id: 'committees',   label: 'Committees',      sublabel: 'Add/edit/delete',           icon: Layers,         color: 'text-blue-400' },
  { id: 'pricing',      label: 'Pricing',         sublabel: 'Fees & add-ons',            icon: DollarSign,     color: 'text-green-400' },
  { id: 'formbuilder',  label: 'Form Builder',    sublabel: 'Fields & sections',         icon: FormInput,      color: 'text-purple-400' },
  { id: 'admins',       label: 'Admin Users',     sublabel: 'Add/remove/change role',    icon: Users,          color: 'text-orange-400' },
  { id: 'emails',       label: 'Email Templates', sublabel: 'Edit email content',        icon: Mail,           color: 'text-pink-400' },
  { id: 'blast',        label: 'Email Blast',     sublabel: 'Targeted announcements',    icon: SendHorizonal,  color: 'text-cyan-400', badge: 'NEW' },
  { id: 'announcements',label: 'Announcements',   sublabel: 'Banners & notices',         icon: Megaphone,      color: 'text-yellow-400' },
  { id: 'system',       label: 'System',          sublabel: 'Maintenance & controls',    icon: Settings,       color: 'text-red-400' },
];

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('event');
  const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin/login'); return; }
      setToken(session.access_token);

      const { data } = await supabase
        .from('admins')
        .select('name, role, is_active')
        .eq('id', session.user.id)
        .single();

      if (!data || data.role !== 'SUPER_ADMIN' || !data.is_active) {
        router.push('/admin');
        return;
      }
      setAdmin(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/30 font-montserrat text-sm">Verifying Super Admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-dark flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-charcoal-dark border-r border-white/10 z-40 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2 text-white/30 hover:text-gold text-xs font-montserrat transition-colors mb-4">
            <ChevronLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FFAA33, #C68642)' }}>
              <Shield size={18} className="text-charcoal-dark" />
            </div>
            <div>
              <p className="font-montserrat font-700 text-cream text-sm">Super Admin</p>
              <p className="font-montserrat text-xs text-white/40">{admin?.name}</p>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/20">
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-gold" />
            <p className="font-montserrat text-xs text-gold font-600">Full Portal Control</p>
          </div>
          <p className="font-montserrat text-xs text-white/30 mt-0.5 leading-relaxed">
            Changes here affect all users in real-time
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                activeTab === tab.id
                  ? 'bg-white/8 border border-white/15'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                activeTab === tab.id ? 'bg-white/10' : 'bg-white/5 group-hover:bg-white/8'
              }`}>
                <tab.icon size={15} className={activeTab === tab.id ? tab.color : 'text-white/40'} />
              </div>
              <div>
                <p className={`font-montserrat text-sm font-600 transition-colors ${
                  activeTab === tab.id ? 'text-cream' : 'text-white/50 group-hover:text-white/70'
                }`}>
                  {tab.label}
                </p>
                <p className="font-montserrat text-xs text-white/25">{tab.sublabel}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                {tab.badge && (
                  <span className="text-[9px] font-montserrat font-700 bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 px-1.5 py-0.5 rounded-full tracking-wider">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className={`w-1.5 h-6 rounded-full ${tab.color.replace('text-', 'bg-')}`} />
                )}
              </div>
            </motion.button>
          ))}
        </nav>

        {/* Footer warning */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="font-montserrat text-xs text-red-400/70 leading-relaxed">
              Super Admin changes are applied immediately and logged.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-charcoal-dark/95 backdrop-blur-xl border-b border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const tab = TABS.find(t => t.id === activeTab)!;
                return (
                  <>
                    <div className={`w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center`}>
                      <tab.icon size={16} className={tab.color} />
                    </div>
                    <div>
                      <h1 className="font-montserrat font-700 text-cream">{tab.label}</h1>
                      <p className="font-montserrat text-xs text-white/30">{tab.sublabel}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-green-400" />
              <span className="font-montserrat text-xs text-green-400">Live</span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'event'         && <EventSettings token={token} />}
              {activeTab === 'committees'    && <CommitteeManager token={token} />}
              {activeTab === 'pricing'       && <PricingManager token={token} />}
              {activeTab === 'formbuilder'   && <FormBuilder token={token} />}
              {activeTab === 'admins'        && <AdminManager token={token} />}
              {activeTab === 'emails'        && <EmailTemplateEditor token={token} />}
              {activeTab === 'blast'         && <EmailBlast token={token} />}
              {activeTab === 'announcements' && <AnnouncementManager token={token} />}
              {activeTab === 'system'        && <SystemControls token={token} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
