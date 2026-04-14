'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ChevronDown, CheckCircle, ArrowLeft, User, MapPin, Users, Star, CreditCard, Gift, Sparkles } from 'lucide-react';
import type { RegistrationFormData } from '@/types';

const COMMITTEES = [
  { value: 'UNHRC', label: 'United Nations Human Rights Council (UNHRC)' },
  { value: 'UNSC', label: 'United Nations Security Council (UNSC)' },
  { value: 'UNEP', label: 'United Nations Environment Programme (UNEP)' },
  { value: 'WHO', label: 'World Health Organization (WHO)' },
  { value: 'IPC', label: 'International Press Corps (IPC)' },
  { value: 'AHC', label: 'Ad Hoc Committee (AHC)' },
];

const registrationSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number required').max(15),
  class_year: z.string().min(1, 'Class/Year is required'),
  institution: z.string().min(2, 'Institution is required'),
  address: z.string().min(5, 'Address is required'),
  pin_code: z.string().min(6, 'PIN code required').max(6),
  city: z.string().min(2, 'City is required'),
  parent_name: z.string().min(2, 'Parent/Guardian name required'),
  parent_contact: z.string().min(10, 'Parent contact required'),
  instagram_handle: z.string().optional(),
  pref1: z.string().min(1, 'Committee Preference 1 required'),
  portfolio_pref1: z.string().optional(),
  pref2: z.string().min(1, 'Committee Preference 2 required'),
  experience: z.string().optional(),
  carnival_pass: z.boolean().default(false),
  referred_by: z.string().optional(),
});

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

