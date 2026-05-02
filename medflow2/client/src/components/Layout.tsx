// src/components/Layout.tsx
import React,{ useEffect,useRef } from 'react';
import { NavLink,useNavigate } from 'react-router-dom';
import { motion,AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { LayoutDashboard,Activity,Scan,Users,Container,Bell,Settings,User,LogOut,Heart,ExternalLink,ChevronRight,Wifi } from 'lucide-react';
import useStore from '../store/useStore';
import { getSocket } from '../lib/socket';
import { alertApi,patientApi,taskApi } from '../lib/api';
import type { VitalSnapshot,ECGPoint,PoseFrame,Alert,Patient } from '../types';

const NAV=[
  { to:'/',       label:'Dashboard',       icon:<LayoutDashboard size={16}/> },
  { to:'/monitor',label:'Patient Monitor', icon:<Activity size={16}/> },
  { to:'/pose',   label:'AI Pose Analysis',icon:<Scan size={16}/> },
  { to:'/nurse',  label:'Nurse Station',   icon:<Users size={16}/> },
  { to:'/docker', label:'Docker Deploy',   icon:<Container size={16}/> },
  { to:'/alerts', label:'Alerts',          icon:<Bell size={16}/> },
];

function Clock(){
  const [t,setT]=React.useState(new Date());
  useEffect(()=>{ const id=setInterval(()=>setT(new Date()),1000); return()=>clearInterval(id); },[]);
  const p=(n:number)=>String(n).padStart(2,'0');
  return <span className="font-mono text-xs" style={{color:'rgba(113,224,126,0.6)'}}>{p(t.getHours())}:{p(t.getMinutes())}:{p(t.getSeconds())}</span>;
}

export default function Layout({children}:{children:React.ReactNode}){
  const {user,logout,setAlerts,addAlert,setVital,pushECG,pushResp,setPose,addPoseHistory,setPatients,setTasks}=useStore();
  const navigate=useNavigate();
  const sideRef=useRef<HTMLElement>(null);
  const unread=useStore(s=>s.alerts.filter(a=>!a.acknowledged&&!a.resolved).length);

  useEffect(()=>{
    let ctx: gsap.Context;
    if(sideRef.current) {
      ctx=gsap.context(()=>{
        gsap.fromTo(sideRef.current,{x:-20,opacity:0},{x:0,opacity:1,duration:0.5,ease:'power3.out'});
        gsap.fromTo('.mf-nav-item',{x:-14,opacity:0},{x:0,opacity:1,stagger:.04,duration:.4,ease:'power3.out',delay:.12});
      }, sideRef);
    }
    return () => { if (ctx) ctx.revert(); };
  },[]);

  useEffect(()=>{
    const sock=getSocket();
    sock.emit('join_ward');
    sock.on('vitals_summary',(data:VitalSnapshot[])=>data.forEach(v=>setVital(v)));
    sock.on('vitals_detail',(v:VitalSnapshot)=>setVital(v));
    sock.on('ecg_point',(p:ECGPoint)=>{ pushECG(p); pushResp(p); });
    sock.on('pose_frame',(f:PoseFrame)=>{ setPose(f); addPoseHistory(f); });
    sock.on('new_alert',(a:Alert)=>addAlert(a));

    patientApi.list().then(r=>setPatients(r.data.data)).catch(()=>{});
    alertApi.list({resolved:'false',limit:'80'}).then(r=>setAlerts(r.data.data)).catch(()=>{});
    taskApi.list().then(r=>setTasks(r.data.data)).catch(()=>{});

    return()=>{ sock.off('vitals_summary');sock.off('vitals_detail');sock.off('ecg_point');sock.off('pose_frame');sock.off('new_alert'); };
  },[]);

  function handleLogout(){ gsap.to('#mf-app',{opacity:0,duration:.25,onComplete:()=>{logout();navigate('/login');}}); }

  return (
    <div id="mf-app" className="flex h-screen overflow-hidden" style={{background:'transparent',position:'relative',zIndex:1}}>

      {/* SIDEBAR */}
      <aside ref={sideRef} className="w-56 min-w-56 flex flex-col flex-shrink-0 overflow-hidden z-20" style={{background:'rgba(5,12,28,0.92)',backdropFilter:'blur(24px)',borderRight:'1px solid rgba(113,224,126,0.12)'}}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)'}}>
            <Heart size={16} color="#fff"/>
          </div>
          <div>
            <div className="font-sans font-bold text-white leading-none" style={{fontSize:'1rem',letterSpacing:'0.04em'}}>MedFlow</div>
            <div className="font-sans text-green-400 leading-none mt-0.5" style={{fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'#71E07E'}}>2.0 · ICU Intelligence</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scroll-thin">
          <div className="section-label px-2 pb-2 mb-1">Navigation</div>
          {NAV.map(item=>(
            <NavLink key={item.to} to={item.to} end={item.to==='/'}
              className={({isActive})=>`mf-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-sm font-sans font-medium ${
                isActive?'text-navy bg-green-DEFAULT shadow-glow-green':'text-white/60 hover:text-white hover:bg-white/6'}`}
              style={({isActive})=>({
                color: isActive?'#0A1C40':undefined,
                background: isActive?'#71E07E':undefined,
                boxShadow: isActive?'0 0 16px rgba(113,224,126,0.4)':undefined,
              })}
            >
              {({isActive})=>(
                <>
                  <span style={{color:isActive?'#0A1C40':'inherit'}}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.to==='/alerts'&&unread>0&&(
                    <span className="font-sans font-bold rounded-full px-1.5 py-0.5" style={{background:'rgba(239,68,68,0.9)',color:'#fff',fontSize:'0.6rem',lineHeight:1.4}}>
                      {unread>9?'9+':unread}
                    </span>
                  )}
                  {isActive&&<ChevronRight size={12} style={{color:'#0A1C40',opacity:.5}}/>}
                </>
              )}
            </NavLink>
          ))}

          <div className="topo-divider my-3"/>
          <div className="section-label px-2 pb-2">Account</div>
          {[{to:'/profile',label:'Profile',icon:<User size={16}/>},{to:'/settings',label:'Settings',icon:<Settings size={16}/>}].map(item=>(
            <NavLink key={item.to} to={item.to}
              className={({isActive})=>`mf-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-sm font-sans ${isActive?'text-navy':'text-white/60 hover:text-white hover:bg-white/6'}`}
              style={({isActive})=>({color:isActive?'#0A1C40':undefined,background:isActive?'#71E07E':undefined})}>
              {({isActive})=><><span style={{color:isActive?'#0A1C40':'inherit'}}>{item.icon}</span><span>{item.label}</span></>}
            </NavLink>
          ))}

          <div className="topo-divider my-3"/>
          <NavLink to="/tasuke"
            className="mf-nav-item flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150 text-sm font-sans text-white/60 hover:text-white hover:bg-white/6">
            <ExternalLink size={16}/>
            <span className="flex-1">Tasuke AI Hub</span>
            <span className="font-sans font-bold px-1.5 py-0.5 rounded" style={{background:'rgba(98,0,217,0.6)',color:'#BA5FFF',fontSize:'0.55rem',letterSpacing:'0.08em'}}>HUB</span>
          </NavLink>
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 px-3 py-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold flex-shrink-0"
                 style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)',color:'#fff'}}>
              {user?.name?.[0]?.toUpperCase()?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm text-white font-medium truncate">{user?.name}</div>
              <div className="font-sans text-white/40 uppercase" style={{fontSize:'0.6rem',letterSpacing:'0.1em'}}>{user?.role} · {user?.ward}</div>
            </div>
            <button onClick={handleLogout} className="text-white/35 hover:text-white transition-colors"><LogOut size={13}/></button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 z-10">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0" style={{background:'rgba(5,12,28,0.7)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-3">
            <div className="live-pulse w-2 h-2 rounded-full" style={{background:'#71E07E'}}/>
            <span className="font-sans text-xs font-semibold" style={{color:'rgba(113,224,126,0.7)',letterSpacing:'0.12em',textTransform:'uppercase'}}>
              Ward live · {useStore(s=>s.patients.length)} patients
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Wifi size={12} style={{color:'rgba(113,224,126,0.6)'}}/>
              <span className="font-mono text-xs" style={{color:'rgba(113,224,126,0.5)'}}>WS</span>
            </div>
            <button onClick={()=>navigate('/alerts')} className="relative text-white/40 hover:text-white transition-colors p-1">
              <Bell size={16}/>
              {unread>0&&(
                <motion.span key={unread} initial={{scale:0}} animate={{scale:1}}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-sans text-white"
                  style={{background:'#EF4444',fontSize:'0.55rem'}}>{unread>9?'9+':unread}</motion.span>
              )}
            </button>
            <Clock/>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-thin">{children}</main>
      </div>

      <ToastStack/>
    </div>
  );
}

function ToastStack(){
  const{toasts,removeToast}=useStore();
  const C:Record<string,string>={success:'#71E07E',error:'#EF4444',warning:'#F59E0B',info:'#BA5FFF'};
  return(
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" style={{maxWidth:320}}>
      <AnimatePresence>
        {toasts.map(t=>(
          <motion.div key={t.id} initial={{opacity:0,x:16,scale:.96}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:16,scale:.96}}
            className="pointer-events-auto glass px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:C[t.type]??'#71E07E'}}/>
            <p className="font-sans text-sm text-white flex-1">{t.msg}</p>
            <button onClick={()=>removeToast(t.id)} className="text-white/40 hover:text-white font-sans text-sm">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
