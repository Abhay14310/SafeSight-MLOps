// src/components/Layout.tsx
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  LayoutDashboard, Truck, Trash2, MapPin, Calendar,
  BarChart3, Bell, Settings, User, LogOut, Leaf,
  Navigation, Route, ExternalLink, ChevronRight, Camera
} from 'lucide-react';
import useStore from '@/store/useStore';
import { getSocket } from '@/lib/socket';
import { alertApi, binApi, dashApi } from '@/lib/api';
import type { VehicleFrame, BinUpdate, Alert, LiveCollection } from '@/types';

const NAV = [
  { to:'/',         label:'Dashboard',   icon:<LayoutDashboard size={16}/> },
  { to:'/waste',    label:'Waste Logs',  icon:<Trash2 size={16}/> },
  { to:'/camera',   label:'Waste Camera',icon:<Camera size={16}/> },
  { to:'/fleet',    label:'Fleet',       icon:<Truck size={16}/> },
  { to:'/bins',     label:'Bins',        icon:<MapPin size={16}/> },
  { to:'/routes',   label:'Routes',      icon:<Route size={16}/> },
  { to:'/schedule', label:'Schedule',    icon:<Calendar size={16}/> },
  { to:'/reports',  label:'Reports',     icon:<BarChart3 size={16}/> },
  { to:'/alerts',   label:'Alerts',      icon:<Bell size={16}/> },
];

const BOTTOM_NAV = [
  { to:'/profile',  label:'Profile',     icon:<User size={16}/> },
  { to:'/settings', label:'Settings',    icon:<Settings size={16}/> },
];

