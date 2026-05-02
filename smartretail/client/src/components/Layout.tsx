// src/components/Layout.tsx
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  LayoutDashboard, Camera, Package, ShoppingCart,
  Users, Map, Bell, LogOut, TrendingUp, AlertTriangle, Activity, ChevronRight
} from 'lucide-react';
import useStore from '@/store/useStore';
import { getSocket } from '@/lib/socket';
import { alertApi, inventoryApi } from '@/lib/api';
import type { CameraFrame, FootfallZone, POSTransaction, Alert } from '@/types';

const NAV = [
  { to:'/',           label:'Dashboard',  icon:<LayoutDashboard size={15}/>, end:true },
  { to:'/cameras',    label:'Cameras',    icon:<Camera size={15}/> },
  { to:'/sales',      label:'Sales',      icon:<ShoppingCart size={15}/> },
  { to:'/inventory',  label:'Inventory',  icon:<Package size={15}/> },
  { to:'/footfall',   label:'Footfall',   icon:<TrendingUp size={15}/> },
  { to:'/staff',      label:'Staff',      icon:<Users size={15}/> },
  { to:'/map',        label:'Store Map',  icon:<Map size={15}/> },
  { to:'/alerts',     label:'Alerts',     icon:<AlertTriangle size={15}/> },
];

function Clock() {
  const [t, setT] = React.useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = (n:number) => String(n).padStart(2,'0');
  return <span className="font-mono text-xs text-slate-400">{p(t.getHours())}:{p(t.getMinutes())}:{p(t.getSeconds())}</span>;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, alerts, setAlerts, addAlert, addTx, setCameraFrame, setFootfall, setInventory } = useStore();
  const navigate = useNavigate();
  const sideRef  = useRef<HTMLElement>(null);
  const unread   = alerts.filter(a => !a.acknowledged && !a.resolved).length;

  useEffect(() => {
    if (!sideRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(sideRef.current!, { x:-20, opacity:0 }, { x:0, opacity:1, duration:0.5, ease:'power3.out' });
      gsap.fromTo('.nav-item', { x:-14, opacity:0 }, { x:0, opacity:1, stagger:0.045, duration:0.4, ease:'power3.out', delay:0.15 });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const sock = getSocket();
    sock.emit('join_dashboard');
    sock.on('camera_frames', (frames: CameraFrame[]) => frames.forEach(f => setCameraFrame(f)));
    sock.on('footfall_update', (zones: FootfallZone[]) => setFootfall(zones));
    sock.on('pos_transaction', (tx: POSTransaction) => addTx(tx));
    sock.on('new_alert', (alert: Alert) => addAlert(alert));

    alertApi.list({ resolved:'false', limit:'60' }).then(r => setAlerts(r.data.data)).catch(() => {});
    inventoryApi.list().then(r => setInventory(r.data.data)).catch(() => {});

    return () => { sock.off('camera_frames'); sock.off('footfall_update'); sock.off('pos_transaction'); sock.off('new_alert'); };
  }, []);

  function handleLogout() {
    gsap.to('#app-root', { opacity:0, duration:0.2, onComplete:() => { logout(); navigate('/login'); } });
  }

  return (
    <div id="app-root" className="flex h-screen overflow-hidden" style={{ background:'#edf1f5' }}>

      {/* SIDEBAR */}
      <aside ref={sideRef} className="w-52 min-w-52 flex flex-col flex-shrink-0 overflow-hidden"
             style={{ background:'#0145f2' }}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-14 flex-shrink-0"
             style={{ borderBottom:'1px solid rgba(255,255,255,0.12)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
               style={{ background:'rgba(255,255,255,0.2)' }}>
            <Activity size={15} color="#fff" />
          </div>
          <div className="leading-none">
            <div className="font-mono font-bold text-white leading-none" style={{ fontSize:13, letterSpacing:'0.18em' }}>SMART</div>
            <div className="font-mono font-bold text-white leading-none" style={{ fontSize:13, letterSpacing:'0.18em' }}>RETAIL</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2.5">
          <div className="font-mono px-3 pb-2" style={{ fontSize:8, letterSpacing:'0.18em', color:'rgba(255,255,255,0.45)', textTransform:'uppercase' }}>
            Navigation
          </div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/12'
              }`}
              style={{ fontFamily:'Inter,system-ui,sans-serif' }}
            >
              {({ isActive }) => (
                <>
                  <span style={{ color: isActive ? '#0145f2' : 'inherit' }}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.to === '/alerts' && unread > 0 && (
                    <span className="font-mono font-bold rounded-full px-1.5 py-0.5"
                          style={{ background:'rgba(220,38,38,0.9)', color:'#fff', fontSize:9, lineHeight:1.4 }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                  {isActive && <ChevronRight size={11} style={{ color:'#0145f2', opacity:0.5 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 px-3 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.12)' }}>
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                 style={{ background:'rgba(255,255,255,0.22)', color:'#fff' }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white font-medium truncate" style={{ fontFamily:'Inter' }}>{user?.name}</div>
              <div className="font-mono text-white/50" style={{ fontSize:8, letterSpacing:'0.1em', textTransform:'uppercase' }}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0 bg-white"
                style={{ borderBottom:'1px solid #e2e8f0' }}>
          <div className="flex items-center gap-2">
            <div className="live-dot w-2 h-2 rounded-full" style={{ background:'#16a34a' }} />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">Live stream</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/alerts')} className="relative text-slate-400 hover:text-slate-700 transition-colors p-1">
              <Bell size={16} />
              {unread > 0 && (
                <motion.span key={unread} initial={{ scale:0 }} animate={{ scale:1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center font-mono text-white"
                  style={{ fontSize:8 }}>
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </button>
            <Clock />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>

      {/* Global Toasts */}
      <ToastStack />
    </div>
  );
}

function ToastStack() {
  const { toasts, removeToast } = useStore();
  const COL: Record<string,string> = { success:'#16a34a', error:'#dc2626', warning:'#d97706', info:'#0145f2' };
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" style={{ maxWidth:320 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity:0, x:16, scale:.96 }} animate={{ opacity:1, x:0, scale:1 }} exit={{ opacity:0, x:16, scale:.96 }}
            className="pointer-events-auto bg-white rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ boxShadow:'0 4px 20px rgba(0,0,0,0.12)', border:'1px solid #e2e8f0' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COL[t.type] ?? '#64748b' }} />
            <p className="text-sm text-slate-700 flex-1" style={{ fontFamily:'Inter' }}>{t.msg}</p>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
