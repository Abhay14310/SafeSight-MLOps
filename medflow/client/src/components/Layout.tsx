// src/components/Layout.tsx
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Activity, Users, Home, Bell, LogOut,
  Menu, ChevronRight, Settings, Wifi
} from 'lucide-react';
import useStore from '@/store/useStore';

interface NavItem { label:string; icon:React.ReactNode; to:string; }

const NAV_ITEMS: NavItem[] = [
  { label:'Nurse Station', icon:<Users size={16}/>,    to:'/'            },
  { label:'Home Monitor',  icon:<Home size={16}/>,     to:'/home-monitor'},
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, unreadCount, clearUnread, sidebarOpen, toggleSidebar } = useStore();
  const navigate    = useNavigate();
  const sidebarRef  = useRef<HTMLDivElement>(null);

  // GSAP sidebar entrance
  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(sidebarRef.current,
      { x: -20, opacity: 0 },
      { x: 0,   opacity: 1, duration: 0.5, ease: 'power3.out' }
    );
  }, []);

  function handleLogout() {
    gsap.to('#app-layout', {
      opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => { logout(); navigate('/login'); }
    });
  }

  return (
    <div id="app-layout" className="flex h-screen bg-black overflow-hidden">

      {/* ── SIDEBAR ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            ref={sidebarRef}
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
            className="flex-shrink-0 flex flex-col border-r overflow-hidden"
            style={{ borderColor:'rgba(255,255,255,0.06)', background:'#080808' }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-4 h-12 border-b flex-shrink-0"
                 style={{ borderColor:'rgba(255,255,255,0.06)' }}>
              <div className="relative flex-shrink-0">
                <Activity size={18} className="text-cyan" />
                <div className="absolute inset-0 animate-ping opacity-30 rounded-full"
                     style={{ background:'rgba(0,212,255,0.4)' }} />
              </div>
              <span className="font-mono font-bold text-sm tracking-[0.18em] text-white">MEDFLOW</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-dark">
              <p className="section-label px-2 pb-2 pt-1">Navigation</p>
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `
                    flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-mono
                    transition-all duration-150 group cursor-pointer
                    ${isActive
                      ? 'bg-cyan/10 text-cyan border border-cyan/20'
                      : 'text-grey-300 hover:text-white hover:bg-white/5 border border-transparent'
                    }
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-cyan' : 'text-grey-400 group-hover:text-grey-200'}>
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight size={11} className="text-cyan/60" />}
                    </>
                  )}
                </NavLink>
              ))}

              <div className="divider-h my-3" />
              <p className="section-label px-2 pb-2">System</p>

              <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-mono w-full text-left text-grey-300 hover:text-white hover:bg-white/5 transition-all">
                <Settings size={14} className="text-grey-400" />
                Settings
              </button>

              <div className="divider-h my-3" />
              <p className="section-label px-2 pb-2">Ecosystem</p>
              <a 
                href="http://localhost:3000" 
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-mono w-full text-left text-grey-300 hover:text-white hover:bg-cyan/5 hover:text-cyan transition-all border border-transparent hover:border-cyan/10"
              >
                <Activity size={14} className="rotate-90 text-grey-400" />
                SafeSight HUB
              </a>
            </nav>

            {/* User info */}
            <div className="flex-shrink-0 border-t p-3" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <div className="w-7 h-7 rounded-full bg-cyan/15 border border-cyan/25 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-xs text-cyan font-bold">
                    {user?.name?.[0] ?? 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-white truncate">{user?.name}</p>
                  <p className="font-mono text-xs text-grey-400 uppercase">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-grey-400 hover:text-red transition-colors">
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
                style={{ borderColor:'rgba(255,255,255,0.06)', background:'rgba(6,6,6,0.95)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="text-grey-400 hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-1.5">
              <div className="status-dot dot-stable w-1.5 h-1.5" />
              <span className="font-mono text-xs text-grey-400">ALL SYSTEMS NOMINAL</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wifi/WS indicator */}
            <div className="flex items-center gap-1.5">
              <Wifi size={12} className="text-green animate-pulse" />
              <span className="font-mono text-xs text-green">LIVE</span>
            </div>

            {/* Alert bell */}
            <button
              onClick={clearUnread}
              className="relative text-grey-400 hover:text-white transition-colors p-1.5 rounded hover:bg-white/5"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <motion.span
                  key={unreadCount}
                  initial={{ scale:0 }}
                  animate={{ scale:1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red rounded-full flex items-center justify-center font-mono text-white"
                  style={{ fontSize:8 }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>

            {/* Clock */}
            <LiveClock />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = React.useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs text-grey-300">
      {time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })}
    </span>
  );
}
