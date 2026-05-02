// src/pages/Login.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Activity, Mail, Lock, Eye, EyeOff, ShoppingCart } from 'lucide-react';
import { authApi } from '@/lib/api';
import useStore from '@/store/useStore';

export default function Login() {
  const navigate   = useNavigate();
  const { login, isAuth } = useStore();
  const wrapRef    = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);

  const [email,    setEmail]    = useState('manager@store.io');
  const [password, setPassword] = useState('retail123');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (isAuth) { navigate('/'); }
  }, [isAuth, navigate]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.login-logo',  { y:-30, opacity:0, scale:0.85 }, { y:0, opacity:1, scale:1, duration:0.8, ease:'back.out(1.5)' });
      gsap.fromTo('.login-card',  { y:24,  opacity:0 },              { y:0, opacity:1, duration:0.6, ease:'power3.out', delay:0.2 });
      gsap.fromTo('.login-field', { y:12,  opacity:0 },              { y:0, opacity:1, stagger:0.1, duration:0.4, ease:'power3.out', delay:0.35 });
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.login(email, password);
      login(res.data.user, res.data.token);
      gsap.to(wrapRef.current, { opacity:0, y:-10, duration:0.3, onComplete:()=>navigate('/') });
    } catch {
      setError('Invalid credentials. Try manager@store.io / retail123');
      gsap.fromTo('.login-card', { x:-8 }, { x:8, yoyo:true, repeat:3, duration:0.07 });
    } finally { setLoading(false); }
  }

  return (
    <div ref={wrapRef} className="min-h-screen flex" style={{ background:'#edf1f5' }}>

      {/* Left panel — navy brand */}
      <div className="hidden lg:flex flex-col items-center justify-center w-2/5 p-12"
           style={{ background:'#0145f2' }}>
        <div className="login-logo opacity-0 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
               style={{ background:'rgba(255,255,255,0.2)' }}>
            <ShoppingCart size={32} color="#fff" />
          </div>
          <div className="font-mono font-bold text-white mb-2" style={{ fontSize:28, letterSpacing:'0.2em' }}>SMART</div>
          <div className="font-mono font-bold text-white mb-6" style={{ fontSize:28, letterSpacing:'0.2em' }}>RETAIL</div>
          <p className="font-mono text-white/60 text-sm leading-relaxed">
            Business Intelligence<br/>& AI Monitoring Platform
          </p>
        </div>

        <div className="mt-16 space-y-4 w-full max-w-xs">
          {[
            { icon:<Activity size={14}/>, label:'Live POS Stream' },
            { icon:<ShoppingCart size={14}/>, label:'Footfall AI' },
            { icon:<Activity size={14}/>, label:'Inventory Intelligence' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl px-4 py-3"
                 style={{ background:'rgba(255,255,255,0.12)' }}>
              <span className="text-white/80">{item.icon}</span>
              <span className="font-mono text-white/80 text-xs">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div ref={cardRef} className="login-card opacity-0 w-full max-w-sm">
          <div className="bg-white rounded-2xl p-8" style={{ boxShadow:'0 4px 24px rgba(1,69,242,0.1), 0 1px 4px rgba(0,0,0,0.06)' }}>
            <div className="mb-8">
              <h1 className="font-mono font-bold text-slate-900 mb-1" style={{ fontSize:20, letterSpacing:'0.05em' }}>Station Login</h1>
              <p className="text-slate-500 text-sm" style={{ fontFamily:'Inter' }}>Access the retail intelligence platform</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="login-field opacity-0">
                <label className="section-label block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                         className="input pl-9" placeholder="manager@store.io" required />
                </div>
              </div>

              <div className="login-field opacity-0">
                <label className="section-label block mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                         className="input pl-9 pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={()=>setShowPw(v=>!v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff size={13}/> : <Eye size={13}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-field rounded-lg px-3 py-2.5 bg-red-50 border border-red-200">
                  <p className="font-mono text-xs text-red-600">{error}</p>
                </div>
              )}

              <div className="login-field opacity-0 pt-1">
                <button type="submit" disabled={loading}
                        className="btn-navy w-full justify-center py-3 text-sm rounded-xl">
                  {loading
                    ? <><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin inline-block"/> Authenticating…</>
                    : 'ACCESS PLATFORM'
                  }
                </button>
              </div>
            </form>

            <div className="divider mt-6" />
            <p className="text-center font-mono text-xs text-slate-400">
              manager@store.io · retail123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
