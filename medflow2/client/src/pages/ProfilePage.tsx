// src/pages/ProfilePage.tsx
import React,{ useEffect,useRef,useState } from 'react';
import gsap from 'gsap';
import { Heart,User,Mail,Phone,Clock,Bell,Save,Shield } from 'lucide-react';
import { authApi } from '../lib/api';
import useStore from '../store/useStore';

export default function ProfilePage(){
  const ref=useRef<HTMLDivElement>(null);
  const{user,alerts,tasks,toast}=useStore();
  const[editing,setEditing]=useState(false);
  const[loading,setLoading]=useState(false);
  const[form,setForm]=useState({ name:user?.name??'', phone:'', shiftStart:'07:00', shiftEnd:'19:00', preferences:{ alerts:user?.preferences?.alerts??true, sound:user?.preferences?.sound??true } });

  useEffect(()=>{
    const ctx=gsap.context(()=>{ gsap.fromTo('.prof-block',{opacity:0,y:14},{opacity:1,y:0,stagger:.08,duration:.5,ease:'power3.out'}); },ref);
    return()=>ctx.revert();
  },[]);

  async function save(){
    setLoading(true);
    try{ await authApi.profile(form); toast('success','Profile updated'); setEditing(false); }
    catch{ toast('error','Update failed'); }
    finally{ setLoading(false); }
  }

  const initials=user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)?? 'U';
  const activeAlerts=alerts.filter(a=>!a.acknowledged&&!a.resolved).length;
  const pendingTasks=tasks.filter(t=>t.status==='pending').length;

  return(
    <div ref={ref} className="p-5 space-y-5 max-w-3xl">
      <div className="prof-block flex items-center justify-between">
        <div><h1 className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>My Profile</h1><p className="font-sans text-white/40 text-sm mt-0.5">Account details and preferences</p></div>
        {!editing
          ?<button onClick={()=>setEditing(true)} className="btn-ghost">Edit Profile</button>
          :<div className="flex gap-2">
            <button onClick={()=>setEditing(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={loading} className="btn-green">
              {loading?<span className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin"/>:<Save size={14}/>} Save
            </button>
          </div>
        }
      </div>

      {/* Avatar + stats */}
      <div className="prof-block glass p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-sans font-bold text-2xl flex-shrink-0"
             style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)',color:'#fff',boxShadow:'0 0 30px rgba(98,0,217,0.45)'}}>
          {initials}
        </div>
        <div className="flex-1">
          <div className="font-sans font-bold text-white mb-0.5" style={{fontSize:'1.25rem'}}>{user?.name}</div>
          <div className="font-sans text-white/45 text-sm">{user?.email}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="badge badge-violet capitalize">{user?.role}</span>
            <span className="badge badge-muted">{user?.ward}</span>
          </div>
        </div>
        <div className="flex gap-4">
          {[{l:'Active Alerts',v:activeAlerts,c:'#EF4444'},{l:'Pending Tasks',v:pendingTasks,c:'#F59E0B'}].map(s=>(
            <div key={s.l} className="text-center px-4 py-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
              <div className="font-mono font-bold" style={{fontSize:'1.5rem',color:s.c,lineHeight:1}}>{s.v}</div>
              <div className="section-label mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Info */}
        <div className="prof-block glass p-5">
          <div className="section-label mb-4">Personal Information</div>
          <div className="space-y-4">
            <div><label className="section-label block mb-1.5">Full Name</label>
              {editing?<input className="mf-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
              :<div className="flex items-center gap-2 font-sans text-white/70 text-sm"><User size={13} color="#71E07E"/>{user?.name}</div>}
            </div>
            <div><label className="section-label block mb-1.5">Email</label>
              <div className="flex items-center gap-2 font-sans text-white/50 text-sm"><Mail size={13} color="rgba(255,255,255,0.25)"/>{user?.email}</div>
            </div>
            <div><label className="section-label block mb-1.5">Phone</label>
              {editing?<input className="mf-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 9999 000000"/>
              :<div className="flex items-center gap-2 font-sans text-white/50 text-sm"><Phone size={13} color="rgba(255,255,255,0.25)"/>{form.phone||'—'}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="section-label block mb-1.5">Shift Start</label>
                {editing?<input type="time" className="mf-input" value={form.shiftStart} onChange={e=>setForm({...form,shiftStart:e.target.value})}/>
                :<div className="flex items-center gap-2 font-sans text-white/50 text-sm"><Clock size={13} color="rgba(255,255,255,0.25)"/>{form.shiftStart}</div>}
              </div>
              <div><label className="section-label block mb-1.5">Shift End</label>
                {editing?<input type="time" className="mf-input" value={form.shiftEnd} onChange={e=>setForm({...form,shiftEnd:e.target.value})}/>
                :<div className="flex items-center gap-2 font-sans text-white/50 text-sm"><Clock size={13} color="rgba(255,255,255,0.25)"/>{form.shiftEnd}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="prof-block glass p-5">
          <div className="section-label mb-4">Preferences</div>
          <div className="space-y-4">
            {[{k:'alerts' as const,l:'Alert Notifications',d:'Receive in-app alerts'},{ k:'sound' as const,l:'Alert Sound',d:'Audio on critical alerts'}].map(p=>(
              <div key={p.k} className="flex items-center justify-between py-2 border-b border-white/5">
                <div><div className="font-sans text-white/70 text-sm font-medium">{p.l}</div><div className="font-sans text-white/30 text-xs">{p.d}</div></div>
                <button onClick={()=>editing&&setForm(f=>({...f,preferences:{...f.preferences,[p.k]:!f.preferences[p.k]}}))}
                  className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                  style={{background:form.preferences[p.k]?'#71E07E':'rgba(255,255,255,0.12)',cursor:editing?'pointer':'default'}}>
                  <div className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200" style={{left:form.preferences[p.k]?'1.375rem':'0.125rem'}}/>
                </button>
              </div>
            ))}
            <div className="pt-2">
              <div className="section-label mb-2">Role Badge</div>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{background:'rgba(98,0,217,0.15)',border:'1px solid rgba(186,95,255,0.25)'}}>
                <Shield size={16} color="#BA5FFF"/>
                <div><div className="font-sans font-bold text-sm capitalize" style={{color:'#BA5FFF'}}>{user?.role}</div><div className="font-sans text-white/35 text-xs">{user?.ward}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
