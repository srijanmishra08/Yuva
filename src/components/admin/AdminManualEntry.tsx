'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { Committee } from '@/types';
import { UserPlus } from 'lucide-react';

const COMMITTEES = [
  { value: 'UNHRC', label: 'UNHRC' },
  { value: 'UNSC', label: 'UNSC' },
  { value: 'UNEP', label: 'UNEP' },
  { value: 'WHO', label: 'WHO' },
  { value: 'IPC', label: 'IPC' },
  { value: 'AHC', label: 'AHC' },
];

interface Props {
  committees: Committee[];
  onSuccess: () => void;
}

export default function AdminManualEntry({ committees, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  async function onSubmit(data: Record<string, string>) {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { setLoading(false); return; }

    const res = await fetch('/api/admin/manual-entry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      toast.success(`Delegate created: ${result.delegate_id}`);
      reset();
      onSuccess();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed to add delegate');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
          <UserPlus size={18} />
        </div>
        <div>
          <h2 className="font-montserrat font-700 text-cream">Manual Delegate Entry</h2>
          <p className="text-white/40 text-sm font-montserrat">Add delegates for cash, complimentary, or offline registrations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="yuva-card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="yuva-label">First Name <span className="text-gold">*</span></label>
            <input {...register('first_name', { required: true })} className="yuva-input" placeholder="First name" />
          </div>
          <div>
            <label className="yuva-label">Last Name <span className="text-gold">*</span></label>
            <input {...register('last_name', { required: true })} className="yuva-input" placeholder="Last name" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="yuva-label">Email <span className="text-gold">*</span></label>
            <input {...register('email', { required: true })} type="email" className="yuva-input" placeholder="email@example.com" />
          </div>
          <div>
            <label className="yuva-label">Phone <span className="text-gold">*</span></label>
            <input {...register('phone', { required: true })} className="yuva-input" placeholder="+91 XXXXX XXXXX" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="yuva-label">Class / Year <span className="text-gold">*</span></label>
            <input {...register('class_year', { required: true })} className="yuva-input" placeholder="e.g., Class 12, B.A. 2nd Year" />
          </div>
          <div>
            <label className="yuva-label">Institution <span className="text-gold">*</span></label>
            <input {...register('institution', { required: true })} className="yuva-input" placeholder="School / College name" />
          </div>
        </div>

        <div>
          <label className="yuva-label">MUN Experience (Optional)</label>
          <textarea {...register('experience')} className="yuva-input min-h-[80px] resize-none" placeholder="Previous MUN awards and experience..." />
        </div>

        <div>
          <label className="yuva-label">Committee Preference</label>
          <select {...register('pref1')} className="yuva-select">
            <option value="">Select committee preference</option>
            {committees.map(c => (
              <option key={c.id} value={c.abbreviation}>{c.abbreviation} — {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="yuva-label">Payment Type <span className="text-gold">*</span></label>
          <select {...register('payment_type', { required: true })} className="yuva-select">
            <option value="">Select payment type</option>
            <option value="RAZORPAY">Razorpay (Online)</option>
            <option value="CASH">Cash</option>
            <option value="COMPLIMENTARY">Complimentary</option>
          </select>
        </div>

        <div className="pt-2">
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="yuva-btn-primary w-full"
          >
            {loading ? 'Creating Delegate...' : 'Add Delegate →'}
          </motion.button>
          <p className="text-white/30 text-xs font-montserrat text-center mt-2">
            Delegate ID and QR code will be auto-generated
          </p>
        </div>
      </form>
    </div>
  );
}
