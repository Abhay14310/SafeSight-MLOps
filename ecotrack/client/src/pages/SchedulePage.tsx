// src/pages/SchedulePage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Calendar, Plus, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { scheduleApi } from '@/lib/api';
import useStore from '@/store/useStore';
import type { Schedule } from '@/types';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const FREQ_C: Record<string,string> = { daily:'#22c55e', alternate:'#0d9488', weekly:'#6366f1', biweekly:'#f59e0b' };
const ZONES  = ['Zone A - North','Zone B - South','Zone C - East','Zone D - West','Zone E - Central'];
const TYPES  = ['organic','recyclable','hazardous','e-waste','general'];
const FREQS  = ['daily','alternate','weekly','biweekly'];

function ScheduleCard({ sch, onDelete }: { sch: Schedule; onDelete: (id:string) => void }) {
  const col = FREQ_C[sch.frequency] ?? '#22c55e';
  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:.95 }}
                className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-bold text-green-900" style={{ fontSize:'0.9rem' }}>{sch.zone}</div>
          <div className="font-mono text-slate-400" style={{ fontSize:'0.65rem', marginTop:1 }}>{sch.scheduleId}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge" style={{ background:`${col}15`, color:col, border:`1px solid ${col}35`, fontSize:'0.65rem', textTransform:'capitalize' }}>
            {sch.frequency}
          </span>
          <div className="flex items-center gap-1.5">
            {sch.isActive
              ? <div className="dot-green w-2 h-2"/>
              : <div className="dot-grey w-2 h-2"/>
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-small mb-3">
        <div>
          <div className="kpi-label mb-0.5">Vehicle</div>
          <div className="font-mono font-bold text-green-700">{sch.vehicleId ?? '—'}</div>
        </div>
        <div>
          <div className="kpi-label mb-0.5">Waste Type</div>
          <div className="font-mono capitalize text-slate-600">{sch.wasteType ?? '—'}</div>
        </div>
        <div>
          <div className="kpi-label mb-0.5">Time Slot</div>
          <div className="font-mono text-slate-600">{sch.timeSlot ?? '—'}</div>
        </div>
        <div>
          <div className="kpi-label mb-0.5">Next Pickup</div>
          <div className="font-mono text-green-700" style={{ fontSize:'0.75rem' }}>
            {sch.nextPickup ? new Date(sch.nextPickup).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : '—'}
          </div>
        </div>
      </div>

      {/* Day chips */}
      <div className="flex gap-1 flex-wrap mb-3">
        {DAYS.map((d,i) => (
          <div key={d} className="w-7 h-7 rounded-lg flex items-center justify-center font-mono"
               style={{
                 fontSize:'0.6rem', fontWeight:700,
                 background: sch.dayOfWeek?.includes(i) ? col : '#f1f5f9',
                 color:       sch.dayOfWeek?.includes(i) ? '#fff' : '#94a3b8',
               }}>
            {d.slice(0,1)}
          </div>
        ))}
      </div>

      <button onClick={() => onDelete(sch._id)}
              className="font-mono text-red-400 hover:text-red-600 transition-colors flex items-center gap-1.5"
              style={{ fontSize:'0.7rem' }}>
        <Trash2 size={11}/> Delete
      </button>
    </motion.div>
  );
}

export default function SchedulePage() {
  const ref       = useRef<HTMLDivElement>(null);
  const [scheds,  setScheds]   = useState<Schedule[]>([]);
  const [loading, setLoading]  = useState(false);
  const [showForm,setShowForm] = useState(false);
  const [form, setForm]        = useState({
    zone:'Zone A - North', vehicleId:'VH-001', wasteType:'organic',
    frequency:'weekly', timeSlot:'08:00', dayOfWeek:[] as number[], isActive:true,
  });
  const { addToast } = useStore();

  async function load() {
    setLoading(true);
    try { const r = await scheduleApi.list(); setScheds(r.data.data); } catch {}
    finally { setLoading(false); }
  }

  async function createSchedule(e: React.FormEvent) {
    e.preventDefault();
    try {
      await scheduleApi.create({ ...form, nextPickup: new Date().toISOString() });
      addToast('success', `Schedule created for ${form.zone}`);
      setShowForm(false); load();
    } catch { addToast('error','Failed to create schedule'); }
  }

  async function deleteSchedule(id: string) {
    try { await scheduleApi.remove(id); addToast('success','Schedule removed'); load(); } catch {}
  }

  function toggleDay(d: number) {
    setForm(f => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(d) ? f.dayOfWeek.filter(x=>x!==d) : [...f.dayOfWeek,d],
    }));
  }

  useEffect(() => {
    load();
    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.sched-card', { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, stagger: 0.05, duration: 0.45, ease: 'power3.out' });
      }, ref.current);
      return () => ctx.revert();
    }
  }, []);

  const active = scheds.filter(s=>s.isActive).length;

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Collection Schedule</h1>
          <p className="text-small text-slate-500 mt-0.5">{active} active · {scheds.length} total schedules</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
          <button onClick={() => setShowForm(v=>!v)} className="btn-green">
            <Plus size={14}/>{showForm ? 'Cancel' : 'New Schedule'}
          </button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-14 }}
                      className="card p-6">
            <div className="section-heading mb-4">Create New Schedule</div>
            <form onSubmit={createSchedule} className="grid grid-cols-3 gap-4">
              <div>
                <label className="section-heading block mb-1">Zone</label>
                <select className="select" value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})}>
                  {ZONES.map(z=><option key={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label className="section-heading block mb-1">Vehicle ID</label>
                <input className="input" value={form.vehicleId} onChange={e=>setForm({...form,vehicleId:e.target.value})}/>
              </div>
              <div>
                <label className="section-heading block mb-1">Waste Type</label>
                <select className="select" value={form.wasteType} onChange={e=>setForm({...form,wasteType:e.target.value})}>
                  {TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="section-heading block mb-1">Frequency</label>
                <select className="select" value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}>
                  {FREQS.map(f=><option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="section-heading block mb-1">Time Slot</label>
                <input type="time" className="input" value={form.timeSlot} onChange={e=>setForm({...form,timeSlot:e.target.value})}/>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn-green flex-1 justify-center">
                  <CheckCircle size={13}/> Create
                </button>
              </div>
              <div className="col-span-3">
                <label className="section-heading block mb-2">Pickup Days</label>
                <div className="flex gap-2">
                  {DAYS.map((d,i)=>(
                    <button type="button" key={d} onClick={()=>toggleDay(i)}
                            className="w-10 h-10 rounded-xl font-mono font-bold transition-all"
                            style={{
                              fontSize:'0.75rem',
                              background:form.dayOfWeek.includes(i)?'#22c55e':'#f1f5f9',
                              color:form.dayOfWeek.includes(i)?'#fff':'#94a3b8',
                              border:`1.5px solid ${form.dayOfWeek.includes(i)?'#16a34a':'#e2e8f0'}`,
                            }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedule cards */}
      <div className="grid grid-cols-3 gap-5">
        <AnimatePresence>
          {scheds.map(s => (
            <div key={s.scheduleId} className="sched-card">
              <ScheduleCard sch={s} onDelete={deleteSchedule}/>
            </div>
          ))}
        </AnimatePresence>
        {!loading && scheds.length===0 && (
          <div className="col-span-3 text-center py-16 text-small text-slate-400">No schedules found</div>
        )}
      </div>
    </div>
  );
}
