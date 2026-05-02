// src/pages/TasukeGateway.tsx
import React,{ useEffect,useRef,useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Heart,Activity,ExternalLink,ArrowLeft,CheckCircle,Cpu } from 'lucide-react';
import { settingsApi } from '../lib/api';

const STEPS=['Verifying MedFlow session…','Packaging clinical context…','Establishing Tasuke connection…','Launching AI hub…'];

export default function TasukeGateway(){
  const navigate=useNavigate();
  const ref=useRef<HTMLDivElement>(null);
  const tlRef=useRef<gsap.core.Timeline|null>(null);
  const[step,setStep]=useState(0);
  const[done,setDone]=useState(false);
  const[tasukeUrl,setTasukeUrl]=useState('http://localhost:3000');

  useEffect(()=>{
    settingsApi.tasukeUrl().then(r=>setTasukeUrl(r.data.url??'http://localhost:3000')).catch(()=>{});
    const ctx=gsap.context(()=>{
      gsap.fromTo('.tg-logo',   {scale:.7,opacity:0},{scale:1,opacity:1,duration:.7,ease:'back.out(1.5)'});
      gsap.fromTo('.tg-title',  {y:20,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out',delay:.2});
      gsap.fromTo('.tg-sub',    {y:14,opacity:0},{y:0,opacity:1,duration:.4,ease:'power3.out',delay:.35});
      gsap.fromTo('.tg-card',   {y:16,opacity:0},{y:0,opacity:1,duration:.5,ease:'power3.out',delay:.45});
      gsap.fromTo('.tg-footer', {y:10,opacity:0},{y:0,opacity:1,duration:.4,ease:'power3.out',delay:.6});
      // Progress bar
      gsap.fromTo('.tg-bar',{scaleX:0},{scaleX:1,duration:3.8,ease:'power1.inOut',
        onUpdate(){ const p=Math.floor(this.progress()*4); setStep(Math.min(p,3)); },
        onComplete(){ setDone(true); }
      });
    },ref);
    return()=>ctx.revert();
  },[]);

  useEffect(():void|(() => void) =>{
    if(!done)return;
    const tl=gsap.timeline();
    tlRef.current=tl;
    tl.to(ref.current,{opacity:0,scale:.96,duration:.5,ease:'power2.in',onComplete(){window.location.href=tasukeUrl;}});
    return ()=>tl.kill();
  },[done,tasukeUrl]);

  function cancel(){ tlRef.current?.kill(); gsap.to(ref.current,{opacity:0,y:-12,duration:.3,onComplete:()=>navigate('/')}); }
  function goNow(){ gsap.to(ref.current,{opacity:0,scale:.96,duration:.35,onComplete:()=>{window.location.href=tasukeUrl;}}); }

  return(
    <div ref={ref} className="min-h-screen flex overflow-hidden relative" style={{background:'#07112b'}}>
      {/* Topography bg */}
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:'repeating-linear-gradient(-40deg,transparent,transparent 48px,rgba(113,224,126,0.03) 48px,rgba(113,224,126,0.03) 50px),repeating-linear-gradient(50deg,transparent,transparent 80px,rgba(186,95,255,0.02) 80px,rgba(186,95,255,0.02) 82px)'}}/>

      {/* Left — brand bridge visual */}
      <div className="hidden lg:flex flex-col items-center justify-center w-2/5 relative z-10">
        <div className="tg-logo text-center opacity-0">
          <div className="flex items-center justify-center gap-5 mb-8">
            {/* MedFlow icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)',boxShadow:'0 0 30px rgba(98,0,217,0.5)'}}>
              <Heart size={28} color="#fff"/>
            </div>
            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-px" style={{background:'linear-gradient(to right,#BA5FFF,#71E07E)'}}/>
              <div className="font-mono text-white/30" style={{fontSize:'0.55rem',letterSpacing:'0.1em'}}>HANDOFF</div>
              <div className="w-12 h-px" style={{background:'linear-gradient(to right,#71E07E,#0145f2)'}}/>
            </div>
            {/* Tasuke icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{background:'linear-gradient(135deg,#0145f2,#3369f5)',boxShadow:'0 0 30px rgba(1,69,242,0.5)'}}>
              <Activity size={28} color="#fff"/>
            </div>
          </div>
          <div className="font-sans font-bold text-white mb-1" style={{fontSize:'1.2rem'}}>MedFlow → Tasuke AI</div>
          <div className="font-sans text-white/40 text-sm">Secure platform handoff</div>
        </div>
      </div>

      {/* Right — progress */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">

          {/* Logos */}
          <div className="tg-logo opacity-0 flex items-center justify-center gap-5 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)',boxShadow:'0 0 24px rgba(98,0,217,0.5)'}}><Heart size={24} color="#fff"/></div>
            <div className="flex items-center gap-1"><div className="w-8 h-px" style={{background:'linear-gradient(to right,#BA5FFF,#3369f5)'}}/><div className="w-2 h-2 rounded-full" style={{background:'#0145f2'}}/></div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#0145f2,#3369f5)',boxShadow:'0 0 24px rgba(1,69,242,0.5)'}}><Activity size={24} color="#fff"/></div>
          </div>

          <h2 className="tg-title font-sans font-bold text-white text-center mb-2 opacity-0" style={{fontSize:'1.5rem'}}>Connecting to Tasuke AI</h2>
          <p className="tg-sub font-sans text-white/40 text-center text-sm mb-8 opacity-0">Securely bridging your session to the Tasuke SaaS platform</p>

          <div className="tg-card opacity-0">
            <div className="glass p-6 mb-4">
              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden mb-6" style={{background:'rgba(255,255,255,0.07)'}}>
                <div className="tg-bar h-full rounded-full origin-left" style={{background:'linear-gradient(to right,#6200D9,#71E07E)',transformOrigin:'left'}}/>
              </div>
              {/* Steps */}
              <div className="space-y-3">
                {STEPS.map((s,i)=>(
                  <div key={s} className="flex items-center gap-3">
                    <div className="w-5 h-5 flex-shrink-0">
                      {i<step||done?<CheckCircle size={18} color="#71E07E"/>
                       :i===step?<div className="w-4 h-4 border-2 border-green-DEFAULT border-t-transparent rounded-full animate-spin ml-0.5" style={{borderColor:'#71E07E',borderTopColor:'transparent'}}/>
                       :<div className="w-3 h-3 rounded-full ml-1" style={{border:'2px solid rgba(255,255,255,0.15)'}}/>}
                    </div>
                    <span className="font-sans text-sm" style={{color:i<=step?'rgba(255,255,255,0.8)':'rgba(255,255,255,0.25)'}}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination */}
            <div className="glass p-4 mb-5" style={{borderColor:'rgba(1,69,242,0.2)',background:'rgba(1,69,242,0.05)'}}>
              <div className="section-label mb-1">Destination</div>
              <div className="flex items-center gap-2"><ExternalLink size={12} color="#3369f5"/><span className="font-mono text-blue-400 text-xs">{tasukeUrl}</span></div>
            </div>

            {/* Buttons */}
            <div className="tg-footer opacity-0 flex gap-3">
              <button onClick={cancel} className="btn-ghost flex-1 justify-center"><ArrowLeft size={13}/> Go Back</button>
              <button onClick={goNow}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-sans font-semibold text-white text-sm cursor-pointer transition-all"
                style={{background:'linear-gradient(135deg,#0145f2,#3369f5)',boxShadow:'0 4px 20px rgba(1,69,242,0.4)'}}>
                <ExternalLink size={13}/> Go Now
              </button>
            </div>
            <p className="text-center font-sans text-white/25 text-xs mt-4">Auto-redirecting in {done?'0':STEPS.length-step} step{STEPS.length-step!==1?'s':''}…</p>
          </div>
        </div>
      </div>
    </div>
  );
}
