// src/pages/AlertsPage.tsx
import React,{ useEffect,useRef,useState } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Bell,CheckCheck,RefreshCw,AlertTriangle,AlertOctagon,Info } from 'lucide-react';
import { alertApi } from '../lib/api';
import useStore from '../store/useStore';
import type { AlertSeverity } from '../types';

const SEV:Record<AlertSeverity,{bg:string;border:string;color:string;icon:React.ReactNode}> = {
  critical:{ bg:'rgba(239,68,68,0.07)',  border:'#EF4444', color:'#EF4444', icon:<AlertOctagon size={14}/> },
  warning: { bg:'rgba(245,158,11,0.06)', border:'#F59E0B', color:'#F59E0B', icon:<AlertTriangle size={14}/> },
  info:    { bg:'rgba(113,224,126,0.05)',border:'#71E07E', color:'#71E07E', icon:<Info size={14}/> },
};
const TYPE_LABELS:Record<string,string>={ BRADYCARDIA:'Bradycardia',TACHYCARDIA:'Tachycardia',SPO2_LOW:'SpO₂ Low',RESP_ABNORMAL:'Resp Abnormal',FALL_RISK:'Fall Risk',POSE_ALERT:'Pose Alert',TEMP_HIGH:'Temp High',BP_CRITICAL:'BP Critical',SYSTEM:'System' };
function timeSince(d:string){ const s=Math.floor((Date.now()-new Date(d).getTime())/1000); if(s<60)return`${s}s ago`;if(s<3600)return`${Math.floor(s/60)}m ago`;return`${Math.floor(s/3600)}h ago`; }

export default function AlertsPage(){
  const ref=useRef<HTMLDivElement>(null);
  const{alerts,setAlerts,ackAlert}=useStore();
  const[filter,setFilter]=useState<'all'|AlertSeverity|'unacked'>('all');
  const[loading,setLoading]=useState(false);

  async function load(){ setLoading(true);try{const r=await alertApi.list({limit:'100'});setAlerts(r.data.data);}catch{}finally{setLoading(false);} }
  async function handleAck(id:string){ try{await alertApi.ack(id);ackAlert(id);}catch{} }
  async function handleResolve(id:string){ try{await alertApi.resolve(id);setAlerts(alerts.map(a=>a._id===id?{...a,resolved:true}:a));}catch{} }

  useEffect(()=>{ load(); const ctx=gsap.context(()=>{ gsap.fromTo('.al-header',{opacity:0,y:-10},{opacity:1,y:0,duration:.4,ease:'power3.out'}); },ref); return()=>ctx.revert(); },[]);

  const filtered=alerts.filter(a=>{ if(filter==='unacked')return!a.acknowledged&&!a.resolved; if(filter!=='all')return a.severity===filter&&!a.resolved; return!a.resolved; });
  const counts={ critical:alerts.filter(a=>a.severity==='critical'&&!a.resolved).length, warning:alerts.filter(a=>a.severity==='warning'&&!a.resolved).length, info:alerts.filter(a=>a.severity==='info'&&!a.resolved).length, unacked:alerts.filter(a=>!a.acknowledged&&!a.resolved).length };

  return(
    <div ref={ref} className="p-5 space-y-5">
      <div className="al-header flex items-center justify-between">
        <div><h1 className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>Alert Centre</h1><p className="font-sans text-white/40 text-sm mt-0.5">Clinical & system alerts · ICU-4A</p></div>
        <button onClick={load} className="btn-ghost"><RefreshCw size={13} className={loading?'animate-spin':''}/> Refresh</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[{l:'Critical',v:counts.critical,c:'#EF4444'},{l:'Warning',v:counts.warning,c:'#F59E0B'},{l:'Info',v:counts.info,c:'#71E07E'},{l:'Unacknowledged',v:counts.unacked,c:'#BA5FFF'}].map(k=>(
          <div key={k.l} className="glass px-4 py-3"><div className="section-label mb-1">{k.l}</div><div className="font-mono font-bold" style={{fontSize:'1.75rem',color:k.c,lineHeight:1}}>{k.v}</div></div>
        ))}
      </div>
      <div className="flex gap-2">
        {[['all','All'],['unacked','Unacknowledged'],['critical','Critical'],['warning','Warning'],['info','Info']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k as typeof filter)} className="font-sans text-xs px-3.5 py-1.5 rounded-xl transition-all"
            style={{borderColor:filter===k?'rgba(113,224,126,0.4)':'rgba(255,255,255,0.08)',color:filter===k?'#71E07E':'rgba(255,255,255,0.4)',background:filter===k?'rgba(113,224,126,0.08)':'transparent',border:'1px solid'}}>{l}</button>
        ))}
      </div>
      <div className="space-y-2.5">
        <AnimatePresence>
          {filtered.map(a=>{
            const m=SEV[a.severity]??SEV.info;
            return(
              <motion.div key={a._id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0}}
                className={`rounded-2xl overflow-hidden ${a.severity==='critical'&&!a.acknowledged?'alert-row-critical':''}`}
                style={{background:m.bg,border:`1px solid ${m.border}45`}}>
                <div className="flex gap-3 p-4">
                  <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{background:m.border}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <motion.span style={{color:m.color}} animate={a.severity==='critical'&&!a.acknowledged?{opacity:[1,.3,1]}:{}} transition={{duration:.9,repeat:Infinity}}>{m.icon}</motion.span>
                        <span className="font-mono font-bold" style={{color:m.color,fontSize:'0.7rem',letterSpacing:'0.1em'}}>{TYPE_LABELS[a.type]??a.type.replace(/_/g,' ')}</span>
                        {a.bedId&&<span className="badge badge-muted" style={{fontSize:'0.6rem'}}>{a.bedId}</span>}
                        {a.acknowledged&&<span className="badge badge-green" style={{fontSize:'0.6rem'}}>ACK</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-white/30" style={{fontSize:'0.7rem'}}>{timeSince(a.createdAt)}</span>
                        {!a.acknowledged&&<button onClick={()=>handleAck(a._id)} className="font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs" style={{color:m.color,border:`1px solid ${m.border}45`,background:'transparent',fontSize:'0.65rem'}}>ACK</button>}
                        {!a.resolved&&<button onClick={()=>handleResolve(a._id)} className="font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer" style={{color:'#71E07E',border:'1px solid rgba(113,224,126,0.25)',background:'transparent',fontSize:'0.65rem'}}>Resolve</button>}
                      </div>
                    </div>
                    <p className="font-sans text-white/65 text-sm">{a.message}</p>
                    <p className="font-mono text-white/25 mt-1" style={{fontSize:'0.7rem'}}>{new Date(a.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length===0&&(
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{background:'rgba(113,224,126,0.1)'}}><CheckCheck size={24} color="#71E07E"/></div>
            <p className="font-sans text-white/30 text-sm">No alerts in this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
