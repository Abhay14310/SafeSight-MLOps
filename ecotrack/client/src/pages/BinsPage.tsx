// src/pages/BinsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { MapPin, RefreshCw, AlertTriangle } from 'lucide-react';
import { binApi } from '@/lib/api';
import useStore from '@/store/useStore';

const FILL_C=(n:number)=>n>=90?'#ef4444':n>=70?'#f59e0b':n>=40?'#4ade80':'#22c55e';
const TYPE_C:Record<string,string>={organic:'#22c55e',recyclable:'#4ade80',hazardous:'#ef4444','e-waste':'#f59e0b',general:'#94a3b8',mixed:'#6366f1'};

function timeAgo(d?: string) {
  if (!d) return 'Never';
  const s = Math.floor((Date.now()-new Date(d).getTime())/1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function BinsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { bins, setBins } = useStore();
  const [filterLevel, setFilterLevel] = useState<'all'|'critical'|'moderate'|'low'>('all');
  const [search, setSearch] = useState('');

  async function load(){ try{ const r=await binApi.list(); setBins(r.data.data); }catch{} }

  useEffect(()=>{
    load();
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.bin-card', { opacity: 0, scale: 0.95, y: 12 }, { opacity: 1, scale: 1, y: 0, stagger: 0.06, duration: 0.45, ease: 'power3.out' });
    }, ref.current);
    return () => ctx.revert();
  },[]);

  const full     = bins.filter(b=>b.fillLevel>=80).length;
  const overflow  = bins.filter(b=>b.status==='overflow').length;

  const sortedBins = [...bins]
    .filter(b => {
      if (search && !b.binId.toLowerCase().includes(search.toLowerCase()) && !b.zone.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel === 'critical') return b.fillLevel >= 80;
      if (filterLevel === 'moderate') return b.fillLevel >= 40 && b.fillLevel < 80;
      if (filterLevel === 'low')      return b.fillLevel < 40;
      return true;
    })
    .sort((a,b) => b.fillLevel - a.fillLevel);

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title text-green-900">Bin Monitor</h1><p className="text-small text-slate-500 mt-0.5">Live fill levels · {bins.length} bins · sorted by fill level</p></div>
        <div className="flex gap-2 items-center">
          <input value={search} onChange={e=>setSearch(e.target.value)} className="input py-1.5 text-small" style={{width:160}} placeholder="Search bin/zone…"/>
          {overflow>0&&<div className="badge-red">{overflow} Overflow</div>}
          {full>0&&<div className="badge-yellow">{full} Critical</div>}
          <button onClick={load} className="btn-ghost"><RefreshCw size={13}/></button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([['all','All'],['critical','Critical (≥80%)'],['moderate','Moderate'],['low','Low (<40%)']] as const).map(([k,l]) => (
          <button key={k} onClick={()=>setFilterLevel(k)}
                  className="font-mono px-3 py-1.5 rounded-xl border transition-all"
                  style={{fontSize:'0.75rem',borderColor:filterLevel===k?'#22c55e':'#e2e8f0',color:filterLevel===k?'#166534':'#64748b',background:filterLevel===k?'rgba(34,197,94,0.08)':'transparent'}}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          {label:'Total Bins',val:bins.length,color:'#22c55e'},
          {label:'Need Pickup (>80%)',val:full,color:'#f59e0b'},
          {label:'Overflow',val:overflow,color:'#ef4444'},
        ].map(k=>(
          <div key={k.label} className="card px-4 py-3">
            <div className="kpi-label mb-1">{k.label}</div>
            <div className="font-mono font-bold" style={{fontSize:'1.75rem',color:k.color,lineHeight:1}}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {sortedBins.map(bin=>{
          const isUrgent = bin.fillLevel>=80;
          const color    = FILL_C(bin.fillLevel);
          return (
            <div key={bin.binId} className={`card bin-card p-4 ${isUrgent?'border-amber-300':''}`}
                 style={isUrgent?{boxShadow:'0 4px 16px rgba(245,158,11,0.15)'}:{}}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{background:`${TYPE_C[bin.wasteType]??'#22c55e'}15`}}>
                    <MapPin size={15} color={TYPE_C[bin.wasteType]??'#22c55e'}/>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-green-900" style={{fontSize:'0.875rem'}}>{bin.binId}</div>
                    <div className="text-slate-400" style={{fontSize:'0.7rem'}}>{bin.zone}</div>
                  </div>
                </div>
                {isUrgent&&<AlertTriangle size={15} color="#f59e0b"/>}
              </div>

              {bin.address&&<div className="text-small text-slate-500 mb-3 truncate">{bin.address}</div>}

              {/* Fill gauge */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500" style={{fontSize:'0.75rem'}}>Fill level</span>
                  <span className="font-mono font-bold" style={{color,fontSize:'0.875rem'}}>{bin.fillLevel}%</span>
                </div>
                <div className="fill-bar" style={{height:8}}>
                  <motion.div className="fill-bar-inner"
                    style={{background:color,width:`${bin.fillLevel}%`,height:'100%'}}
                    animate={{width:`${bin.fillLevel}%`}} transition={{duration:0.7}}/>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="badge" style={{background:`${TYPE_C[bin.wasteType]??'#22c55e'}15`,color:TYPE_C[bin.wasteType]??'#166534',border:`1px solid ${TYPE_C[bin.wasteType]??'#22c55e'}30`,fontSize:'0.65rem'}}>
                  {bin.wasteType}
                </span>
                <div className="text-right">
                  <div className="font-mono text-slate-400" style={{fontSize:'0.65rem'}}>{bin.capacityL}L</div>
                  <div className="font-mono text-slate-400" style={{fontSize:'0.6rem'}}>Emptied: {timeAgo(bin.lastEmptied)}</div>
                </div>
              </div>
            </div>
          );
        })}
        {sortedBins.length===0&&<div className="col-span-3 text-center py-12 text-small text-slate-400">{bins.length===0?'Loading bins…':'No bins match this filter'}</div>}
      </div>
    </div>
  );
}
