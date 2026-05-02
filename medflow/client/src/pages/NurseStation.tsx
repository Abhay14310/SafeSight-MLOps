// src/pages/NurseStation.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Users, AlertTriangle, CheckCircle, Clock, Search, RefreshCw, ChevronRight } from 'lucide-react';
import useStore from '@/store/useStore';
import { patientApi } from '@/lib/api';
import { useGSAPEntrance } from '@/hooks/useVitals';
import type { Patient } from '@/types';
import AlertPanel from '@/components/AlertPanel';

// ── Mini vitals inline ────────────────────────────────────────
function MiniVitals({ patientId }: { patientId: string }) {
  const v = useStore(s => s.vitalsMap[patientId]);
  if (!v) return <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />;
  return (
    <div className="flex gap-2">
      <span className="font-mono" style={{fontSize:10,color:'#FF4D6D'}}>♥ {v.bpm}</span>
      <span className="font-mono" style={{fontSize:10,color:'#00d4ff'}}>O₂ {v.spo2}%</span>
      <span className="font-mono" style={{fontSize:10,color:'#ffaa00'}}>{v.temp}°C</span>
    </div>
  );
}

// ── Mini skeleton (canvas) ────────────────────────────────────
const BONES: Record<string,[number,number][][]> = {
  default: [[[.5,.11],[.5,.44]],[[.3,.24],[.7,.24]],[[.3,.24],[.25,.5]],[[.7,.24],[.75,.5]],[[.5,.44],[.42,.74]],[[.5,.44],[.58,.74]],[[.42,.74],[.42,.93]],[[.58,.74],[.58,.93]]],
  sleep:   [[[.14,.35],[.86,.35]],[[.14,.35],[.12,.22]],[[.5,.35],[.5,.52]],[[.5,.52],[.37,.76]],[[.5,.52],[.63,.76]]],
  sit:     [[[.5,.1],[.5,.4]],[[.28,.22],[.72,.22]],[[.28,.22],[.2,.46]],[[.72,.22],[.8,.46]],[[.5,.4],[.36,.57]],[[.5,.4],[.64,.57]],[[.36,.57],[.31,.82]],[[.64,.57],[.69,.82]]],
};

function MiniSkeleton({ status }: { status: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const raf = React.useRef(0);
  const t   = React.useRef(0);
  const isCrit = status === 'critical';
  const boneKey = 'default';

  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = 54, H = 54;
    const bones = BONES[boneKey];
    const loop = () => {
      t.current++;
      ctx.clearRect(0,0,W,H);
      const jy = isCrit ? Math.sin(t.current*0.1)*2.5 : 0;
      ctx.strokeStyle = isCrit ? '#FF0000' : 'rgba(0,212,255,0.8)';
      ctx.shadowColor = isCrit ? 'rgba(255,0,0,0.5)' : 'rgba(0,212,255,0.3)';
      ctx.shadowBlur = 3; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      bones.forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(a[0]*W,a[1]*H+jy); ctx.lineTo(b[0]*W,b[1]*H+jy); ctx.stroke(); });
      const seen = new Set<string>();
      bones.forEach(([a,b]) => [a,b].forEach(p => {
        const k=p.join(','); if(seen.has(k)) return; seen.add(k);
        ctx.beginPath(); ctx.arc(p[0]*W,p[1]*H+jy,2,0,Math.PI*2);
        ctx.fillStyle = isCrit ? '#FF0000' : 'rgba(0,212,255,0.95)'; ctx.fill();
      }));
      ctx.shadowBlur=0;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [status]);

  return <canvas ref={ref} width={54} height={54} style={{display:'block'}} />;
}

