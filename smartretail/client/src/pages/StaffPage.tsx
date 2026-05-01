// src/pages/StaffPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Users, RefreshCw, Clock } from 'lucide-react';
import { staffApi } from '@/lib/api';
import type { StaffMember } from '@/types';

const STATUS_C: Record<string,string> = { active:'#16a34a', break:'#d97706', off:'#94a3b8' };
const ROLE_B: Record<string,string>   = { cashier:'badge-navy', floor:'badge-muted', security:'badge-danger', supervisor:'badge-warn', manager:'badge-success' };

export default function StaffPage() {
  const ref   = useRef<HTMLDivElement>(null);
  const [staff, setStaff]   = useState<StaffMember[]>([]);
  const [loading,setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await staffApi.list(); setStaff(r.data.data); } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    const ctx = gsap.context(() => {
      gsap.fromTo('.staff-row', { opacity:0, x:-10 }, { opacity:1, x:0, stagger:0.06, duration:0.4, ease:'power3.out', delay:0.2 });
    }, ref);
    return () => ctx.revert();
  }, []);

  const active = staff.filter(s=>s.status==='active').length;
  const onBreak= staff.filter(s=>s.status==='break').length;

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>Staff Management</h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">Shift tracking · Zone assignments · MySQL</p>
        </div>
        <button onClick={load} className="btn-ghost"><RefreshCw size={12} className={loading?'animate-spin':''} /> Refresh</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'On Floor',  val:active,            color:'#16a34a' },
          { label:'On Break',  val:onBreak,           color:'#d97706' },
          { label:'Total Staff',val:staff.length,     color:'#0145f2' },
        ].map(k => (
          <div key={k.label} className="card px-4 py-3">
            <div className="section-label mb-1" style={{ fontSize:8 }}>{k.label}</div>
            <div className="font-mono font-bold text-2xl" style={{ color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead style={{ borderBottom:'1px solid #e2e8f0' }}>
            <tr className="table-head">
              <th className="text-left py-3 px-4">Staff</th>
              <th className="text-left py-3 px-3">Role</th>
              <th className="text-left py-3 px-3">Zone</th>
              <th className="text-left py-3 px-3">Shift</th>
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-left py-3 px-3">Clocked In</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s,i) => (
              <motion.tr key={s.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                         className="staff-row border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs"
                         style={{ background:'rgba(1,69,242,0.1)', color:'#0145f2' }}>
                      {s.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2)}
                    </div>
                    <div>
                      <div className="font-sans text-sm font-medium text-slate-800">{s.name}</div>
                      <div className="font-mono text-xs text-slate-400">{s.staff_id}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className={ROLE_B[s.role] ?? 'badge-muted'} style={{ fontSize:9 }}>
                    {s.role.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-3 font-sans text-sm text-slate-600">{s.zone}</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-500 capitalize">{s.shift}</td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_C[s.status] ?? '#94a3b8' }} />
                    <span className="font-mono text-xs capitalize" style={{ color: STATUS_C[s.status] }}>{s.status}</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  {s.clock_in ? (
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                      <Clock size={10} />
                      {new Date(s.clock_in).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false})}
                    </div>
                  ) : <span className="font-mono text-xs text-slate-300">—</span>}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {!loading && staff.length===0 && (
          <div className="text-center py-12 font-mono text-xs text-slate-400">No staff data available</div>
        )}
      </div>
    </div>
  );
}
