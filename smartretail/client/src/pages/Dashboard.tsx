// src/pages/Dashboard.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, ShoppingCart, Users, AlertTriangle,
         Package, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import useStore from '@/store/useStore';
import { alertApi } from '@/lib/api';

// ── Animated counter ─────────────────────────────────────────
function Counter({ val, prefix='', suffix='' }: { val:number; prefix?:string; suffix?:string }) {
  const ref  = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    if (!ref.current || isNaN(val)) return;
    const obj = { v: prev.current };
    gsap.to(obj, { v: val, duration: 0.9, ease: 'power2.out',
      onUpdate() { if (ref.current) ref.current.textContent = `${prefix}${Math.round(obj.v).toLocaleString('en-IN')}${suffix}`; },
      onComplete() { prev.current = val; }
    });
  }, [val]);
  return <span ref={ref}>{prefix}{Math.round(val).toLocaleString('en-IN')}{suffix}</span>;
}

// ── KPI Card ─────────────────────────────────────────────────
function KPICard({ label, val, prefix='', suffix='', icon, color, trend, trendVal }: {
  label:string; val:number; prefix?:string; suffix?:string;
  icon:React.ReactNode; color:string; trend?:'up'|'down'; trendVal?:string;
}) {
  return (
    <div className="kpi-card gsap-up">
      <div className="flex items-center justify-between">
        <span className="kpi-label">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background:`${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="kpi-value">
        <Counter val={val} prefix={prefix} suffix={suffix} />
      </div>
      {trend && trendVal && (
        <div className="flex items-center gap-1 text-xs" style={{ fontFamily:'Space Mono', color: trend==='up' ? '#16a34a' : '#dc2626' }}>
          {trend==='up' ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
          {trendVal} vs yesterday
        </div>
      )}
    </div>
  );
}

// ── Live POS Ticker ───────────────────────────────────────────
function POSTicker() {
  const txns = useStore(s => s.transactions);
  const recent = txns.slice(0, 8);
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="live-dot w-2 h-2 rounded-full" style={{ background:'#16a34a' }} />
          <span className="section-label">Live POS Stream</span>
        </div>
        <span className="font-mono text-xs" style={{ color:'#0145f2' }}>
          {txns[0]?.terminalId ?? '—'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden space-y-1.5">
        <AnimatePresence initial={false}>
          {recent.map((tx, i) => (
            <motion.div
              key={tx.txId}
              initial={{ opacity:0, y:-12, scale:.96 }}
              animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0 }}
              transition={{ duration:0.25 }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: i===0 ? 'rgba(1,69,242,0.06)' : 'rgba(0,0,0,0.02)',
                       border: i===0 ? '1px solid rgba(1,69,242,0.15)' : '1px solid transparent' }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                   style={{ background: tx.payment==='cash' ? '#16a34a' : tx.payment==='upi' ? '#7c3aed' : '#0145f2' }} />
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-slate-700 truncate">{tx.zone}</div>
                <div className="font-mono text-slate-400" style={{ fontSize:9 }}>{tx.terminalId} · {tx.items} item{tx.items>1?'s':''}</div>
              </div>
              <div className="font-mono text-xs font-bold" style={{ color:'#0145f2' }}>
                ₹{tx.total.toLocaleString('en-IN')}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {recent.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
            Waiting for transactions…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Footfall Zone Bars ────────────────────────────────────────
function FootfallBars() {
  const zones = useStore(s => s.footfall);
  const COLOR_MAP: Record<string,string> = {
    Entrance:'#0145f2', Electronics:'#7c3aed', Fashion:'#ec4899',
    Grocery:'#16a34a', 'Home & Living':'#d97706', Checkout:'#dc2626',
  };
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">Zone Footfall</span>
        <div className="flex items-center gap-1.5">
          <div className="live-dot w-1.5 h-1.5 rounded-full" style={{ background:'#16a34a' }} />
          <span className="font-mono text-slate-400" style={{ fontSize:9 }}>LIVE</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5 overflow-hidden">
        {zones.slice(0,6).map(z => {
          const color = COLOR_MAP[z.zoneName] ?? '#64748b';
          const pct   = Math.min(100, z.occupancyPct);
          const isCrowded = pct > 80;
          return (
            <div key={z.zoneId}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-slate-700">{z.zoneName}</span>
                <div className="flex items-center gap-2">
                  {isCrowded && <span className="badge-danger" style={{ fontSize:8 }}>CROWDED</span>}
                  <span className="font-mono text-xs font-bold" style={{ color }}>{z.count}</span>
                  <span className="font-mono text-slate-400" style={{ fontSize:9 }}>/{z.capacity}</span>
                </div>
              </div>
              <div className="stock-bar">
                <motion.div
                  className="stock-fill"
                  style={{ background: isCrowded ? '#dc2626' : color, width:`${pct}%` }}
                  animate={{ width:`${pct}%` }}
                  transition={{ duration:0.5 }}
                />
              </div>
            </div>
          );
        })}
        {zones.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
            Connecting to sensors…
          </div>
        )}
      </div>
    </div>
  );
}

// ── Recent Alerts strip ───────────────────────────────────────
function AlertStrip() {
  const alerts = useStore(s => s.alerts).filter(a => !a.resolved).slice(0,5);
  const SEV: Record<string,{bg:string;border:string;color:string}> = {
    critical: { bg:'rgba(220,38,38,0.06)', border:'#dc2626', color:'#dc2626' },
    warning:  { bg:'rgba(217,119,6,0.06)', border:'#d97706', color:'#d97706' },
    info:     { bg:'rgba(1,69,242,0.05)',  border:'#0145f2', color:'#0145f2' },
  };
  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="section-label">Active Alerts</span>
        <span className="badge-danger" style={{ fontSize:8 }}>{alerts.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        {alerts.map(a => {
          const s = SEV[a.severity] ?? SEV.info;
          return (
            <div key={a._id} className="flex gap-2.5 px-3 py-2 rounded-lg"
                 style={{ background:s.bg, borderLeft:`2px solid ${s.border}` }}>
              <div>
                <div className="font-mono font-bold" style={{ fontSize:8.5, color:s.color, letterSpacing:'0.1em' }}>
                  {a.type.replace(/_/g,' ')}
                </div>
                <div className="font-sans text-xs text-slate-600 leading-snug mt-0.5">{a.message}</div>
                {a.zone && <div className="font-mono text-slate-400 mt-0.5" style={{ fontSize:9 }}>{a.zone}</div>}
              </div>
            </div>
          );
        })}
        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Activity size={14} color="#16a34a" />
            </div>
            <span className="font-mono text-xs text-slate-400">All clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Revenue mini chart ────────────────────────────────────────
function RevenueChart() {
  const txns = useStore(s => s.transactions);
  const [data, setData] = useState<{time:string;rev:number}[]>([]);

  useEffect(() => {
    const now   = new Date();
    const slots: Record<string,number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 5 * 60000);
      const k = `${String(d.getHours()).padStart(2,'0')}:${String(Math.floor(d.getMinutes()/5)*5).padStart(2,'0')}`;
      slots[k] = 0;
    }
    txns.forEach(tx => {
      const d = new Date(tx.timestamp);
      const k = `${String(d.getHours()).padStart(2,'0')}:${String(Math.floor(d.getMinutes()/5)*5).padStart(2,'0')}`;
      if (slots[k] !== undefined) slots[k] += tx.total;
    });
    setData(Object.entries(slots).map(([time,rev]) => ({ time, rev: Math.round(rev) })));
  }, [txns]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">Revenue — Last 60 min</span>
        <span className="font-mono text-xs font-bold" style={{ color:'#0145f2' }}>
          ₹{useStore(s=>s.dailyRevenue).toLocaleString('en-IN')} today
        </span>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={data} margin={{ top:4, right:4, left:-20, bottom:0 }}>
          <defs>
            <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0145f2" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#0145f2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="time" tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v:number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                   contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }} />
          <Area type="monotone" dataKey="rev" stroke="#0145f2" strokeWidth={2}
                fill="url(#rev-grad)" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────
export default function Dashboard() {
  const ref   = useRef<HTMLDivElement>(null);
  const { dailyRevenue, dailyTxCount, footfall, alerts, inventory } = useStore();

  const totalFootfall = footfall.reduce((s,z) => s+z.count, 0);
  const lowStock      = inventory.filter(i => ['low_stock','out_of_stock'].includes(i.status)).length;
  const activeAlerts  = alerts.filter(a => !a.resolved && !a.acknowledged).length;

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.gsap-up',
        { opacity:0, y:18 },
        { opacity:1, y:0, stagger:0.07, duration:0.5, ease:'power3.out' }
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="p-6 space-y-5">

      {/* Page header */}
      <div className="gsap-up flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>
            Business Intelligence
          </h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">
            {new Date().toLocaleDateString('en-IN',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
             style={{ background:'rgba(1,69,242,0.06)', border:'1px solid rgba(1,69,242,0.15)' }}>
          <div className="live-dot w-2 h-2 rounded-full" style={{ background:'#16a34a' }} />
          <span className="font-mono text-xs" style={{ color:'#0145f2' }}>All systems live</span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Today's Revenue"    val={dailyRevenue}   prefix="₹" icon={<TrendingUp size={15}/>}      color="#0145f2"  trend="up"   trendVal="+12.4%" />
        <KPICard label="Transactions"       val={dailyTxCount}              icon={<ShoppingCart size={15}/>}    color="#7c3aed"  trend="up"   trendVal="+8%" />
        <KPICard label="Total Footfall"     val={totalFootfall}             icon={<Users size={15}/>}           color="#16a34a"  trend="up"   trendVal="+5.2%" />
        <KPICard label="Stock Alerts"       val={lowStock + activeAlerts}   icon={<AlertTriangle size={15}/>}   color="#dc2626" />
      </div>

      {/* Revenue chart */}
      <div className="gsap-up">
        <RevenueChart />
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-3 gap-4" style={{ height:340 }}>
        <div className="gsap-up"><POSTicker /></div>
        <div className="gsap-up"><FootfallBars /></div>
        <div className="gsap-up"><AlertStrip /></div>
      </div>
    </div>
  );
}