// ── Room Card ─────────────────────────────────────────────────
function RoomCard({ pt, onClick }: { pt: Patient; onClick: () => void }) {
  const isCrit = pt.status === 'critical';
  const isWarn = pt.status === 'warning';
  const alerts = useStore(s =>
    s.alerts.filter(a => {
      if (!a.patientId) return false;
      const pid = typeof a.patientId === 'string' ? a.patientId : (a.patientId as any)?._id;
      return pid === pt._id && !a.acknowledged;
    }).length
  );

  return (
    <motion.div layout whileHover={{ scale:1.013 }} whileTap={{ scale:0.99 }}
      onClick={onClick}
      className={`glass rounded-lg p-3 cursor-pointer relative overflow-hidden group
        ${isCrit ? 'alert-critical' : isWarn ? 'alert-warning' : 'hover:border-white/12'}`}
    >
      {alerts > 0 && (
        <motion.span animate={{opacity:[1,0.3,1]}} transition={{duration:0.8,repeat:Infinity}}
          className="absolute top-2 right-2 w-4 h-4 bg-red rounded-full flex items-center justify-center font-mono text-white" style={{fontSize:8}}>
          {alerts}
        </motion.span>
      )}

      <div className="flex items-center gap-1.5 mb-2">
        <span className={`status-dot ${isCrit?'dot-critical animate-blink-fast':isWarn?'dot-warn':'dot-stable'}`} />
        <span className="font-mono text-grey-400" style={{fontSize:9,letterSpacing:'0.13em'}}>{pt.bed}</span>
        <span className="ml-auto text-grey-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={11}/>
        </span>
      </div>

      <div className="flex gap-2.5 items-center mb-2.5">
        <div className="flex-shrink-0 rounded overflow-hidden bg-black/50 border border-white/5">
          <MiniSkeleton status={pt.status} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-sans font-medium text-white truncate mb-0.5" style={{fontSize:11.5}}>{pt.name}</p>
          <p className="font-mono text-grey-400 mb-1.5 truncate" style={{fontSize:9}}>{pt.condition}</p>
          <span className={`badge ${isCrit?'badge-red':isWarn?'badge-amber':'badge-green'}`}
                style={{fontSize:8,padding:'2px 5px'}}>{pt.status}</span>
        </div>
      </div>

      <div className="border-t pt-2" style={{borderColor:'rgba(255,255,255,0.05)'}}>
        <MiniVitals patientId={pt._id} />
      </div>
    </motion.div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function Stat({ label, n, icon, color }: { label:string; n:number; icon:React.ReactNode; color:string }) {
  return (
    <div className="gsap-slide-up glass rounded-lg p-3 flex items-center gap-3">
      <div className="p-2 rounded-md flex-shrink-0" style={{background:`${color}18`,border:`1px solid ${color}28`}}>
        <span style={{color}}>{icon}</span>
      </div>
      <div>
        <p className="font-mono font-bold text-white" style={{fontSize:24,lineHeight:1}}>{n}</p>
        <p className="vital-label mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function NurseStation() {
  const navigate = useNavigate();
  const { patients, alerts, setPatients } = useStore();
  const containerRef = useGSAPEntrance([patients.length]);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all'|'critical'|'warning'|'stable'>('all');
  const [loading, setLoading] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  async function refresh() {
    setLoading(true);
    try { const r = await patientApi.list(); setPatients(r.data.data); } finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const visible = patients.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.bed.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const crit   = patients.filter(p => p.status === 'critical').length;
  const warn   = patients.filter(p => p.status === 'warning').length;
  const stable = patients.filter(p => p.status === 'stable').length;
  const unacked = alerts.filter(a => !a.acknowledged).length;

  return (
    <div ref={containerRef} className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">

        {/* Header */}
        <div className="gsap-slide-up flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-mono font-bold text-white text-lg tracking-wider">NURSE STATION</h1>
            <p className="font-mono text-grey-400 text-xs mt-0.5">ICU Ward 4A · {patients.length} patients</p>
          </div>
          <div className="flex gap-2">
            <button onClick={refresh} disabled={loading} className="btn-ghost py-1.5 text-xs gap-1.5">
              <RefreshCw size={12} className={loading?'animate-spin':''}/> Refresh
            </button>
            <button onClick={() => setShowAlerts(v => !v)}
              className={`btn py-1.5 text-xs gap-1.5 ${showAlerts?'btn-red':'btn-ghost'}`}>
              <AlertTriangle size={12}/>
              Alerts {unacked > 0 && <span className="bg-red text-white rounded font-mono px-1" style={{fontSize:8}}>{unacked}</span>}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <Stat label="Total" n={patients.length} icon={<Users size={15}/>}        color="#00d4ff"/>
          <Stat label="Critical"  n={crit}   icon={<AlertTriangle size={15}/>}      color="#FF0000"/>
          <Stat label="Warning"   n={warn}   icon={<Clock size={15}/>}              color="#ffaa00"/>
          <Stat label="Stable"    n={stable} icon={<CheckCircle size={15}/>}        color="#00ff88"/>
        </div>

        {/* Filters */}
        <div className="gsap-slide-up flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name or bed…" className="input-dark pl-8 py-1.5 text-xs"/>
          </div>
          {(['all','critical','warning','stable'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-mono px-2.5 py-1.5 rounded text-xs uppercase tracking-wider border transition-all
                ${filter===f
                  ? f==='critical'?'bg-red/15 border-red/40 text-red'
                  : f==='warning' ?'bg-amber/15 border-amber/40 text-amber'
                  : f==='stable'  ?'bg-green/10 border-green/30 text-green'
                  : 'bg-cyan/10 border-cyan/30 text-cyan'
                  : 'border-border text-grey-400 hover:border-border-hi hover:text-grey-200'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-dark pb-4">
          <div className="grid gap-3" style={{gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))'}}>
            <AnimatePresence>
              {visible.map(pt => (
                <motion.div key={pt._id} layout initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
                  <RoomCard pt={pt} onClick={() => navigate(`/home-monitor/${pt._id}`)}/>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Alert sidebar */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div key="asb" initial={{width:0,opacity:0}} animate={{width:300,opacity:1}} exit={{width:0,opacity:0}}
            transition={{duration:0.3,ease:[0.16,1,0.3,1]}}
            className="flex-shrink-0 border-l overflow-hidden" style={{borderColor:'rgba(255,255,255,0.07)',background:'#080808'}}>
            <AlertPanel/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
