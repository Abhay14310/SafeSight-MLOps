// src/pages/ReportsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import gsap from 'gsap';
import { Download, TrendingUp, Recycle, Leaf } from 'lucide-react';
import { reportApi } from '@/lib/api';

function exportAllCsv(byZone: Array<{_id:string;total:number;count:number}>, byType: Array<{_id:string;total:number;count:number}>, weeklyChart: Array<Record<string,number|string>>) {
  const lines: string[] = ['EcoTrack Report Export',''];
  lines.push('BY ZONE','Zone,Pickups,Total Weight (kg)');
  byZone.forEach(z => lines.push(`${z._id},${z.count},${Math.round(z.total)}`));
  lines.push('');
  lines.push('BY WASTE TYPE','Type,Pickups,Total Weight (kg)');
  byType.forEach(t => lines.push(`${t._id},${t.count},${Math.round(t.total)}`));
  lines.push('');
  lines.push('WEEKLY BREAKDOWN (kg by day)','Day,'+Object.keys(weeklyChart[0]??{}).filter(k=>k!=='day').join(','));
  weeklyChart.forEach(row => lines.push(String(row.day)+','+Object.entries(row).filter(([k])=>k!=='day').map(([,v])=>String(v??0)).join(',')));
  const blob = new Blob([lines.join('\n')], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `ecotrack-report-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}


const TYPE_COLORS: Record<string,string> = {
  organic:'#22c55e', recyclable:'#4ade80', hazardous:'#ef4444',
  'e-waste':'#f59e0b', general:'#94a3b8', medical:'#6366f1', construction:'#d97706',
};
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CustomTooltip = ({ active, payload, label }: { active?:boolean; payload?:unknown[]; label?:string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2.5" style={{ minWidth:120 }}>
      <div className="section-heading mb-1.5">{label}</div>
      {(payload as Array<{name:string;value:number;color:string}>).map(p => (
        <div key={p.name} className="flex justify-between gap-4 text-small">
          <span className="capitalize" style={{ color:p.color }}>{p.name}</span>
          <span className="font-mono font-bold">{Math.round(p.value).toLocaleString()}kg</span>
        </div>
      ))}
    </div>
  );
};

type RangeKey = 'week' | 'lastWeek' | 'month';
const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'week',     label: 'This Week'  },
  { key: 'lastWeek', label: 'Last Week'  },
  { key: 'month',    label: 'This Month' },
];
function rangeParams(key: RangeKey): Record<string, string> {
  const now = new Date();
  if (key === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - 6);
    return { startDate: start.toISOString().slice(0,10), endDate: now.toISOString().slice(0,10) };
  }
  if (key === 'lastWeek') {
    const end = new Date(now); end.setDate(now.getDate() - 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    return { startDate: start.toISOString().slice(0,10), endDate: end.toISOString().slice(0,10) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: start.toISOString().slice(0,10), endDate: now.toISOString().slice(0,10) };
}

export default function ReportsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<RangeKey>('week');
  const [weekly, setWeekly] = useState<Array<{_id:{day:number;type:string};total:number;count:number}>>([]);
  const [byZone, setByZone] = useState<Array<{_id:string;total:number;count:number}>>([]);
  const [byType, setByType] = useState<Array<{_id:string;total:number;count:number}>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = rangeParams(range);
    Promise.all([
      reportApi.weekly(p).then(r => setWeekly(r.data.data)).catch(()=>{}),
      reportApi.byZone(p).then(r => setByZone(r.data.data)).catch(()=>{}),
      reportApi.byType(p).then(r => setByType(r.data.data)).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {

    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.report-card', { opacity: 0, y: 16, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out' });
    }, ref.current);
    return () => { ctx.revert(); };
  }, []);

  // Flatten weekly data into chart-friendly format
  const weeklyChart = DAY_LABELS.map((d,i) => {
    const dayRows = weekly.filter(w => w._id.day === i+1); // MongoDB dayOfWeek: 1=Sun
    const obj: Record<string,number|string> = { day: d };
    dayRows.forEach(r => { obj[r._id.type] = r.total; });
    return obj;
  });

  const totalCollected  = byType.reduce((s,t) => s+t.total, 0);
  const recycled        = (byType.find(t=>t._id==='recyclable')?.total ?? 0) + (byType.find(t=>t._id==='organic')?.total ?? 0) * 0.6;
  const recycleRate     = totalCollected > 0 ? Math.round((recycled/totalCollected)*100) : 0;
  const co2Equivalent   = Math.round(totalCollected * 0.22);

  return (
    <div ref={ref} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Analytics & Reports</h1>
          <p className="text-small text-slate-500 mt-0.5">Waste logistics intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date range filter tabs */}
          <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.15)'}}>
            {RANGES.map(r => (
              <button key={r.key}
                onClick={() => setRange(r.key)}
                className="font-mono rounded-lg px-3 py-1 transition-all duration-200"
                style={{
                  fontSize:'0.72rem', letterSpacing:'0.04em',
                  background: range===r.key ? '#22c55e' : 'transparent',
                  color:      range===r.key ? '#fff'    : '#16a34a',
                  fontWeight: range===r.key ? 700 : 500,
                }}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={()=>exportAllCsv(byZone,byType,weeklyChart)} className="btn-outline" disabled={loading}>
            <Download size={14}/> {loading ? 'Loading…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Total Collected',  val:`${Math.round(totalCollected).toLocaleString('en-IN')} kg`, icon:<Leaf size={16}/>,       color:'#22c55e' },
          { label:'Recycled / Treated',val:`${Math.round(recycled).toLocaleString('en-IN')} kg`,       icon:<Recycle size={16}/>,    color:'#0d9488' },
          { label:'Recycle Rate',     val:`${recycleRate}%`,                                            icon:<TrendingUp size={16}/>, color:'#6366f1' },
          { label:'CO₂ Equivalent',   val:`${co2Equivalent.toLocaleString('en-IN')} kg`,               icon:<Leaf size={16}/>,       color:'#f59e0b' },
        ].map(k => (
          <div key={k.label} className="kpi-card report-kpi report-card">
            <div className="flex items-center justify-between">
              <span className="kpi-label">{k.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${k.color}15` }}>
                <span style={{ color:k.color }}>{k.icon}</span>
              </div>
            </div>
            <div className="font-mono font-bold text-slate-900" style={{ fontSize:'1.4rem', lineHeight:1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-row space-y-5">

        {/* Weekly trend stacked bar */}
        <div className="card p-5 chart-block report-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="section-heading">Weekly Collection Trend</div>
              <p className="text-small text-slate-400 mt-0.5">Weight by waste type per day</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyChart} margin={{ top:4, right:4, left:-16, bottom:0 }}>
              <CartesianGrid stroke="#d1fae5" vertical={false}/>
              <XAxis dataKey="day" tick={{ fontSize:10, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}t`}/>
              <Tooltip content={<CustomTooltip />}/>
              <Legend iconType="circle" iconSize={8}
                      formatter={(v:string)=><span style={{fontFamily:'Space Mono',fontSize:9,color:'#64748b',textTransform:'capitalize'}}>{v}</span>}/>
              {Object.keys(TYPE_COLORS).map(type => (
                <Bar key={type} dataKey={type} stackId="a" fill={TYPE_COLORS[type]} radius={[0,0,0,0]}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* By zone */}
          <div className="card p-5 chart-block report-card">
            <div className="section-heading mb-4">Collection by Zone</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byZone.map(z=>({zone:z._id?.split(' - ')[0]??z._id,total:Math.round(z.total)}))}
                        layout="vertical" margin={{ top:0, right:16, left:8, bottom:0 }}>
                <CartesianGrid stroke="#d1fae5" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}kg`}/>
                <YAxis type="category" dataKey="zone" tick={{ fontSize:9, fontFamily:'Space Mono', fill:'#64748b' }} tickLine={false} axisLine={false} width={55}/>
                <Tooltip formatter={(v:number)=>[`${(v??0).toLocaleString()}kg`,'Weight']} contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:12, border:'1px solid #bbf7d0' }}/>
                <Bar dataKey="total" fill="#22c55e" radius={[0,5,5,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By type donut */}
          <div className="card p-5 chart-block report-card">
            <div className="section-heading mb-4">Waste Composition</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byType.map(t=>({name:t._id,value:Math.round(t.total)}))}
                     dataKey="value" nameKey="name" cx="45%" cy="50%"
                     innerRadius={55} outerRadius={82} strokeWidth={0}>
                  {byType.map(t => <Cell key={t._id} fill={TYPE_COLORS[t._id]??'#94a3b8'}/>)}
                </Pie>
                <Tooltip formatter={(v:number,n:string)=>[`${(v??0).toLocaleString()}kg`,n]} contentStyle={{ fontFamily:'Space Mono', fontSize:11, borderRadius:12, border:'1px solid #bbf7d0' }}/>
                <Legend iconType="circle" iconSize={8} layout="vertical" align="right" verticalAlign="middle"
                        formatter={(v:string)=><span style={{fontFamily:'Space Mono',fontSize:9,color:'#64748b',textTransform:'capitalize'}}>{v}</span>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* By zone area trend */}
        <div className="card p-5 chart-block report-card">
          <div className="section-heading mb-4">Zone Performance Summary</div>
          <div className="space-y-3">
            {byZone.map(z => {
              const maxVal = Math.max(...byZone.map(x=>x.total),1);
              const pct    = Math.round((z.total/maxVal)*100);
              return (
                <div key={z._id}>
                  <div className="flex justify-between mb-1 text-small">
                    <span className="font-medium text-slate-700">{z._id}</span>
                    <div className="flex gap-4">
                      <span className="font-mono text-slate-400">{z.count} pickups</span>
                      <span className="font-mono font-bold text-green-700">{Math.round(z.total).toLocaleString()}kg</span>
                    </div>
                  </div>
                  <div className="fill-bar">
                    <div className="fill-bar-inner" style={{ background:'#22c55e', width:`${pct}%` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
