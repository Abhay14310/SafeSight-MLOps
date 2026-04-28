// src/pages/AlertsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Bell, CheckCheck, RefreshCw, AlertTriangle, Info, AlertOctagon, CheckSquare } from 'lucide-react';
import { alertApi } from '@/lib/api';
import useStore from '@/store/useStore';
import type { Alert, AlertSeverity } from '@/types';

const TYPE_LABELS: Record<string,string> = {
  BIN_OVERFLOW:'Bin Overflow', VEHICLE_BREAKDOWN:'Vehicle Breakdown',
  MISSED_PICKUP:'Missed Pickup', HAZARDOUS_DETECTED:'Hazardous Detected',
  ROUTE_DELAY:'Route Delay', WEIGHT_EXCEEDED:'Weight Exceeded',
  MAINTENANCE_DUE:'Maintenance Due', SYSTEM:'System Alert',
};

const SEV_META: Record<AlertSeverity, { bg:string; border:string; color:string; icon:React.ReactNode }> = {
  critical: { bg:'rgba(239,68,68,0.05)',  border:'#ef4444', color:'#dc2626', icon:<AlertOctagon size={14}/> },
  warning:  { bg:'rgba(245,158,11,0.05)', border:'#f59e0b', color:'#d97706', icon:<AlertTriangle size={14}/> },
  info:     { bg:'rgba(34,197,94,0.04)',  border:'#22c55e', color:'#16a34a', icon:<Info size={14}/> },
};

