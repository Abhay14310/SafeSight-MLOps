// src/pages/ProfilePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { User, Mail, Phone, MapPin, Bell, Save, Leaf } from 'lucide-react';
import { authApi } from '@/lib/api';
import useStore from '@/store/useStore';

export default function ProfilePage() {
  const ref = useRef<HTMLDivElement>(null);
  const { user, updateUser, addToast, collections, alerts } = useStore();
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [form, setForm] = useState({
    name:  user?.name  ?? '',
    phone: '',
    zone:  user?.zone  ?? '',
    preferences: {
      notifications: user?.preferences?.notifications ?? true,
      emailAlerts:   user?.preferences?.emailAlerts   ?? true,
      theme:         user?.preferences?.theme         ?? 'green',
    },
  });

  useEffect(() => {
    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.profile-block', { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: 'power3.out' });
      }, ref.current);
      return () => ctx.revert();
    }
  }, []);

  async function save() {
    setLoading(true);
    try {
      await authApi.profile(form);
      updateUser({ name:form.name, zone:form.zone, preferences:form.preferences });
      addToast('success','Profile updated');
      setEditing(false);
    } catch { addToast('error','Update failed'); }
    finally { setLoading(false); }
  }

  const todayCollections = collections.length;
  const activeAlerts     = alerts.filter(a=>!a.resolved&&!a.acknowledged).length;
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) ?? 'U';

  return (
    <div ref={ref} className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">My Profile</h1>
          <p className="text-small text-slate-500 mt-0.5">Manage your account details and preferences</p>
        </div>
        {!editing
          ? <button onClick={() => setEditing(true)} className="btn-outline">Edit Profile</button>
          : <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
              <button onClick={save} disabled={loading} className="btn-green">
                {loading ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Save size={14}/>}
                Save
              </button>
            </div>
        }
      </div>

      {/* Profile Header */}
      <div className="card p-6 profile-block">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-bold text-2xl flex-shrink-0"
               style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', boxShadow:'0 4px 16px rgba(34,197,94,0.4)' }}>
            {initials}
          </div>
          <div className="flex-1">
            <div className="font-sans font-bold text-green-900 mb-0.5" style={{ fontSize:'1.25rem' }}>{user?.name}</div>
            <div className="text-body text-slate-500">{user?.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge-green capitalize">{user?.role}</span>
              {user?.zone && <span className="badge-grey">{user.zone}</span>}
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex gap-4">
            {[
              { label:'Live Collections', val:todayCollections, color:'#22c55e' },
              { label:'Active Alerts',    val:activeAlerts,     color:'#f59e0b' },
            ].map(s => (
              <div key={s.label} className="text-center px-4 py-3 rounded-xl" style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)' }}>
                <div className="font-mono font-bold" style={{ fontSize:'1.5rem', color:s.color, lineHeight:1 }}>{s.val}</div>
                <div className="kpi-label mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editable details */}
      <div className="grid grid-cols-2 gap-5">
        <div className="card p-5 profile-block">
          <div className="section-heading mb-4">Personal Information</div>
          <div className="space-y-4">
            <div>
              <label className="section-heading block mb-1.5">Full Name</label>
              {editing
                ? <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
                : <div className="flex items-center gap-2 text-body text-slate-700"><User size={14} color="#22c55e"/>{user?.name}</div>
              }
            </div>
            <div>
              <label className="section-heading block mb-1.5">Email</label>
              <div className="flex items-center gap-2 text-body text-slate-500"><Mail size={14} color="#94a3b8"/>{user?.email}</div>
            </div>
            <div>
              <label className="section-heading block mb-1.5">Phone</label>
              {editing
                ? <input className="input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 9999 999999"/>
                : <div className="flex items-center gap-2 text-body text-slate-500"><Phone size={14} color="#94a3b8"/>{form.phone || '—'}</div>
              }
            </div>
            <div>
              <label className="section-heading block mb-1.5">Assigned Zone</label>
              {editing
                ? <select className="select" value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})}>
                    {['Zone A - North','Zone B - South','Zone C - East','Zone D - West','Zone E - Central'].map(z=><option key={z}>{z}</option>)}
                  </select>
                : <div className="flex items-center gap-2 text-body text-slate-700"><MapPin size={14} color="#22c55e"/>{user?.zone ?? '—'}</div>
              }
            </div>
          </div>
        </div>

        <div className="card p-5 profile-block">
          <div className="section-heading mb-4">Notification Preferences</div>
          <div className="space-y-4">
            {[
              { key:'notifications', label:'Push Notifications', desc:'In-app alerts for collections and events' },
              { key:'emailAlerts',   label:'Email Alerts',       desc:'Critical alerts sent to your email' },
            ].map(pref => (
              <div key={pref.key} className="flex items-start justify-between gap-4 py-2 border-b border-green-50">
                <div>
                  <div className="font-medium text-slate-700 text-body">{pref.label}</div>
                  <div className="text-small text-slate-400">{pref.desc}</div>
                </div>
                <button
                  onClick={() => editing && setForm(f=>({ ...f, preferences:{ ...f.preferences, [pref.key]:!f.preferences[pref.key as keyof typeof f.preferences] } }))}
                  className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${editing?'cursor-pointer':'cursor-default'}`}
                  style={{ background: form.preferences[pref.key as keyof typeof form.preferences] ? '#22c55e' : '#e2e8f0' }}
                >
                  <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                       style={{ left: form.preferences[pref.key as keyof typeof form.preferences] ? '1.375rem' : '0.125rem' }}/>
                </button>
              </div>
            ))}

            <div className="pt-2">
              <div className="section-heading mb-2">Role Badge</div>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)' }}>
                <Leaf size={16} color="#22c55e"/>
                <div>
                  <div className="font-mono font-bold text-green-800 capitalize" style={{ fontSize:'0.875rem' }}>{user?.role}</div>
                  <div className="text-small text-slate-500">EcoTrack Platform</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
