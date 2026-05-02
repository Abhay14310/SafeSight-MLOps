// src/pages/FleetPage.tsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Truck, Wind, Gauge, Clock } from 'lucide-react';
import { vehicleApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import useStore from '@/store/useStore';
import type { VehicleFrame } from '@/types';

const ST_C:Record<string,string>={active:'#22c55e',idle:'#94a3b8',maintenance:'#f59e0b',offline:'#ef4444'};
const FUEL_C:Record<string,string>={diesel:'#f59e0b',petrol:'#ef4444',cng:'#22c55e',electric:'#0d9488'};
// CO₂ factor kg/km per fuel type (approximate)
const CO2_FACTOR:Record<string,number>={diesel:0.171,petrol:0.192,cng:0.117,electric:0.053,default:0.16};

function relTime(iso?:string):string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000)  return `${Math.round(diff/1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff/60000)}m ago`;
  return `${Math.round(diff/3600000)}h ago`;
}

export default function FleetPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { vehicles, setVehicleFrame } = useStore();

  useEffect(()=>{
    vehicleApi.list().then(r=>r.data.data.forEach((v:VehicleFrame)=>setVehicleFrame(v))).catch(()=>{});
    const sock = getSocket();
    sock.on('vehicle_update',(frames:VehicleFrame[])=>frames.forEach(f=>setVehicleFrame(f)));

    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.fleet-card', { opacity: 0, y: 14, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.45, ease: 'power3.out' });
      }, ref.current);
      return () => { sock.off('vehicle_update'); ctx.revert(); };
    }

    return()=>{ sock.off('vehicle_update'); };
  },[]);

  const frames = Object.values(vehicles);
  const active = frames.filter(v=>v.status==='active').length;

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title text-green-900">Fleet Management</h1><p className="text-small text-slate-500 mt-0.5">Live vehicle tracking · {frames.length} vehicles</p></div>
        <div className="flex gap-2">
          <div className="badge-green">{active} Active</div>
          <div className="badge-grey">{frames.filter(v=>v.status==='idle').length} Idle</div>
        </div>
      </div>

      {/* Summary strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {label:'Active',val:active,color:'#22c55e'},
            {label:'Total Load (kg)',val:frames.reduce((s,v)=>s+(v.currentLoad??0),0),color:'#0d9488'},
            {label:'CO₂ Saved (kg)',val:Math.round(frames.reduce((s,v)=>s+(v.mileage??0)*(CO2_FACTOR[v.fuelType]??CO2_FACTOR.default)*0.3,0)),color:'#16a34a'},
            {label:'Maintenance',val:frames.filter(v=>v.status==='maintenance').length,color:'#f59e0b'},
          ].map(k=>(
            <div key={k.label} className="card px-4 py-3">
              <div className="kpi-label mb-1">{k.label}</div>
              <div className="font-mono font-bold" style={{fontSize:'1.75rem',color:k.color,lineHeight:1}}>{k.val.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>

      <div className="grid grid-cols-2 gap-5">
        {frames.map(v=>{
          const loadPct = Math.round(((v.currentLoad??0)/(v.capacity||5000))*100);
          const isFull  = loadPct>=90;
          return (
            <div key={v.vehicleId} className="card fleet-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{background:`${ST_C[v.status]??'#94a3b8'}15`}}>
                    <Truck size={18} color={ST_C[v.status]??'#94a3b8'}/>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-green-900" style={{fontSize:'1rem'}}>{v.vehicleId}</div>
                    <div className="text-small text-slate-500">{v.regNumber}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="dot" style={{background:ST_C[v.status]??'#94a3b8',boxShadow:`0 0 6px ${ST_C[v.status]??'#94a3b8'}80`}}/>
                  <span className="font-mono capitalize text-slate-600" style={{fontSize:'0.75rem'}}>{v.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-small">
                <div><div className="kpi-label mb-0.5">Driver</div><div className="font-medium text-slate-700">{v.driverName??'Unassigned'}</div></div>
                <div><div className="kpi-label mb-0.5">Zone</div><div className="font-medium text-slate-700 truncate">{v.currentZone??'—'}</div></div>
                <div><div className="kpi-label mb-0.5">Fuel</div>
                  <span className="font-mono capitalize" style={{color:FUEL_C[v.fuelType]??'#94a3b8',fontSize:'0.8rem'}}>{v.fuelType}</span>
                </div>
                <div><div className="kpi-label mb-0.5">Speed</div>
                  <div className="flex items-center gap-1">
                    <Gauge size={11} color="#0d9488"/>
                    <span className="font-mono text-slate-700" style={{fontSize:'0.8rem'}}>
                      {v.status==='active'?`${Math.round(20+Math.random()*40)} km/h`:'Idle'}
                    </span>
                  </div>
                </div>
              </div>
              {/* CO₂ saved + last seen row */}
              <div className="flex items-center justify-between mb-3 text-small">
                <div className="flex items-center gap-1 text-green-700">
                  <Wind size={11}/>
                  <span className="font-mono" style={{fontSize:'0.7rem'}}>
                    CO₂: ~{Math.round((v.mileage??0)*(CO2_FACTOR[v.fuelType]??CO2_FACTOR.default)*0.3).toLocaleString()} kg saved
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400" style={{fontSize:'0.68rem'}}>
                  <Clock size={9}/>
                  <span>{relTime((v as VehicleFrame & {updatedAt?:string}).updatedAt)}</span>
                </div>
              </div>

              {/* Load bar */}
              <div>
                <div className="flex justify-between mb-1 text-small">
                  <span className="text-slate-500">Load capacity</span>
                  <span className="font-mono font-bold" style={{color:isFull?'#ef4444':'#22c55e'}}>
                    {(v.currentLoad??0).toLocaleString()}kg / {(v.capacity??0).toLocaleString()}kg
                  </span>
                </div>
                <div className="fill-bar">
                  <motion.div className="fill-bar-inner"
                    style={{background:isFull?'#ef4444':loadPct>70?'#f59e0b':'#22c55e',width:`${loadPct}%`}}
                    animate={{width:`${loadPct}%`}} transition={{duration:0.6}}/>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-slate-400" style={{fontSize:'0.65rem'}}>{loadPct}% full</span>
                  <span className="font-mono text-slate-400" style={{fontSize:'0.65rem'}}>{v.mileage?.toLocaleString()}km</span>
                </div>
              </div>
            </div>
          );
        })}
        {frames.length===0&&<div className="col-span-2 text-center py-16 text-small text-slate-400">Connecting to vehicle stream…</div>}
      </div>
    </div>
  );
}
