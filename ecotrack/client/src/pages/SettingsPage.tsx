// src/pages/SettingsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Settings, Save, RefreshCw, ExternalLink, Bell, Sliders, Globe, Sun, Moon } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import useStore from '@/store/useStore';

interface EcoSettings {
  orgName: string; orgEmail: string; timezone: string;
  weightUnit: string; currency: string;
  alertThresholds: { binFull:number; vehicleLoad:number; missedPickupHrs:number };
  notifications:   { email:boolean; sms:boolean; push:boolean };
  integrations:    { tasukeUrl:string };
}

export default function SettingsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { addToast } = useStore();
  const [settings, setSettings] = useState<EcoSettings|null>(null);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('ecotrack-dark') === 'true' ||
           document.documentElement.classList.contains('dark');
  });

  // Apply / remove dark class on html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ecotrack-dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ecotrack-dark', 'false');
    }
  }, [darkMode]);

  async function load() {
    setLoading(true);
    try { const r = await settingsApi.get(); setSettings(r.data.data); } catch {}
    finally { setLoading(false); }
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    try { await settingsApi.update(settings as any); addToast('success','Settings saved'); } catch { addToast('error','Failed to save'); }
    finally { setSaving(false); }
  }

  useEffect(() => {
    load();
    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.settings-block', { opacity: 0, x: -12 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.45, ease: 'power3.out' });
      }, ref.current);
      return () => ctx.revert();
    }
  }, []);

  const update = (path: string[], val: unknown) => {
    setSettings(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      let cur: Record<string,unknown> = next as unknown as Record<string,unknown>;
      for (let i=0; i<path.length-1; i++) { cur = cur[path[i]] as Record<string,unknown>; }
      cur[path[path.length-1]] = val;
      return next;
    });
  };

  if (!settings && loading) return (
    <div className="flex items-center justify-center h-64 text-small text-slate-400">Loading settings…</div>
  );
  if (!settings) return null;

  const SECTIONS = [
    {
      key:'org', icon:<Globe size={16}/>, title:'Organisation', desc:'Basic company information',
      fields: [
        { label:'Organisation Name', path:['orgName'],   value:settings.orgName,   type:'text' },
        { label:'Operations Email',  path:['orgEmail'],  value:settings.orgEmail,  type:'email' },
        { label:'Timezone',          path:['timezone'],  value:settings.timezone,  type:'text' },
        { label:'Weight Unit',       path:['weightUnit'],value:settings.weightUnit,type:'text' },
      ],
    },
    {
      key:'thresh', icon:<Sliders size={16}/>, title:'Alert Thresholds', desc:'When to trigger automatic alerts',
      fields: [
        { label:'Bin Full Threshold (%)',         path:['alertThresholds','binFull'],         value:settings.alertThresholds.binFull,         type:'number' },
        { label:'Vehicle Load Threshold (%)',     path:['alertThresholds','vehicleLoad'],     value:settings.alertThresholds.vehicleLoad,     type:'number' },
        { label:'Missed Pickup Alert (hours)',    path:['alertThresholds','missedPickupHrs'], value:settings.alertThresholds.missedPickupHrs, type:'number' },
      ],
    },
    {
      key:'notif', icon:<Bell size={16}/>, title:'Notifications', desc:'Alert delivery channels',
      toggles: [
        { label:'Email Alerts',  path:['notifications','email'], value:settings.notifications.email },
        { label:'SMS Alerts',    path:['notifications','sms'],   value:settings.notifications.sms   },
        { label:'Push Alerts',   path:['notifications','push'],  value:settings.notifications.push  },
      ],
    },
  ];

  return (
    <div ref={ref} className="p-6 space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Settings</h1>
          <p className="text-small text-slate-500 mt-0.5">Platform configuration and integrations</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
          <button onClick={save} disabled={saving} className="btn-green">
            {saving?<span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<Save size={14}/>}
            Save Changes
          </button>
        </div>
      </div>

      {/* Settings sections */}
      {SECTIONS.map(sec => (
        <div key={sec.key} className="card p-5 settings-block">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(34,197,94,0.12)' }}>
              <span className="text-green-700">{sec.icon}</span>
            </div>
            <div>
              <div className="font-sans font-semibold text-green-900 text-title">{sec.title}</div>
              <div className="text-small text-slate-400">{sec.desc}</div>
            </div>
          </div>

          {sec.fields && (
            <div className="grid grid-cols-2 gap-4">
              {sec.fields.map(f => (
                <div key={f.label}>
                  <label className="section-heading block mb-1.5">{f.label}</label>
                  <input type={f.type} className="input"
                         value={String(f.value)}
                         onChange={e => update(f.path, f.type==='number'?Number(e.target.value):e.target.value)}/>
                </div>
              ))}
            </div>
          )}

          {sec.toggles && (
            <div className="space-y-3">
              {sec.toggles.map(t => (
                <div key={t.label} className="flex items-center justify-between py-2 border-b border-green-50">
                  <span className="text-body font-medium text-slate-700">{t.label}</span>
                  <button onClick={() => update(t.path, !t.value)}
                          className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer"
                          style={{ background: t.value ? '#22c55e' : '#e2e8f0' }}>
                    <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                         style={{ left: t.value ? '1.375rem' : '0.125rem' }}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Dark mode toggle card */}
      <div className="card p-5 settings-block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: darkMode ? 'rgba(15,23,42,0.15)' : 'rgba(251,191,36,0.12)' }}>
              {darkMode ? <Moon size={16} color="#818cf8"/> : <Sun size={16} color="#f59e0b"/>}
            </div>
            <div>
              <div className="font-sans font-semibold text-green-900 text-title">Dark Mode</div>
              <div className="text-small text-slate-400">{darkMode ? 'Dark theme active' : 'Light theme active'}</div>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(d => !d)}
            className="relative w-11 h-6 rounded-full transition-all duration-200 cursor-pointer"
            style={{ background: darkMode ? '#6366f1' : '#e2e8f0' }}>
            <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                 style={{ left: darkMode ? '1.375rem' : '0.125rem' }}/>
          </button>
        </div>
      </div>

      {/* Tasuke integration */}
      <div className="card p-5 settings-block" style={{ background:'linear-gradient(135deg,rgba(1,69,242,0.04) 0%,rgba(1,69,242,0.02) 100%)', borderColor:'rgba(1,69,242,0.2)' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(1,69,242,0.1)' }}>
            <ExternalLink size={16} color="#0145f2"/>
          </div>
          <div>
            <div className="font-sans font-semibold text-slate-900 text-title">Tasuke AI Integration</div>
            <div className="text-small text-slate-400">Connect to the Tasuke SaaS platform hub</div>
          </div>
        </div>
        <div className="mb-4">
          <label className="section-heading block mb-1.5">Tasuke Platform URL</label>
          <input className="input" value={settings.integrations.tasukeUrl}
                 onChange={e => update(['integrations','tasukeUrl'],e.target.value)}
                 placeholder="http://localhost:3000"/>
          <p className="text-small text-slate-400 mt-1.5">This URL is used when redirecting to the Tasuke hub from EcoTrack.</p>
        </div>
        <a href={settings.integrations.tasukeUrl} target="_blank" rel="noopener noreferrer"
           className="btn-outline inline-flex items-center gap-2">
          <ExternalLink size={14}/> Open Tasuke Hub
        </a>
      </div>
    </div>
  );
}
