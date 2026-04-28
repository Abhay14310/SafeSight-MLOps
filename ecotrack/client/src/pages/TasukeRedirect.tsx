// src/pages/TasukeRedirect.tsx
// Animated transition page that redirects to Tasuke AI platform
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ExternalLink, ArrowLeft, Activity, Leaf, CheckCircle } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import HeroScene from '@/components/HeroScene';

const STEPS = [
  'Verifying EcoTrack session…',
  'Packaging platform context…',
  'Establishing Tasuke connection…',
  'Redirecting to Tasuke AI hub…',
];

export default function TasukeRedirect() {
  const navigate    = useNavigate();
  const ref         = useRef<HTMLDivElement>(null);
  const [step,      setStep]      = useState(0);
  const [done,      setDone]      = useState(false);
  const [tasukeUrl, setTasukeUrl] = useState('http://localhost:3000');

  useEffect(() => {
    settingsApi.tasukeUrl()
      .then(r => setTasukeUrl(r.data.url ?? 'http://localhost:3000'))
      .catch(() => {});

    // Entrance animation
    let ctx: gsap.Context | null = null;
    if (ref.current) {
      ctx = gsap.context(() => {
        gsap.fromTo('.redir-ent', { opacity: 0, y: 16 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power3.out' });
        // Progress bar CSS animation sync
        gsap.to('.redir-bar', { scaleX: 1, duration: 4, ease: 'power1.inOut' });
      }, ref.current);
    }

    // Step through progress automatically
    let s = 0;
    const iv = setInterval(() => {
      s++;
      setStep(Math.min(s, 3));
      if (s >= 3) {
        clearInterval(iv);
        setTimeout(() => setDone(true), 900);
      }
    }, 900);

    return () => {
      ctx?.revert();
      clearInterval(iv);
    };
  }, []);

  // Auto-redirect after progress completes
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => { window.location.href = tasukeUrl; }, 500);
    return () => clearTimeout(timer);
  }, [done, tasukeUrl]);

  function cancelRedirect() { navigate('/'); }

  function goNow() { window.location.href = tasukeUrl; }

  return (
    <div ref={ref} className="min-h-screen flex overflow-hidden" style={{ background:'#052e16' }}>

      {/* Left — 3D globe (green, smaller) */}
      <div className="hidden lg:flex items-center justify-center w-2/5 relative overflow-hidden">
        <HeroScene height={600} />
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center p-6"
             style={{ background:'rgba(5,46,22,0.3)' }}>
          <div className="text-center">
            <div className="font-mono font-bold text-green-300 mb-1" style={{ fontSize:'0.7rem', letterSpacing:'0.2em' }}>FROM</div>
            <div className="flex items-center gap-2 justify-center mb-6">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center leaf"
                   style={{ background:'rgba(255,255,255,0.15)' }}>
                <Leaf size={18} color="#fff"/>
              </div>
              <span className="font-mono font-bold text-white" style={{ fontSize:'1.1rem', letterSpacing:'0.2em' }}>ECOTRACK</span>
            </div>
            <div className="w-px h-16 mx-auto" style={{ background:'linear-gradient(to bottom,rgba(34,197,94,0.8),rgba(1,69,242,0.8))' }}/>
            <div className="font-mono font-bold text-blue-300 mt-1 mb-2" style={{ fontSize:'0.7rem', letterSpacing:'0.2em' }}>TO</div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background:'rgba(1,69,242,0.4)' }}>
                <Activity size={18} color="#fff"/>
              </div>
              <span className="font-mono font-bold text-white" style={{ fontSize:'1.1rem', letterSpacing:'0.2em' }}>TASUKE AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — progress panel */}
      <div className="flex-1 flex items-center justify-center p-8"
           style={{ background:'linear-gradient(135deg,#f0fdf4 0%,#e8faf0 100%)' }}>
        <div className="w-full max-w-md">

          {/* Logos */}
          <div className="redir-ent text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* EcoTrack icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow:'0 4px 16px rgba(34,197,94,0.4)' }}>
                <Leaf size={26} color="#fff"/>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-1">
                <div className="w-8 h-px" style={{ background:'linear-gradient(to right,#22c55e,#0145f2)' }}/>
                <div className="w-2 h-2 rounded-full" style={{ background:'#0145f2' }}/>
              </div>

              {/* Tasuke icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                   style={{ background:'linear-gradient(135deg,#0145f2,#3369f5)', boxShadow:'0 4px 16px rgba(1,69,242,0.4)' }}>
                <Activity size={26} color="#fff"/>
              </div>
            </div>
          </div>

          <div className="redir-ent font-sans font-bold text-green-900 text-center mb-2" style={{ fontSize:'1.5rem' }}>
            Connecting to Tasuke AI
          </div>
          <p className="redir-ent text-center text-body text-slate-500 mb-8">
            Securely transferring your session to the Tasuke platform hub
          </p>

          {/* Progress bar */}
          <div className="redir-ent card p-5 mb-5">
            <div className="h-2 rounded-full overflow-hidden mb-5"
                 style={{ background:'rgba(34,197,94,0.15)' }}>
              <div className="redir-bar h-full rounded-full origin-left"
                   style={{ background:'linear-gradient(to right,#22c55e,#0145f2)', transformOrigin:'left' }}/>
            </div>

            {/* Steps */}
            <div className="redir-steps space-y-3">
              {STEPS.map((s,i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-5 h-5 flex-shrink-0">
                    {i < step || done ? (
                      <CheckCircle size={18} color="#22c55e"/>
                    ) : i === step ? (
                      <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin ml-0.5"/>
                    ) : (
                      <div className="w-3 h-3 rounded-full border-2 border-slate-200 ml-1"/>
                    )}
                  </div>
                  <span className="text-body" style={{ color: i<=step?'#166534':'#94a3b8' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div className="card p-4 mb-6" style={{ background:'rgba(1,69,242,0.04)', borderColor:'rgba(1,69,242,0.2)' }}>
            <div className="section-heading mb-1">Destination</div>
            <div className="flex items-center gap-2">
              <ExternalLink size={13} color="#0145f2"/>
              <span className="font-mono text-blue-700" style={{ fontSize:'0.8rem' }}>{tasukeUrl}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="redir-footer flex gap-3">
            <button onClick={cancelRedirect} className="btn-ghost flex-1 justify-center">
              <ArrowLeft size={14}/> Go Back
            </button>
            <button onClick={goNow} className="tasuke-btn flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-white font-mono font-bold rounded-2xl cursor-pointer"
                    style={{ fontSize:'0.8rem', letterSpacing:'0.08em' }}>
              <ExternalLink size={14}/> Go to Tasuke Now
            </button>
          </div>

          <p className="text-center text-small text-slate-400 mt-4">
            Auto-redirecting in {done?'0':STEPS.length-step} step{STEPS.length-step!==1?'s':''}…
          </p>
        </div>
      </div>
    </div>
  );
}
