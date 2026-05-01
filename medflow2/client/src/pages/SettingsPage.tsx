// src/pages/SettingsPage.tsx
import React,{ useEffect,useRef,useState } from 'react';
import gsap from 'gsap';
import { Settings,Save,RefreshCw,ExternalLink,Bell,Sliders,Globe,Heart } from 'lucide-react';
import { settingsApi } from '../lib/api';
import useStore from '../store/useStore';

interface MFSettings { orgName:string;ward:string;alertSound:boolean;tasukeUrl:string; thresholds:{hr_low:number;hr_high:number;spo2_warn:number;resp_high:number}; }

export default function SettingsPage(){
  const ref=useRef<HTMLDivElement>(null);
  const{toast}=useStore();
  const[cfg,setCfg]=useState<MFSettings|null>(null);
  const[saving,setSaving]=useState(false);
  const[loading,setLoading]=useState(false);

  async function load(){ setLoading(true);try{const r=await settingsApi.get();setCfg(r.data.data);}catch{}finally{setLoading(false);} }
  async function save(){ if(!cfg)return; setSaving(true);try{await settingsApi.update(cfg as unknown as Record<string,unknown>);toast('success','Settings saved');}catch{toast('error','Failed');}finally{setSaving(false);} }

  useEffect(()=>{ load(); const ctx=gsap.context(()=>{ gsap.fromTo('.st-block',{opacity:0,y:14},{opacity:1,y:0,stagger:.08,duration:.5,ease:'power3.out'}); },ref); return()=>ctx.revert(); },[]);

  const upd=(path:string[],val:unknown)=>setCfg(prev=>{
    if(!prev)return prev;
    const next={...prev};
    let cur=next as Record<string,unknown>;
    for(let i=0;i<path.length-1;i++)cur=cur[path[i]] as Record<string,unknown>;
    cur[path[path.length-1]]=val;
    return next;
  });

  if(!cfg&&loading)return<div className="flex items-center justify-center h-64 font-sans text-white/30">Loading settings…</div>;
  if(!cfg)return null;

  return(
    <div ref={ref} className="p-5 space-y-5 max-w-3xl">
      <div className="st-block flex items-center justify-between">
        <div><h1 className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>Settings</h1><p className="font-sans text-white/40 text-sm mt-0.5">Platform configuration</p></div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
          <button onClick={save} disabled={saving} className="btn-green">
            {saving?<span className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin"/>:<Save size={14}/>} Save
          </button>
        </div>
      </div>

      {/* Organisation */}
      <div className="st-block glass p-5">
        <div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(113,224,126,0.12)'}}><Globe size={15} color="#71E07E"/></div><div><div className="font-sans font-semibold text-white text-base">Organisation</div><div className="font-sans text-white/35 text-xs">Hospital and ward settings</div></div></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="section-label block mb-1.5">Organisation Name</label><input className="mf-input" value={cfg.orgName} onChange={e=>upd(['orgName'],e.target.value)}/></div>
          <div><label className="section-label block mb-1.5">Ward / Unit</label><input className="mf-input" value={cfg.ward} onChange={e=>upd(['ward'],e.target.value)}/></div>
        </div>
      </div>

      {/* Alert thresholds */}
      <div className="st-block glass p-5">
        <div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(239,68,68,0.12)'}}><Sliders size={15} color="#EF4444"/></div><div><div className="font-sans font-semibold text-white text-base">Alert Thresholds</div><div className="font-sans text-white/35 text-xs">When to trigger clinical alerts</div></div></div>
        <div className="grid grid-cols-2 gap-4">
          {[
            {l:'HR Low (bpm)',    p:['thresholds','hr_low'],  v:cfg.thresholds.hr_low},
            {l:'HR High (bpm)',   p:['thresholds','hr_high'], v:cfg.thresholds.hr_high},
            {l:'SpO₂ Warn (%)',   p:['thresholds','spo2_warn'],v:cfg.thresholds.spo2_warn},
            {l:'Resp High (/min)',p:['thresholds','resp_high'],v:cfg.thresholds.resp_high},
          ].map(f=>(
            <div key={f.l}><label className="section-label block mb-1.5">{f.l}</label>
              <input type="number" className="mf-input" value={f.v} onChange={e=>upd(f.p,Number(e.target.value))}/>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="st-block glass p-5">
        <div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(245,158,11,0.12)'}}><Bell size={15} color="#F59E0B"/></div><div><div className="font-sans font-semibold text-white text-base">Notifications</div><div className="font-sans text-white/35 text-xs">Alert delivery settings</div></div></div>
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div><div className="font-sans text-white/70 text-sm font-medium">Alert Sound</div><div className="font-sans text-white/30 text-xs">Play audio on critical alerts</div></div>
          <button onClick={()=>upd(['alertSound'],!cfg.alertSound)} className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer"
            style={{background:cfg.alertSound?'#71E07E':'rgba(255,255,255,0.12)'}}>
            <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200" style={{left:cfg.alertSound?'1.375rem':'0.125rem'}}/>
          </button>
        </div>
      </div>

      {/* Tasuke integration */}
      <div className="st-block glass p-5" style={{borderColor:'rgba(98,0,217,0.3)'}}>
        <div className="flex items-center gap-2.5 mb-4"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(98,0,217,0.15)'}}><ExternalLink size={15} color="#BA5FFF"/></div><div><div className="font-sans font-semibold text-white text-base">Tasuke AI Integration</div><div className="font-sans text-white/35 text-xs">Connect to Tasuke SaaS hub</div></div></div>
        <div className="mb-4"><label className="section-label block mb-1.5">Tasuke Platform URL</label>
          <input className="mf-input" value={cfg.tasukeUrl} onChange={e=>upd(['tasukeUrl'],e.target.value)} placeholder="http://localhost:3000"/>
          <p className="font-sans text-white/25 text-xs mt-1.5">Used when redirecting from MedFlow to the Tasuke hub.</p>
        </div>
        <a href={cfg.tasukeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
          <ExternalLink size={13}/> Open Tasuke Hub
        </a>
      </div>
    </div>
  );
}
