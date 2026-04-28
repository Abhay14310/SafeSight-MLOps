// src/pages/WasteLogPage.tsx — enhanced with pagination, delete, and CSV export
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Plus, Search, Trash2, RefreshCw, Download, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { wasteApi } from '@/lib/api';
import useStore from '@/store/useStore';
import type { WasteLog, WasteType } from '@/types';

const TYPES: WasteType[] = ['organic','recyclable','hazardous','e-waste','medical','general','construction'];
const STATUS_C: Record<string,string> = { collected:'#22c55e',in_transit:'#0d9488',processing:'#f59e0b',disposed:'#6366f1',recycled:'#22c55e' };
const TYPE_C:   Record<string,string> = { organic:'#22c55e',recyclable:'#4ade80',hazardous:'#ef4444','e-waste':'#f59e0b',medical:'#6366f1',general:'#94a3b8',construction:'#d97706' };

const PAGE_SIZE = 20;

function LogForm({ onSuccess }: { onSuccess:()=>void }) {
  const [f,setF]         = useState({ vehicleId:'VH-001',zone:'Zone A - North',wasteType:'organic' as WasteType, weightKg:'', notes:'' });
  const [loading,setLoading] = useState(false);
  const { addToast } = useStore();

  async function submit(e:React.FormEvent){
    e.preventDefault(); setLoading(true);
    try{
      await wasteApi.create({...f,weightKg:parseFloat(f.weightKg)});
      addToast('success',`Waste log created — ${f.weightKg}kg ${f.wasteType}`);
      onSuccess();
    }catch{ addToast('error','Failed to create log'); }
    finally{ setLoading(false); }
  }

  return (
    <div className="card p-6">
      <div className="section-heading mb-4">New Waste Log</div>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div><label className="section-heading block mb-1">Vehicle ID</label>
          <input className="input" value={f.vehicleId} onChange={e=>setF({...f,vehicleId:e.target.value})} required/>
        </div>
        <div><label className="section-heading block mb-1">Zone</label>
          <select className="select" value={f.zone} onChange={e=>setF({...f,zone:e.target.value})}>
            {['Zone A - North','Zone B - South','Zone C - East','Zone D - West','Zone E - Central'].map(z=><option key={z}>{z}</option>)}
          </select>
        </div>
        <div><label className="section-heading block mb-1">Waste Type</label>
          <select className="select" value={f.wasteType} onChange={e=>setF({...f,wasteType:e.target.value as WasteType})}>
            {TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="section-heading block mb-1">Weight (kg)</label>
          <input type="number" className="input" value={f.weightKg} onChange={e=>setF({...f,weightKg:e.target.value})} placeholder="e.g. 250" required min="0"/>
        </div>
        <div className="col-span-2"><label className="section-heading block mb-1">Notes</label>
          <input className="input" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} placeholder="Optional notes…"/>
        </div>
        <div className="col-span-2">
          <button type="submit" disabled={loading} className="btn-green">
            {loading?<><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"/>Saving…</>:<><Plus size={14}/>Log Collection</>}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function WasteLogPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [logs,     setLogs]      = useState<WasteLog[]>([]);
  const [search,   setSearch]    = useState('');
  const [filter,   setFilter]    = useState('all');
  const [showForm, setShowForm]  = useState(false);
  const [loading,  setLoading]   = useState(false);
  const [page,     setPage]      = useState(1);
  const [deleting, setDeleting]  = useState<string|null>(null);
  const { addToast } = useStore();

  async function load(){ setLoading(true); try{ const r=await wasteApi.list({limit:'200'}); setLogs(r.data.data); }catch{}finally{setLoading(false);} }

  useEffect(() => {
    load();
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.log-header', { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
    }, ref.current);
    return () => ctx.revert();
  }, []);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPage(1); }, [search, filter]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this waste log?')) return;
    setDeleting(id);
    try {
      await wasteApi.delete(id);
      setLogs(prev => prev.filter(l => l._id !== id));
      addToast('success', 'Log deleted');
    } catch { addToast('error', 'Failed to delete'); }
    finally { setDeleting(null); }
  }

  function exportCsv() {
    const rows = filtered.map(l =>
      `${l.logId},${l.vehicleId},${l.zone},${l.wasteType},${l.weightKg},${l.status},${l.collectedAt}`
    );
    const csv  = 'Log ID,Vehicle,Zone,Type,Weight(kg),Status,Collected At\n' + rows.join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ecotrack-logs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast('success', `${filtered.length} logs exported`);
  }

  const filtered  = logs.filter(l => (filter==='all'||l.wasteType===filter) && (!search||l.zone.toLowerCase().includes(search.toLowerCase())||l.vehicleId.includes(search)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const totalWeight = filtered.reduce((s,l) => s + (l.weightKg??0), 0);

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="log-header flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Waste Logs</h1>
          <p className="text-small text-slate-500 mt-0.5">Manual + AI camera collection records · {filtered.length} records · {Math.round(totalWeight).toLocaleString()}kg total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/camera')} className="btn-outline">
            <Camera size={13}/> AI Camera
          </button>
          <button onClick={exportCsv} disabled={filtered.length===0} className="btn-ghost">
            <Download size={13}/> CSV
          </button>
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={13} className={loading?'animate-spin':''}/>
          </button>
          <button onClick={() => setShowForm(v => !v)} className="btn-green">
            <Plus size={14}/>{showForm?'Cancel':'New Log'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}}>
            <LogForm onSuccess={()=>{setShowForm(false);load();}}/>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + type filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="input pl-9 py-2 text-small" placeholder="Search zone or vehicle…"/>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all',...TYPES].map(t=>(
            <button key={t} onClick={()=>setFilter(t)}
              className={`font-mono capitalize px-3 py-1.5 rounded-lg border transition-all text-small ${filter===t?'border-green-500 text-green-700 bg-green-50':'border-slate-200 text-slate-500 hover:border-green-300'}`}
              style={{fontSize:'0.75rem'}}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full eco-table">
          <thead>
            <tr>
              <th>Log ID</th><th>Vehicle</th><th>Zone</th><th>Type</th>
              <th>Weight</th><th>Status</th><th>Collected</th><th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((l,i)=>(
              <motion.tr key={l._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="log-row">
                <td><span className="font-mono text-slate-600" style={{fontSize:'0.75rem'}}>{l.logId?.slice(-8)}</span></td>
                <td><span className="font-mono font-bold" style={{color:'#166534',fontSize:'0.875rem'}}>{l.vehicleId}</span></td>
                <td className="text-small text-slate-600">{l.zone}</td>
                <td>
                  <span className="badge" style={{background:`${TYPE_C[l.wasteType]??'#22c55e'}18`,color:TYPE_C[l.wasteType]??'#166534',border:`1px solid ${TYPE_C[l.wasteType]??'#22c55e'}40`,fontSize:'0.65rem',letterSpacing:'0.08em'}}>
                    {l.wasteType}
                  </span>
                </td>
                <td><span className="font-mono font-bold text-green-700">{l.weightKg}<span className="text-slate-400 font-normal text-xs ml-0.5">kg</span></span></td>
                <td>
                  <span className="badge" style={{background:`${STATUS_C[l.status]??'#94a3b8'}15`,color:STATUS_C[l.status]??'#94a3b8',border:`1px solid ${STATUS_C[l.status]??'#94a3b8'}30`,fontSize:'0.65rem'}}>
                    {l.status?.replace('_',' ')}
                  </span>
                </td>
                <td className="font-mono text-slate-400" style={{fontSize:'0.7rem'}}>
                  {new Date(l.collectedAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})}
                </td>
                <td>
                  <button onClick={()=>handleDelete(l._id)} disabled={deleting===l._id}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded" title="Delete log">
                    {deleting===l._id
                      ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block"/>
                      : <Trash2 size={12}/>}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length===0 && <div className="text-center py-12 text-small text-slate-400">No waste logs found</div>}
        {loading && (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_,i)=><div key={i} className="shimmer h-10 w-full"/>)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-small text-slate-400 font-mono">
            Page {page} of {totalPages} · showing {paginated.length} of {filtered.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button className="page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>
              <ChevronLeft size={14}/>
            </button>
            {[...Array(Math.min(totalPages,7))].map((_,i) => {
              const p = i+1;
              return (
                <button key={p} className={`page-btn ${page===p?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
              );
            })}
            <button className="page-btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