export default function RegisterPage() {
  const [carnivalPass, setCarnivalPass] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [successData, setSuccessData] = useState<{ delegateId: string; name: string } | null>(null);

  const totalFee = carnivalPass ? 698 : 499;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { carnival_pass: false },
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      // Create Razorpay order
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, carnival_pass: carnivalPass }),
      });
      
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || 'Failed to create order');
      }
      
      const { orderId, amount } = await orderRes.json();

      if (!razorpayLoaded) {
        throw new Error('Payment system not loaded. Please refresh and try again.');
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: amount,
        currency: 'INR',
        name: 'YUVA Diplomacy Summit',
        description: `Delegate Registration — ${data.first_name} ${data.last_name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error('Payment verification failed');

            const result = await verifyRes.json();
            setSuccessData({ delegateId: result.delegate_id, name: `${data.first_name} ${data.last_name}` });
            setStep('success');
            toast.success('Registration successful! 🎉');
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          contact: data.phone,
        },
        theme: { color: '#FFAA33' },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            toast('Payment cancelled', { icon: '⚠️' });
          },
        },
      });

      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success' && successData) {
    return <SuccessScreen delegateId={successData.delegateId} name={successData.name} />;
  }

  return (
    <div className="min-h-screen bg-charcoal-dark">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-40 w-96 h-96 bg-bronze/3 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,170,51,0.03) 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-gold text-sm font-montserrat mb-6 transition-colors">
            <ArrowLeft size={14} />
            Back to Home
          </Link>
          <p className="text-gold/70 font-montserrat text-xs tracking-[6px] uppercase mb-2">Official Registration</p>
          <h1 className="font-anton text-5xl md:text-6xl tracking-wider mb-2" style={{
            background: 'linear-gradient(135deg, #FFAA33 0%, #C68642 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>YUVA DIPLOMACY SUMMIT</h1>
          <p className="font-montserrat text-white/50 text-sm">YDS 2026 — Delegate Registration</p>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section: Delegate Details */}
          <FormSection
            icon={<User size={18} />}
            title="Delegate Details"
            delay={0.1}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.first_name?.message} required>
                <input {...register('first_name')} className="yuva-input" placeholder="Arjun" />
              </FormField>
              <FormField label="Last Name" error={errors.last_name?.message} required>
                <input {...register('last_name')} className="yuva-input" placeholder="Sharma" />
              </FormField>
              <FormField label="Email Address" error={errors.email?.message} required>
                <input {...register('email')} type="email" className="yuva-input" placeholder="arjun@example.com" />
              </FormField>
              <FormField label="Contact Number" error={errors.phone?.message} required>
                <input {...register('phone')} type="tel" className="yuva-input" placeholder="+91 98765 43210" />
              </FormField>
              <FormField label="Class or Year & Stream" error={errors.class_year?.message} required>
                <input {...register('class_year')} className="yuva-input" placeholder="Class 12 — Science / B.A. 2nd Year" />
              </FormField>
              <FormField label="Institution" error={errors.institution?.message} required>
                <input {...register('institution')} className="yuva-input" placeholder="Delhi Public School" />
              </FormField>
            </div>
          </FormSection>

          {/* Section: Address */}
          <FormSection icon={<MapPin size={18} />} title="Address Details" delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormField label="Full Address with PIN Code" error={errors.address?.message} required>
                  <textarea {...register('address')} className="yuva-input min-h-[80px] resize-none" placeholder="House No., Street, Area, City" />
                </FormField>
              </div>
              <FormField label="PIN Code" error={errors.pin_code?.message} required>
                <input {...register('pin_code')} className="yuva-input" placeholder="110001" maxLength={6} />
              </FormField>
              <FormField label="City" error={errors.city?.message} required>
                <input {...register('city')} className="yuva-input" placeholder="New Delhi" />
              </FormField>
            </div>
          </FormSection>

          {/* Section: Parent/Guardian */}
          <FormSection icon={<Users size={18} />} title="Parent / Guardian Details" delay={0.2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Name of Parent / Guardian" error={errors.parent_name?.message} required>
                <input {...register('parent_name')} className="yuva-input" placeholder="Rajesh Sharma" />
              </FormField>
              <FormField label="Contact Number" error={errors.parent_contact?.message} required>
                <input {...register('parent_contact')} type="tel" className="yuva-input" placeholder="+91 98765 43210" />
              </FormField>
            </div>
          </FormSection>

          {/* Section: Additional */}
          <FormSection icon={<Sparkles size={18} />} title="Additional Information" delay={0.25}>
            <FormField label="Instagram Handle" hint="Optional">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-montserrat">@</span>
                <input {...register('instagram_handle')} className="yuva-input pl-8" placeholder="yourhandle" />
              </div>
            </FormField>
          </FormSection>

          {/* Section: Committee Preferences */}
          <FormSection icon={<Star size={18} />} title="Committee Preferences" delay={0.3}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Committee Preference 1" error={errors.pref1?.message} required>
                  <div className="relative">
                    <select {...register('pref1')} className="yuva-select pr-10">
                      <option value="">Select Committee</option>
                      {COMMITTEES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </FormField>
                <FormField label="Portfolio Preference (Committee 1)" hint="Optional">
                  <input {...register('portfolio_pref1')} className="yuva-input" placeholder="e.g., India, USA..." />
                </FormField>
              </div>
              <FormField label="Committee Preference 2" error={errors.pref2?.message} required>
                <div className="relative">
                  <select {...register('pref2')} className="yuva-select pr-10">
                    <option value="">Select Committee</option>
                    {COMMITTEES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                </div>
              </FormField>
            </div>
          </FormSection>

          {/* Section: Experience */}
          <FormSection icon={<Star size={18} />} title="Experience" delay={0.35}>
            <FormField label="Previous MUN Experience / Awards" hint="Optional">
              <textarea
                {...register('experience')}
                className="yuva-input min-h-[100px] resize-none"
                placeholder="e.g., Best Delegate at XYZ MUN 2024, participated in ABC Conference..."
              />
            </FormField>
          </FormSection>

          {/* Section: Fees */}
          <FormSection icon={<CreditCard size={18} />} title="Registration Fees" delay={0.4}>
            {/* Base fee */}
            <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/20 rounded-2xl mb-4">
              <div>
                <p className="font-montserrat font-700 text-cream text-base">Registration Fee</p>
                <p className="font-montserrat text-xs text-white/50 mt-0.5">Includes Registration + Food + Participation</p>
              </div>
              <p className="font-anton text-2xl text-gold">₹499</p>
            </div>

            {/* Add-on */}
            <label className="flex items-center gap-4 p-4 bg-charcoal border border-white/10 rounded-2xl cursor-pointer hover:border-gold/30 transition-all duration-200 group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={carnivalPass}
                  onChange={(e) => setCarnivalPass(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  carnivalPass ? 'bg-gold border-gold' : 'border-white/30 group-hover:border-gold/50'
                }`}>
                  {carnivalPass && <CheckCircle size={14} className="text-charcoal-dark" />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-gold" />
                  <p className="font-montserrat font-700 text-cream">Funology Carnival & Sundowner Pass</p>
                </div>
                <p className="font-montserrat text-xs text-white/50 mt-0.5">Add exclusive carnival & sundowner experience</p>
              </div>
              <p className="font-montserrat font-700 text-gold">+₹199</p>
            </label>

            {/* Total */}
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              key={totalFee}
              className="flex items-center justify-between p-5 mt-4 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,170,51,0.15), rgba(198,134,66,0.1))',
                border: '1px solid rgba(255,170,51,0.4)',
              }}
            >
              <div>
                <p className="font-montserrat text-xs text-white/50 uppercase tracking-wider">Total Amount</p>
                <p className="font-montserrat text-sm text-white/70 mt-0.5">
                  {carnivalPass ? 'Registration + Carnival Pass' : 'Registration Only'}
                </p>
              </div>
              <motion.p
                key={totalFee}
                initial={{ scale: 1.2, color: '#FFD280' }}
                animate={{ scale: 1, color: '#FFAA33' }}
                className="font-anton text-4xl text-gold"
              >
                ₹{totalFee}
              </motion.p>
            </motion.div>
          </FormSection>

          {/* Section: Referral */}
          <FormSection icon={<Users size={18} />} title="Referral" delay={0.45}>
            <FormField label="Referred By" hint="Optional">
              <input {...register('referred_by')} className="yuva-input" placeholder="Name of the person who referred you" />
            </FormField>
          </FormSection>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.02, boxShadow: '0 0 50px rgba(255,170,51,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-5 rounded-2xl font-anton text-2xl tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #FFAA33 0%, #C68642 100%)',
                color: '#111827',
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Register Now — ₹${totalFee}`
              )}
            </motion.button>
            <p className="text-center text-white/30 text-xs font-montserrat mt-3">
              Secured by Razorpay · SSL Encrypted
            </p>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function FormSection({ children, title, icon, delay = 0 }: {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="yuva-card p-6 mb-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
          {icon}
        </div>
        <h3 className="form-section-title text-base">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function FormField({ label, children, error, hint, required }: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="yuva-label">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
        {hint && <span className="text-white/30 ml-2 text-xs normal-case tracking-normal">({hint})</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs font-montserrat mt-1.5 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function SuccessScreen({ delegateId, name }: { delegateId: string; name: string }) {
  return (
    <div className="min-h-screen bg-charcoal-dark flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        <div className="yuva-card p-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle size={40} className="text-gold" />
          </motion.div>
          
          <h2 className="font-anton text-3xl text-cream mb-2">Registration Confirmed!</h2>
          <p className="text-white/60 font-montserrat text-sm mb-6">Welcome to the YUVA Diplomacy Summit, {name.split(' ')[0]}!</p>
          
          <div className="bg-charcoal-dark rounded-2xl p-6 mb-6 border border-gold/30">
            <p className="text-white/40 text-xs font-montserrat uppercase tracking-widest mb-2">Your Delegate ID</p>
            <p className="font-impact text-4xl tracking-widest text-gold">{delegateId}</p>
          </div>
          
          <p className="text-white/40 text-sm font-montserrat mb-6">
            A confirmation email has been sent to your registered email address.
          </p>
          
          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="yuva-btn-primary w-full"
            >
              Go to Dashboard →
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