function Clock() {
  const [t,setT] = React.useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setT(new Date()),1000); return()=>clearInterval(id); },[]);
  const p=(n:number)=>String(n).padStart(2,'0');
  return <span className="font-mono" style={{fontSize:'0.7rem',color:'#64748b'}}>{p(t.getHours())}:{p(t.getMinutes())}:{p(t.getSeconds())}</span>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user,logout,setAlerts,addAlert,setBins,updateBin,addCollection,setSummary } = useStore();
  const navigate  = useNavigate();
  const sideRef   = useRef<HTMLElement>(null);
  const unread    = useStore(s=>s.alerts.filter(a=>!a.acknowledged&&!a.resolved).length);

  // GSAP entrance
  useEffect(() => {
    if (!sideRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(sideRef.current, { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo('.eco-nav-item', { x: -14, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.045, duration: 0.4, ease: 'power3.out', delay: 0.1 });
    }, sideRef.current);
    return () => { ctx.revert(); };
  }, []);

  // Socket bootstrap
  useEffect(()=>{
    const sock = getSocket();
    sock.emit('join_dashboard');
    sock.on('vehicle_update', (frames:VehicleFrame[])=>{ /* handled per page */ });
    sock.on('bin_update',     (updates:BinUpdate[])=>updates.forEach(u=>updateBin(u)));
    sock.on('new_collection', (c:LiveCollection)=>addCollection(c));
    sock.on('new_alert',      (a:Alert)=>addAlert(a));

    alertApi.list({resolved:'false',limit:'60'}).then(r=>setAlerts(r.data.data)).catch(()=>{});
    binApi.list().then(r=>setBins(r.data.data)).catch(()=>{});
    dashApi.summary().then(r=>setSummary(r.data.data)).catch(()=>{});

    return ()=>{ sock.off('vehicle_update'); sock.off('bin_update'); sock.off('new_collection'); sock.off('new_alert'); };
  },[]);

  function handleLogout() {
    const el = document.getElementById('eco-app');
    if (el) {
      gsap.to(el, { opacity: 0, duration: 0.25, onComplete: () => { logout(); navigate('/login'); } });
    } else {
      logout();
      navigate('/login');
    }
  }

  return (
    <div id="eco-app" className="flex h-screen overflow-hidden" style={{background:'#f0fdf4'}}>

      {/* ══ SIDEBAR ══ */}
      <aside ref={sideRef} className="w-56 min-w-56 flex flex-col flex-shrink-0 overflow-hidden"
             style={{background:'linear-gradient(180deg,#14532d 0%,#166534 60%,#15803d 100%)'}}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
             style={{borderBottom:'1px solid rgba(255,255,255,0.12)'}}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 leaf"
               style={{background:'rgba(255,255,255,0.2)'}}>
            <Leaf size={18} color="#fff" />
          </div>
          <div>
            <div className="font-mono font-bold text-white" style={{fontSize:'0.9rem',letterSpacing:'0.18em',lineHeight:1}}>ECO</div>
            <div className="font-mono font-bold text-white" style={{fontSize:'0.9rem',letterSpacing:'0.18em',lineHeight:1.2}}>TRACK</div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scroll-thin">
          <div className="section-heading px-2 pb-2" style={{color:'rgba(255,255,255,0.45)'}}>Navigation</div>
          {NAV.map(item=>(
            <NavLink key={item.to} to={item.to} end={item.to==='/'}
              className={({isActive})=>`eco-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-body ${
                isActive
                  ? 'nav-active'
                  : 'text-white/70 hover:text-white hover:bg-white/12 font-normal'
              }`}
            >
              {({isActive})=>(
                <>
                  <span style={{color:isActive?'#16a34a':'inherit'}}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.to==='/alerts' && unread>0 && (
                    <span className="font-mono font-bold rounded-full px-1.5 py-0.5"
                          style={{background:'rgba(239,68,68,0.9)',color:'#fff',fontSize:'0.6rem',lineHeight:1.5}}>
                      {unread>9?'9+':unread}
                    </span>
                  )}
                  {isActive && <ChevronRight size={11} style={{color:'#16a34a',opacity:0.5}}/>}
                </>
              )}
            </NavLink>
          ))}

          <div className="eco-divider my-3" />
          <div className="section-heading px-2 pb-2" style={{color:'rgba(255,255,255,0.45)'}}>Account</div>
          {BOTTOM_NAV.map(item=>(
            <NavLink key={item.to} to={item.to}
              className={({isActive})=>`eco-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-body ${
                isActive ? 'nav-active' : 'text-white/70 hover:text-white hover:bg-white/12'
              }`}>
              {({isActive})=>(
                <><span style={{color:isActive?'#16a34a':'inherit'}}>{item.icon}</span><span className="flex-1">{item.label}</span></>
              )}
            </NavLink>
          ))}

          {/* Tasuke redirect button */}
          <div className="eco-divider my-3" />
          <NavLink to="/tasuke"
            className="eco-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-body text-white/70 hover:text-white hover:bg-white/12">
            <ExternalLink size={16} />
            <span className="flex-1">Tasuke AI</span>
            <span className="font-mono px-1.5 py-0.5 rounded"
                  style={{background:'rgba(1,69,242,0.7)',color:'#fff',fontSize:'0.55rem',letterSpacing:'0.08em'}}>HUB</span>
          </NavLink>
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 px-3 py-3" style={{borderTop:'1px solid rgba(255,255,255,0.12)'}}>
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                 style={{background:'rgba(255,255,255,0.22)',color:'#fff'}}>
              {user?.name?.[0]?.toUpperCase()?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate" style={{fontSize:'0.875rem'}}>{user?.name}</div>
              <div className="font-mono text-white/50 uppercase" style={{fontSize:'0.6rem',letterSpacing:'0.1em'}}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors"><LogOut size={14}/></button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0 bg-surface text-surface"
                style={{borderBottom:'1px solid var(--border)'}}>
          <div className="flex items-center gap-2">
            <div className="live-pulse w-2 h-2 rounded-full" style={{background:'#22c55e'}}/>
            <span className="font-mono text-green-700" style={{fontSize:'0.7rem',letterSpacing:'0.12em',textTransform:'uppercase'}}>
              Live stream active
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={()=>navigate('/alerts')} className="relative text-slate-400 hover:text-green-700 transition-colors p-1">
              <Bell size={17}/>
              {unread>0 && (
                <motion.span key={unread} initial={{scale:0}} animate={{scale:1}}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center font-mono text-white"
                  style={{fontSize:'0.55rem'}}>{unread>9?'9+':unread}</motion.span>
              )}
            </button>
            <Clock/>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scroll-thin bg-surface" style={{background:'var(--cloud)'}}>
          {children}
        </main>
      </div>

      {/* Toast stack */}
      <ToastStack/>
    </div>
  );
}

function ToastStack() {
  const {toasts,removeToast} = useStore();
  const C:Record<string,string>={success:'#22c55e',error:'#ef4444',warning:'#f59e0b',info:'#0145f2'};
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" style={{maxWidth:320}}>
      <AnimatePresence>
        {toasts.map(t=>(
          <motion.div key={t.id} initial={{opacity:0,x:16,scale:.95}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:16,scale:.95}}
            className="pointer-events-auto bg-surface rounded-2xl px-4 py-3 flex items-center gap-3 border border-green-500/20 shadow-card"
            style={{boxShadow:'0 4px 20px rgba(22,163,74,0.15)',border:'1px solid var(--border)'}}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:C[t.type]??'#64748b'}}/>
            <p className="text-body text-surface flex-1">{t.msg}</p>
            <button onClick={()=>removeToast(t.id)} className="text-slate-400 hover:text-slate-600 font-mono text-sm">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
