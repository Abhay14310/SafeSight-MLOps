// src/pages/SalesPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, ShoppingCart, CreditCard, Package } from 'lucide-react';
import useStore from '@/store/useStore';
import { salesApi } from '@/lib/api';
import type { SalesSummary, ZoneSales } from '@/types';

const ZONE_COLORS: Record<string,string> = {
  Electronics:'#0145f2', Fashion:'#ec4899', Grocery:'#16a34a',
  'Home & Living':'#d97706', Checkout:'#dc2626', Entrance:'#7c3aed',
};

export default function SalesPage() {
  const ref       = useRef<HTMLDivElement>(null);
  const txns      = useStore(s => s.transactions);
  const dailyRev  = useStore(s => s.dailyRevenue);
  const dailyTx   = useStore(s => s.dailyTxCount);
  const [summary,  setSummary]  = useState<SalesSummary>({ tx_count:0, revenue:0, avg_basket:0, total_items:0 });
  const [byZone,   setByZone]   = useState<ZoneSales[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.gsap-fade', { opacity:0, y:12 }, { opacity:1, y:0, stagger:0.07, duration:0.45, ease:'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    salesApi.summary().then(r => setSummary(r.data.data)).catch(()=>{});
    salesApi.byZone().then(r => setByZone(r.data.data)).catch(()=>{});
  }, []);

  // Build live zone data from socket transactions
  const liveZones = txns.reduce<Record<string,number>>((acc, tx) => {
    acc[tx.zone] = (acc[tx.zone] ?? 0) + tx.total;
    return acc;
  }, {});
  const zoneData = Object.entries(liveZones)
    .map(([zone, revenue]) => ({ zone, revenue: Math.round(revenue) }))
    .sort((a,b) => b.revenue - a.revenue);

  // Payment breakdown
  const payData = txns.reduce<Record<string,number>>((acc, tx) => {
    acc[tx.payment] = (acc[tx.payment] ?? 0) + 1;
    return acc;
  }, {});
  const payPie = Object.entries(payData).map(([name,value]) => ({ name, value }));
  const PAY_COLORS: Record<string,string> = { card:'#0145f2', upi:'#7c3aed', cash:'#16a34a', wallet:'#d97706' };

  // Hourly revenue from live txns
  const hourly = txns.reduce<Record<string,number>>((acc, tx) => {
    const h = new Date(tx.timestamp).getHours();
    const k = `${String(h).padStart(2,'0')}:00`;
    acc[k] = (acc[k] ?? 0) + tx.total;
    return acc;
  }, {});
  const hourlyData = Object.entries(hourly)
    .map(([h, rev]) => ({ h, rev: Math.round(rev) }))
    .sort((a,b) => a.h.localeCompare(b.h));

  const KPI = [
    { label:'Total Revenue',     val: `₹${(dailyRev || summary.revenue || 0).toLocaleString('en-IN')}`, icon:<TrendingUp size={16}/>,   color:'#0145f2' },
    { label:'Transactions',       val: String(dailyTx || summary.tx_count || 0),                         icon:<ShoppingCart size={16}/>, color:'#7c3aed' },
    { label:'Avg Basket',         val: `₹${Math.round(summary.avg_basket || (dailyRev/(dailyTx||1))).toLocaleString('en-IN')}`, icon:<CreditCard size={16}/>, color:'#16a34a' },
    { label:'Items Sold',         val: String(txns.reduce((s,t)=>s+t.items,0) || summary.total_items || 0), icon:<Package size={16}/>,   color:'#d97706' },
  ];

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="gsap-fade flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>Sales Analytics</h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">Live POS stream + MySQL transactions</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
             style={{ background:'rgba(1,69,242,0.07)', border:'1px solid rgba(1,69,242,0.15)' }}>
          <div className="live-dot w-2 h-2 rounded-full" style={{ background:'#16a34a' }} />
          <span className="font-mono text-xs" style={{ color:'#0145f2' }}>POS Connected</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {KPI.map(k => (
          <div key={k.label} className="kpi-card gsap-fade">
            <div className="flex items-center justify-between">
              <span className="kpi-label">{k.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background:`${k.color}15` }}>
                <span style={{ color:k.color }}>{k.icon}</span>
              </div>
            </div>
            <div className="font-mono font-bold text-slate-900" style={{ fontSize:22, lineHeight:1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Hourly revenue line */}
        <div className="card p-4 col-span-2 gsap-fade">
          <div className="flex items-center justify-between mb-4">
            <span className="section-label">Revenue by Hour</span>
            <span className="badge-navy" style={{ fontSize:9 }}>LIVE</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={hourlyData} margin={{ top:4, right:4, left:-16, bottom:0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="h" tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false}
                     tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v:number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                       contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="rev" stroke="#0145f2" strokeWidth={2}
                    dot={{ r:3, fill:'#0145f2', strokeWidth:0 }} activeDot={{ r:5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment pie */}
        <div className="card p-4 gsap-fade">
          <span className="section-label block mb-4">Payment Mix</span>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={payPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                   innerRadius={45} outerRadius={70} strokeWidth={0}>
                {payPie.map(entry => (
                  <Cell key={entry.name} fill={PAY_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v:number,n:string) => [v, n.toUpperCase()]}
                       contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }} />
              <Legend iconType="circle" iconSize={8}
                      formatter={(v:string) => <span style={{ fontFamily:'Space Mono', fontSize:9, color:'#64748b', textTransform:'uppercase' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Zone breakdown bar */}
      {zoneData.length > 0 && (
        <div className="card p-4 gsap-fade">
          <span className="section-label block mb-4">Revenue by Zone (Live)</span>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={zoneData} margin={{ top:4, right:4, left:-16, bottom:0 }}>
              <CartesianGrid stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="zone" tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false}
                     tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v:number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                       contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:8, border:'1px solid #e2e8f0' }} />
              <Bar dataKey="revenue" radius={[4,4,0,0]}>
                {zoneData.map(entry => (
                  <Cell key={entry.zone} fill={ZONE_COLORS[entry.zone] ?? '#0145f2'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Live tx table */}
      <div className="card p-4 gsap-fade">
        <div className="flex items-center justify-between mb-4">
          <span className="section-label">Recent Transactions</span>
          <div className="live-dot w-2 h-2 rounded-full" style={{ background:'#16a34a' }} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-head">
                <th className="text-left py-2 pr-4">Terminal</th>
                <th className="text-left py-2 pr-4">Zone</th>
                <th className="text-left py-2 pr-4">Items</th>
                <th className="text-left py-2 pr-4">Payment</th>
                <th className="text-right py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {txns.slice(0,10).map(tx => (
                <motion.tr key={tx.txId} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                           className="table-row">
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-700">{tx.terminalId}</td>
                  <td className="py-2.5 pr-4">
                    <span className="font-sans text-xs text-slate-600">{tx.zone}</span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{tx.items}</td>
                  <td className="py-2.5 pr-4">
                    <span className="badge-muted" style={{ fontSize:8 }}>{tx.payment.toUpperCase()}</span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-sm" style={{ color:'#0145f2' }}>
                    ₹{tx.total.toLocaleString('en-IN')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {txns.length === 0 && (
            <div className="text-center py-8 font-mono text-xs text-slate-400">
              Waiting for POS transactions…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
