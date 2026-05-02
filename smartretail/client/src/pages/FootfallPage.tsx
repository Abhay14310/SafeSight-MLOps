// src/pages/FootfallPage.tsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Users, Clock, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import useStore from '@/store/useStore';

const COLORS: Record<string,string> = {
  Entrance:'#0145f2', Electronics:'#7c3aed', Fashion:'#ec4899',
  Grocery:'#16a34a', 'Home & Living':'#d97706', Checkout:'#dc2626',
};

export default function FootfallPage() {
  const ref   = useRef<HTMLDivElement>(null);
  const zones = useStore(s => s.footfall);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.ffall-item', { opacity:0, x:-12 }, { opacity:1, x:0, stagger:0.07, duration:0.4, ease:'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, []);

  const total      = zones.reduce((s,z) => s+z.count, 0);
  const entering   = zones.reduce((s,z) => s+z.entering, 0);
  const exiting    = zones.reduce((s,z) => s+z.exiting, 0);
  const avgDwell   = zones.length ? Math.round(zones.reduce((s,z)=>s+z.dwellTime,0)/zones.length) : 0;

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div>
        <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>Footfall Analytics</h1>
        <p className="font-mono text-slate-400 text-xs mt-0.5">AI-powered zone occupancy · Live stream</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Current Footfall', val:total,              icon:<Users size={15}/>,    color:'#0145f2', suffix:' persons' },
          { label:'Entering /3s',     val:entering,           icon:<ArrowUp size={15}/>,  color:'#16a34a', suffix:'' },
          { label:'Exiting /3s',      val:exiting,            icon:<ArrowDown size={15}/>,color:'#dc2626', suffix:'' },
          { label:'Avg Dwell Time',   val:Math.round(avgDwell/60),icon:<Clock size={15}/>,color:'#d97706', suffix:' min' },
        ].map(k => (
          <div key={k.label} className="kpi-card ffall-item">
            <div className="flex items-center justify-between">
              <span className="kpi-label">{k.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:`${k.color}15` }}>
                <span style={{ color:k.color }}>{k.icon}</span>
              </div>
            </div>
            <div className="font-mono font-bold text-slate-900" style={{ fontSize:28, lineHeight:1 }}>
              {k.val}<span className="font-mono text-slate-400" style={{ fontSize:12 }}>{k.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-4 ffall-item">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">Zone Occupancy</span>
          <div className="flex items-center gap-1.5">
            <div className="live-dot w-2 h-2 rounded-full" style={{ background:'#16a34a' }} />
            <span className="font-mono text-slate-400" style={{ fontSize:9 }}>LIVE</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={zones} margin={{ top:4, right:4, left:-16, bottom:0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="zoneName" tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }}
                     formatter={(v:number, n:string) => [v, n==='count'?'Persons':'Capacity']} />
            <Bar dataKey="count" radius={[4,4,0,0]}>
              {zones.map(z => <Cell key={z.zoneId} fill={COLORS[z.zoneName] ?? '#0145f2'} />)}
            </Bar>
            <Bar dataKey="capacity" radius={[4,4,0,0]} fill="rgba(0,0,0,0.06)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone detail cards */}
      <div className="grid grid-cols-3 gap-4">
        {zones.map(z => {
          const color  = COLORS[z.zoneName] ?? '#0145f2';
          const pct    = z.occupancyPct;
          const isCrowd= pct > 80;
          return (
            <div key={z.zoneId} className="card p-4 ffall-item">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-bold text-xs text-slate-700">{z.zoneName}</span>
                {isCrowd && <span className="badge-danger" style={{ fontSize:8 }}>CROWDED</span>}
              </div>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-mono font-bold text-2xl" style={{ color }}>{z.count}</span>
                <span className="font-mono text-slate-400 text-xs">/ {z.capacity}</span>
              </div>
              <div className="stock-bar mb-2">
                <motion.div className="stock-fill"
                  style={{ background: isCrowd ? '#dc2626' : color, width:`${pct}%` }}
                  animate={{ width:`${pct}%` }} transition={{ duration:0.5 }} />
              </div>
              <div className="flex justify-between font-mono text-xs text-slate-400">
                <span>{pct}% full</span>
                <span>~{Math.round(z.dwellTime/60)}min dwell</span>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="font-mono text-xs" style={{ color:'#16a34a' }}>+{z.entering} entering</span>
                <span className="font-mono text-xs" style={{ color:'#dc2626' }}>-{z.exiting} exiting</span>
              </div>
            </div>
          );
        })}
        {zones.length === 0 && (
          <div className="col-span-3 text-center py-12 font-mono text-xs text-slate-400">
            Connecting to footfall sensors…
          </div>
        )}
      </div>
    </div>
  );
}
