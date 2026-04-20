// src/pages/Login.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Activity, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import useStore from '@/store/useStore';

export default function Login() {
  const navigate    = useNavigate();
  const { login, isAuthenticated } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef      = useRef<HTMLDivElement>(null);

  const [email,    setEmail]    = useState('nurse@medflow.io');
  const [password, setPassword] = useState('medflow123');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  if (isAuthenticated) { navigate('/'); return null; }

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo float-in
      gsap.fromTo(logoRef.current,
        { opacity: 0, y: -30, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'back.out(1.4)' }
      );
      // Form elements stagger
      gsap.fromTo('.login-field',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: 'power3.out', delay: 0.3 }
      );
      // Ambient grid
      gsap.to('.grid-bg', { opacity: 0.4, duration: 1.2, ease: 'power2.out', delay: 0.1 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      login(res.data.user, res.data.token);
      // GSAP exit animation
      gsap.to(containerRef.current, {
        opacity: 0, y: -16, duration: 0.35, ease: 'power2.in',
        onComplete: () => navigate('/'),
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error || 'Login failed';
      setError(msg);
      gsap.fromTo('.login-card', { x: -8 }, { x: 8, yoyo: true, repeat: 3, duration: 0.07 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">

      {/* Ambient grid */}
      <div className="grid-bg absolute inset-0 opacity-0"
           style={{ backgroundImage:'var(--tw-gradient-from)', background:'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)', backgroundSize:'40px 40px' }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background:'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div ref={logoRef} className="mb-10 text-center opacity-0">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative">
            <Activity size={28} className="text-cyan" />
            <div className="absolute inset-0 animate-ping opacity-20"
                 style={{ background:'radial-gradient(circle, rgba(0,212,255,0.6) 0%, transparent 70%)' }} />
          </div>
          <span className="font-mono font-bold text-2xl tracking-[0.25em] text-white">MEDFLOW</span>
        </div>
        <p className="font-mono text-xs text-grey-400 tracking-[0.2em] uppercase">
          AI Clinical Monitoring System
        </p>
      </div>

      {/* Card */}
      <motion.div
        className="login-card glass w-full max-w-sm mx-4"
        style={{ padding: '2rem' }}
      >
        <div className="brackets"><span /></div>

        <h2 className="font-mono text-sm font-bold tracking-widest text-white uppercase mb-1">
          Station Login
        </h2>
        <p className="text-grey-400 text-xs mb-6">
          Authorised personnel only
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="login-field opacity-0">
            <label className="section-label block mb-1.5">Email</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark pl-8"
                placeholder="nurse@medflow.io"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field opacity-0">
            <label className="section-label block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-dark pl-8 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-400 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity:0, y:-4 }}
              animate={{ opacity:1, y:0 }}
              className="font-mono text-xs text-red border border-red/25 rounded-md px-3 py-2 bg-red/5"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <div className="login-field opacity-0 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-cyan justify-center py-2.5 text-sm relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border border-cyan border-t-transparent rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : 'ACCESS STATION'}
            </button>
          </div>
        </form>

        {/* Demo hint */}
        <div className="divider-h my-4" />
        <div className="text-center">
          <p className="font-mono text-xs text-grey-400">
            Demo: <span className="text-grey-200">nurse@medflow.io</span> / <span className="text-grey-200">medflow123</span>
          </p>
        </div>
      </motion.div>

      {/* Version tag */}
      <p className="mt-8 font-mono text-xs text-grey-400 opacity-40">
        MEDFLOW v1.0.0-MVP · DOCKER EDITION
      </p>
    </div>
  );
}
