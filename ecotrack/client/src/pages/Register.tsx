// src/pages/Register.tsx
// EcoTrack Sign-Up page — mirrors Login layout with 3D globe on left
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  Leaf, Mail, Lock, Eye, EyeOff, User, Phone,
  MapPin, Briefcase, CheckCircle, ArrowLeft
} from 'lucide-react';
import axios from 'axios';
import HeroScene from '@/components/HeroScene';

const ROLES = ['manager', 'driver', 'analyst', 'supervisor'] as const;
const ZONES = ['Zone A - North', 'Zone B - South', 'Zone C - East', 'Zone D - West', 'Zone E - Central'] as const;

type Role = typeof ROLES[number];
type Zone = typeof ZONES[number];

interface FormState {
  name: string;
  email: string;
  phone: string;
  role: Role;
  zone: Zone;
  password: string;
  confirmPassword: string;
}

/**
 * Render the two-step registration page for creating an EcoTrack account.
 *
 * The component provides a two-step form (account info then password), client-side validation,
 * animated UI transitions, submission to the backend registration endpoint, and a success state
 * shown after a successful registration.
 *
 * @returns The JSX element for the registration page UI.
 */
export default function Register() {
  const navigate  = useNavigate();
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [step, setStep]           = useState<1 | 2>(1);
  const [showPw, setShowPw]       = useState(false);
  const [showCPw, setShowCPw]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState<FormState>({
    name: '', email: '', phone: '', role: 'manager',
    zone: 'Zone A - North', password: '', confirmPassword: '',
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.reg-form',  { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.25 });
      gsap.fromTo('.reg-field', { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.45, ease: 'power3.out', delay: 0.4 });
    }, wrapRef.current!);
    return () => ctx.revert();
  }, []);

  // Re-animate fields when switching steps
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.reg-field', { y: 10, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.38, ease: 'power3.out' });
    }, wrapRef.current!);
    return () => ctx.revert();
  }, [step]);

  function set(k: keyof FormState, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setError('');
  }

  function validateStep1() {
    if (!form.name.trim())  { setError('Full name is required.'); return false; }
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setError('Enter a valid email address.'); return false; }
    return true;
  }

  function validateStep2() {
    if (form.password.length < 8)             { setError('Password must be at least 8 characters.'); return false; }
    if (form.password !== form.confirmPassword){ setError('Passwords do not match.'); return false; }
    return true;
  }

  function nextStep() {
    if (!validateStep1()) {
      gsap.fromTo('.reg-form', { x: -8 }, { x: 8, yoyo: true, repeat: 3, duration: 0.07, clearProps: 'x' });
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep2()) {
      gsap.fromTo('.reg-form', { x: -8 }, { x: 8, yoyo: true, repeat: 3, duration: 0.07, clearProps: 'x' });
      return;
    }
    setLoading(true);
    setError('');
    try {
      const base = (import.meta.env.VITE_API_URL || '') + '/api';
      await axios.post(`${base}/auth/register`, {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    form.phone.trim(),
        role:     form.role,
        zone:     form.zone,
        password: form.password,
      });
      setSuccess(true);
      gsap.fromTo('.success-card', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      gsap.fromTo('.reg-form', { x: -8 }, { x: 8, yoyo: true, repeat: 3, duration: 0.07, clearProps: 'x' });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'input pl-10';

  return (
    <div ref={wrapRef} className="min-h-screen flex overflow-hidden" style={{ background: '#052e16' }}>

      {/* Left — 3D globe */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative">
        <HeroScene height={600} />
        <div className="absolute bottom-12 text-center px-8">
          <div className="font-mono text-white/60 text-small leading-relaxed">
            AI-Powered Waste Logistics<br />Track · Route · Optimise
          </div>
        </div>
        {/* Brand */}
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center leaf"
               style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Leaf size={20} color="#fff" />
          </div>
          <div>
            <div className="font-mono font-bold text-white" style={{ fontSize: '1.1rem', letterSpacing: '0.2em' }}>ECOTRACK</div>
            <div className="font-mono text-white/50" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>WASTE LOGISTICS</div>
          </div>
        </div>

        {/* Progress steps panel */}
        <div className="absolute top-12 right-12 flex flex-col gap-3">
          {(['Account Info', 'Set Password'] as const).map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300"
                   style={{
                     background: step > i + 1 ? '#22c55e' : step === i + 1 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                     color:      step > i + 1 ? '#fff'    : step === i + 1 ? '#14532d'                : 'rgba(255,255,255,0.4)',
                   }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className="font-mono text-xs" style={{ color: step === i + 1 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8"
           style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)' }}>
        <div className="reg-form opacity-0 w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#14532d' }}>
              <Leaf size={20} color="#fff" />
            </div>
            <div>
              <div className="font-mono font-bold text-green-900" style={{ fontSize: '1.1rem', letterSpacing: '0.2em' }}>ECOTRACK</div>
              <div className="section-heading">Waste Logistics Platform</div>
            </div>
          </div>

          {success ? (
            /* ── Success State ── */
            <div className="success-card card p-8 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                   style={{ background: 'rgba(34,197,94,0.12)' }}>
                <CheckCircle size={32} color="#16a34a" />
              </div>
              <h2 className="page-title text-green-900 mb-2">Account Created!</h2>
              <p className="text-body mb-1" style={{ color: '#334155' }}>
                Welcome to EcoTrack, <strong>{form.name}</strong>.
              </p>
              <p className="font-mono mb-6" style={{ fontSize: '0.8rem', color: '#475569' }}>
                Your <span className="font-bold" style={{ color: '#14532d' }}>{form.role}</span> account is ready.
                An admin may need to activate it before first login.
              </p>
              <button onClick={() => navigate('/login')}
                      className="btn-green w-full justify-center py-3 rounded-xl">
                Go to Login →
              </button>
            </div>
          ) : (
            <div className="card p-8">
              <div className="mb-6">
                <h1 className="page-title text-green-900 mb-1">
                  {step === 1 ? 'Create your account' : 'Secure your account'}
                </h1>
                <p className="text-body" style={{ color: '#334155' }}>
                  {step === 1
                    ? 'Join EcoTrack — waste logistics, reimagined.'
                    : 'Set a strong password to protect your data.'}
                </p>
              </div>

              {/* Step indicator (mobile) */}
              <div className="flex gap-2 mb-5 lg:hidden">
                {[1, 2].map(n => (
                  <div key={n} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                       style={{ background: step >= n ? '#22c55e' : '#d1fae5' }} />
                ))}
              </div>

              <form onSubmit={step === 1 ? (e) => { e.preventDefault(); nextStep(); } : handleSubmit}
                    className="space-y-4">

                {step === 1 && (<>
                  {/* Full Name */}
                  <div className="reg-field opacity-0">
                    <label className="section-heading block mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input className={inputCls} placeholder="Arjun Sharma" required
                             value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="reg-field opacity-0">
                    <label className="section-heading block mb-1.5">Work Email *</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" className={inputCls} placeholder="arjun@ecotrack.io" required
                             value={form.email} onChange={e => set('email', e.target.value)} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="reg-field opacity-0">
                    <label className="section-heading block mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="tel" className={inputCls} placeholder="+91 98765 43210"
                             value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                  </div>

                  {/* Role + Zone row */}
                  <div className="reg-field opacity-0 grid grid-cols-2 gap-3">
                    <div>
                      <label className="section-heading block mb-1.5">Role *</label>
                      <div className="relative">
                        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select className="select pl-9 py-2.5"
                                value={form.role} onChange={e => set('role', e.target.value as Role)}>
                          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="section-heading block mb-1.5">Zone</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select className="select pl-9 py-2.5"
                                value={form.zone} onChange={e => set('zone', e.target.value as Zone)}>
                          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </>)}

                {step === 2 && (<>
                  {/* Summary chip */}
                  <div className="reg-field opacity-0 flex items-center gap-3 px-4 py-3 rounded-2xl"
                       style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                         style={{ background: '#14532d' }}>
                      <User size={16} color="#fff" />
                    </div>
                    <div>
                      <div className="font-bold text-green-900" style={{ fontSize: '0.9rem' }}>{form.name}</div>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: '#475569' }}>
                        {form.email} · {form.role}
                      </div>
                    </div>
                    <button type="button" onClick={() => setStep(1)}
                            className="ml-auto flex items-center gap-1 font-mono text-xs"
                            style={{ color: '#16a34a' }}>
                      <ArrowLeft size={12} /> Edit
                    </button>
                  </div>

                  {/* Password */}
                  <div className="reg-field opacity-0">
                    <label className="section-heading block mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showPw ? 'text' : 'password'} className="input pl-10 pr-11"
                             placeholder="Min 8 characters" required minLength={8}
                             value={form.password} onChange={e => set('password', e.target.value)} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                              style={{ color: '#64748b' }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {form.password && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[8, 12, 16].map((len, i) => (
                            <div key={len} className="flex-1 h-1 rounded-full transition-all duration-300"
                                 style={{ background: form.password.length >= len ? (i === 0 ? '#f59e0b' : i === 1 ? '#22c55e' : '#16a34a') : '#d1fae5' }} />
                          ))}
                        </div>
                        <div className="font-mono mt-1" style={{ fontSize: '0.65rem', color: '#475569' }}>
                          {form.password.length < 8 ? 'Too short' : form.password.length < 12 ? 'Moderate' : form.password.length < 16 ? 'Strong' : 'Very strong'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="reg-field opacity-0">
                    <label className="section-heading block mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type={showCPw ? 'text' : 'password'} className="input pl-10 pr-11"
                             placeholder="Repeat password" required
                             value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                      <button type="button" onClick={() => setShowCPw(v => !v)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                              style={{ color: '#64748b' }}>
                        {showCPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.confirmPassword && form.password !== form.confirmPassword && (
                      <p className="font-mono mt-1" style={{ fontSize: '0.7rem', color: '#ef4444' }}>Passwords do not match</p>
                    )}
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <p className="font-mono mt-1 flex items-center gap-1" style={{ fontSize: '0.7rem', color: '#16a34a' }}>
                        <CheckCircle size={11} /> Passwords match
                      </p>
                    )}
                  </div>
                </>)}

                {/* Error */}
                {error && (
                  <div className="reg-field rounded-xl px-3.5 py-2.5 bg-red-50 border border-red-200">
                    <p className="font-mono text-red-600" style={{ fontSize: '0.75rem' }}>{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <div className="reg-field opacity-0 pt-1">
                  <button type="submit" disabled={loading}
                          className="btn-green w-full justify-center py-3 text-body rounded-xl">
                    {loading
                      ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Processing…</>
                      : step === 1 ? 'Continue →' : 'Create Account'
                    }
                  </button>
                </div>
              </form>

              <div className="eco-divider mt-5 mb-4" />
              <p className="text-center font-mono" style={{ fontSize: '0.75rem', color: '#334155' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-bold" style={{ color: '#15803d' }}>Sign in →</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
