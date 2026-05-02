// src/pages/Login.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Leaf, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/lib/api';
import useStore from '@/store/useStore';
import HeroScene from '@/components/HeroScene';

export default function Login() {
  const navigate   = useNavigate();
  const { login, isAuth } = useStore();
  const wrapRef    = useRef<HTMLDivElement>(null);
  const [email,    setEmail]    = useState('manager@ecotrack.io');
  const [password, setPassword] = useState('eco123');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Redirect if already authenticated — must be in useEffect, not during render
  useEffect(() => {
    if (isAuth) navigate('/', { replace: true });
  }, [isAuth, navigate]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.login-form',  { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.3 });
      gsap.fromTo('.login-field', { y: 12, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.09, duration: 0.45, ease: 'power3.out', delay: 0.5 });
    }, wrapRef.current);
    return () => { ctx.revert(); };
  }, []);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      login(res.data.user, res.data.token);
      // Navigate immediately — the useEffect above will also fire but navigate is idempotent
      navigate('/', { replace: true });
    } catch {
      setError('Invalid credentials. Try manager@ecotrack.io / eco123');
      if (wrapRef.current) {
        gsap.fromTo('.login-form', { x: -8 }, { x: 8, yoyo: true, repeat: 3, duration: 0.07, clearProps: 'x' });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={wrapRef} className="min-h-screen flex overflow-hidden" style={{background:'#052e16'}}>

      {/* Left — 3D globe */}
      <div className="hidden lg:flex flex-col items-center justify-center w-1/2 relative">
        <HeroScene height={600} />
        <div className="absolute bottom-12 text-center px-8">
          <div className="font-mono text-white/60 text-small leading-relaxed">
            AI-Powered Waste Logistics<br/>Track · Route · Optimise
          </div>
        </div>
        {/* Brand overlay */}
        <div className="absolute top-12 left-12 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center leaf"
               style={{background:'rgba(255,255,255,0.15)'}}>
            <Leaf size={20} color="#fff"/>
          </div>
          <div>
            <div className="font-mono font-bold text-white" style={{fontSize:'1.1rem',letterSpacing:'0.2em'}}>ECOTRACK</div>
            <div className="font-mono text-white/50" style={{fontSize:'0.65rem',letterSpacing:'0.15em'}}>WASTE LOGISTICS</div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8"
           style={{background:'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)'}}>
        <div className="login-form opacity-0 w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                 style={{background:'#14532d'}}><Leaf size={20} color="#fff"/></div>
            <div>
              <div className="font-mono font-bold text-green-900" style={{fontSize:'1.1rem',letterSpacing:'0.2em'}}>ECOTRACK</div>
              <div className="section-heading">Waste Logistics Platform</div>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-7">
              <h1 className="page-title text-green-900 mb-1">Welcome back</h1>
              <p className="text-body text-slate-500">Sign in to your logistics dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="login-field opacity-0">
                <label className="section-heading block mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                         className="input pl-10" placeholder="manager@ecotrack.io" required/>
                </div>
              </div>
              <div className="login-field opacity-0">
                <label className="section-heading block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
                  <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                         className="input pl-10 pr-11" placeholder="••••••••" required/>
                  <button type="button" onClick={()=>setShowPw(v=>!v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </div>
              {error && (
                <div className="login-field rounded-xl px-3.5 py-2.5 bg-red-50 border border-red-200">
                  <p className="font-mono text-red-600" style={{fontSize:'0.75rem'}}>{error}</p>
                </div>
              )}
              <div className="login-field opacity-0 pt-2">
                <button type="submit" disabled={loading} className="btn-green w-full justify-center py-3 text-body rounded-xl">
                  {loading
                    ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"/>Authenticating…</>
                    : 'Access Dashboard'
                  }
                </button>
              </div>
            </form>
            <div className="eco-divider mt-6 mb-4"/>
            <p className="text-center font-mono text-slate-400" style={{fontSize:'0.75rem'}}>
              Demo: manager@ecotrack.io · eco123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