function timeSince(d: string) {
  const s = Math.floor((Date.now()-new Date(d).getTime())/1000);
  if (s<60)   return `${s}s ago`;
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

function AlertRow({ alert, onAck, onResolve }: { alert:Alert; onAck:(id:string)=>void; onResolve:(id:string)=>void }) {
  const m = SEV_META[alert.severity] ?? SEV_META.info;
  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, height:0, marginBottom:0 }}
                className={`rounded-2xl overflow-hidden ${alert.severity==='critical'&&!alert.acknowledged?'alert-critical-row':''}`}
                style={{ background:m.bg, border:`1px solid ${m.border}45`, marginBottom:10 }}>
      <div className="flex gap-3 p-4">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background:m.border }}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.span style={{ color:m.color }}
                           animate={alert.severity==='critical'&&!alert.acknowledged?{opacity:[1,0.3,1]}:{}}
                           transition={{ duration:0.9, repeat:Infinity }}>
                {m.icon}
              </motion.span>
              <span className="font-mono font-bold" style={{ color:m.color, fontSize:'0.75rem', letterSpacing:'0.1em' }}>
                {TYPE_LABELS[alert.type] ?? alert.type.replace(/_/g,' ')}
              </span>
              {alert.zone && (
                <span className="badge-green" style={{ fontSize:'0.65rem' }}>{alert.zone}</span>
              )}
              {alert.vehicleId && (
                <span className="badge-teal" style={{ fontSize:'0.65rem' }}>{alert.vehicleId}</span>
              )}
              {alert.acknowledged && <span className="badge-grey" style={{ fontSize:'0.65rem' }}>ACK</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-slate-400" style={{ fontSize:'0.7rem' }}>{timeSince(alert.createdAt)}</span>
              {!alert.acknowledged && (
                <button onClick={() => onAck(alert._id)}
                        className="font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        style={{ fontSize:'0.65rem', color:m.color, border:`1px solid ${m.border}45`, background:'transparent' }}>
                  ACK
                </button>
              )}
              {!alert.resolved && (
                <button onClick={() => onResolve(alert._id)}
                        className="font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                        style={{ fontSize:'0.65rem', color:'#16a34a', border:'1px solid rgba(34,197,94,0.35)', background:'transparent' }}>
                  Resolve
                </button>
              )}
            </div>
          </div>

          <p className="text-body text-slate-600" style={{ lineHeight:1.4 }}>{alert.message}</p>
          <p className="font-mono text-slate-400 mt-1" style={{ fontSize:'0.7rem' }}>
            {new Date(alert.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AlertsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { alerts, setAlerts, ackAlert } = useStore();
  const [filter,      setFilter]    = useState<'all'|AlertSeverity|'unacked'>('all');
  const [loading,     setLoading]   = useState(false);
  const [countdown,   setCountdown] = useState(30);

  async function load() {
    setLoading(true);
    setCountdown(30);
    try { const r = await alertApi.list({ limit:'100' }); setAlerts(r.data.data); } catch {}
    finally { setLoading(false); }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { load(); return 30; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleAck(id: string) {
    try { await alertApi.ack(id); ackAlert(id); } catch {}
  }

  async function handleBulkAck() {
    const unacked = alerts.filter(a => !a.acknowledged && !a.resolved);
    await Promise.allSettled(unacked.map(a => alertApi.ack(a._id)));
    unacked.forEach(a => ackAlert(a._id));
  }

  async function handleResolve(id: string) {
    try {
      await alertApi.resolve(id);
      setAlerts(alerts.map(a => a._id===id ? { ...a, resolved:true } : a));
    } catch {}
  }

  useEffect(() => {
    load();
    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.alert-item', { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.05, duration: 0.4, ease: 'power3.out' });
      }, ref.current);
      return () => ctx.revert();
    }
  }, []);

  const filtered = alerts.filter(a => {
    if (filter === 'unacked') return !a.acknowledged && !a.resolved;
    if (filter !== 'all')     return a.severity === filter && !a.resolved;
    return !a.resolved;
  });

  const counts = {
    critical: alerts.filter(a=>a.severity==='critical'&&!a.resolved).length,
    warning:  alerts.filter(a=>a.severity==='warning' &&!a.resolved).length,
    info:     alerts.filter(a=>a.severity==='info'    &&!a.resolved).length,
    unacked:  alerts.filter(a=>!a.acknowledged&&!a.resolved).length,
  };

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="alert-header flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Alert Centre</h1>
          <p className="text-small text-slate-500 mt-0.5">Real-time system and field alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400" style={{fontSize:'0.7rem'}}>Auto-refresh in {countdown}s</span>
          {counts.unacked > 0 && (
            <button onClick={handleBulkAck} className="btn-outline">
              <CheckSquare size={13}/> Ack All ({counts.unacked})
            </button>
          )}
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={13} className={loading?'animate-spin':''}/> Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Critical',          val:counts.critical, color:'#ef4444' },
          { label:'Warning',           val:counts.warning,  color:'#f59e0b' },
          { label:'Info',              val:counts.info,     color:'#22c55e' },
          { label:'Unacknowledged',    val:counts.unacked,  color:'#6366f1' },
        ].map(k => (
          <div key={k.label} className="card px-4 py-3">
            <div className="kpi-label mb-1">{k.label}</div>
            <div className="font-mono font-bold" style={{ fontSize:'1.75rem', color:k.color, lineHeight:1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['all','All'],['unacked','Unacknowledged'],['critical','Critical'],['warning','Warning'],['info','Info']] as const).map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k as typeof filter)}
                  className="font-mono px-3.5 py-1.5 rounded-xl border transition-all"
                  style={{
                    fontSize:'0.75rem',
                    borderColor: filter===k ? '#22c55e' : '#e2e8f0',
                    color:       filter===k ? '#166534' : '#64748b',
                    background:  filter===k ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}>
            {l}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <AnimatePresence>
        {filtered.map(a => (
          <AlertRow key={a._id} alert={a} onAck={handleAck} onResolve={handleResolve}/>
        ))}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background:'#dcfce7' }}>
            <CheckCheck size={24} color="#22c55e"/>
          </div>
          <p className="font-mono text-green-700 font-bold" style={{ fontSize:'0.875rem' }}>All clear</p>
          <p className="text-small text-slate-400">No active alerts matching this filter</p>
        </div>
      )}
    </div>
  );
}
