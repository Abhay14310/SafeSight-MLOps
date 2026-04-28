// src/pages/RoutesPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Route, Plus, RefreshCw, CheckCircle, Clock, XCircle, Play } from 'lucide-react';
import { routeApi } from '@/lib/api';
import useStore from '@/store/useStore';
import type { Route as IRoute, RouteStatus } from '@/types';

const ST_META: Record<RouteStatus, { color: string; icon: React.ReactNode; label: string }> = {
  planned:   { color: '#0d9488', icon: <Clock size={13}/>,       label: 'Planned'   },
  active:    { color: '#22c55e', icon: <Play size={13}/>,        label: 'Active'    },
  completed: { color: '#6366f1', icon: <CheckCircle size={13}/>, label: 'Completed' },
  cancelled: { color: '#ef4444', icon: <XCircle size={13}/>,     label: 'Cancelled' },
};

function RouteCard({ route }: { route: IRoute }) {
  const meta = ST_META[route.status];
  return (
    <motion.div layout initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                className="card p-5 hover:shadow-card-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-bold text-green-900" style={{ fontSize:'0.95rem' }}>{route.name}</div>
          <div className="font-mono text-slate-400" style={{ fontSize:'0.7rem', marginTop:2 }}>{route.routeId}</div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
             style={{ background:`${meta.color}15`, border:`1px solid ${meta.color}35` }}>
          <span style={{ color: meta.color }}>{meta.icon}</span>
          <span className="font-mono font-bold" style={{ color: meta.color, fontSize:'0.7rem', letterSpacing:'0.08em' }}>
            {meta.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-small mb-4">
        <div>
          <div className="kpi-label mb-0.5">Zone</div>
          <div className="font-medium text-slate-700">{route.zone ?? '—'}</div>
        </div>
        <div>
          <div className="kpi-label mb-0.5">Vehicle</div>
          <div className="font-mono font-bold text-green-700">{route.vehicleId ?? '—'}</div>
        </div>
        <div>
          <div className="kpi-label mb-0.5">Distance</div>
          <div className="font-mono text-slate-600">{route.distanceKm ?? '—'} km</div>
        </div>
        <div>
          <div className="kpi-label mb-0.5">Est. Time</div>
          <div className="font-mono text-slate-600">{route.estimatedMin ?? '—'} min</div>
        </div>
      </div>

      {route.totalWeightKg && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
             style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.2)' }}>
          <div className="font-mono font-bold text-green-700" style={{ fontSize:'0.875rem' }}>
            {(route.totalWeightKg ?? 0).toLocaleString('en-IN')} kg
          </div>
          <div className="text-green-600 text-small">total collected</div>
        </div>
      )}

      {route.scheduledAt && (
        <div className="mt-3 text-slate-400 font-mono" style={{ fontSize:'0.7rem' }}>
          Scheduled: {new Date(route.scheduledAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:false })}
          {route.completedAt && ` → Completed: ${new Date(route.completedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit', hour12:false })}`}
        </div>
      )}
    </motion.div>
  );
}

export default function RoutesPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [routes, setRoutes] = useState<IRoute[]>([]);
  const [filter, setFilter] = useState<RouteStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await routeApi.list(); setRoutes(r.data.data); } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (ref.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo('.route-card', { opacity: 0, x: 12 }, { opacity: 1, x: 0, stagger: 0.08, duration: 0.45, ease: 'power3.out' });
      }, ref.current);
      return () => ctx.revert();
    }
  }, []);

  const filtered = filter === 'all' ? routes : routes.filter(r => r.status === filter);
  const counts   = { active:routes.filter(r=>r.status==='active').length, planned:routes.filter(r=>r.status==='planned').length, completed:routes.filter(r=>r.status==='completed').length };

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="route-header flex items-center justify-between">
        <div>
          <h1 className="page-title text-green-900">Collection Routes</h1>
          <p className="text-small text-slate-500 mt-0.5">Route planning and tracking · {routes.length} routes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost"><RefreshCw size={13} className={loading?'animate-spin':''}/></button>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'Active Routes',    val:counts.active,    color:'#22c55e' },
          { label:'Planned',          val:counts.planned,   color:'#0d9488' },
          { label:'Completed Today',  val:counts.completed, color:'#6366f1' },
          { label:'Total',            val:routes.length,    color:'#94a3b8' },
        ].map(k => (
          <div key={k.label} className="card px-4 py-3">
            <div className="kpi-label mb-1">{k.label}</div>
            <div className="font-mono font-bold" style={{ fontSize:'1.75rem', color:k.color, lineHeight:1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all','active','planned','completed','cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className="font-mono capitalize px-3 py-1.5 rounded-lg border transition-all"
                  style={{
                    fontSize:'0.75rem',
                    borderColor: filter===f ? '#22c55e' : '#e2e8f0',
                    color:       filter===f ? '#166534' : '#64748b',
                    background:  filter===f ? 'rgba(34,197,94,0.08)' : 'transparent',
                  }}>
            {f}
          </button>
        ))}
      </div>

      {/* Routes grid */}
      <div className="grid grid-cols-2 gap-5">
        {filtered.map(r => (
          <div key={r.routeId} className="route-card">
            <RouteCard route={r} />
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-small text-slate-400">No routes found</div>
        )}
      </div>
    </div>
  );
}
