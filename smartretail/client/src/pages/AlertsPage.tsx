// src/pages/AlertsPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { AlertTriangle, CheckCheck, Bell, Filter, RefreshCw } from 'lucide-react';
import useStore from '@/store/useStore';
import { alertApi } from '@/lib/api';
import type { Alert, AlertSeverity } from '@/types';

const SEV_META: Record<AlertSeverity, { bg: string; border: string; color: string; badge: string }> = {
  critical: { bg: 'rgba(220,38,38,0.05)', border: '#dc2626', color: '#dc2626', badge: 'badge-danger' },
  warning: { bg: 'rgba(217,119,6,0.05)', border: '#d97706', color: '#d97706', badge: 'badge-warn' },
  info: { bg: 'rgba(1,69,242,0.04)', border: '#0145f2', color: '#0145f2', badge: 'badge-navy' },
};

const TYPE_LABELS: Record<string, string> = {
  SHRINKAGE: 'Shrinkage Detected', LOW_STOCK: 'Low Stock Alert',
  CROWDING: 'Zone Crowding', CAMERA_DOWN: 'Camera Offline',
  PRICE_ANOMALY: 'Price Anomaly', FOOTFALL_SPIKE: 'Footfall Spike', SYSTEM: 'System',
};

function timeSince(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function AlertRow({ alert, onAck }: { alert: Alert; onAck: (id: string) => void }) {
  const m = SEV_META[alert.severity] ?? SEV_META.info;
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: m.bg, border: `1px solid ${m.border}40` }}
    >
      <div className="flex gap-3 p-4">
        <div className="w-0.5 self-stretch rounded-full flex-shrink-0"
          style={{ background: m.border }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <motion.div animate={alert.severity === 'critical' ? { opacity: [1, 0.3, 1] } : {}}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="font-mono font-bold" style={{ fontSize: 10, letterSpacing: '0.1em', color: m.color }}>
                {TYPE_LABELS[alert.type] ?? alert.type.replace(/_/g, ' ')}
              </motion.div>
              {alert.zone && <span className="badge-muted" style={{ fontSize: 8 }}>{alert.zone}</span>}
              {alert.acknowledged && <span className="badge-success" style={{ fontSize: 8 }}>✓ ACK</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-slate-400" style={{ fontSize: 9 }}>{timeSince(alert.createdAt)}</span>
              {!alert.acknowledged && (
                <button onClick={() => onAck(alert._id)}
                        className="font-mono text-xs px-2 py-0.5 rounded border transition-all"
                        style={{ color:m.color, borderColor:`${m.color}40`, background:'transparent', cursor:'pointer' }}>
                  ACK
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-slate-600" style={{ fontFamily:'Inter', lineHeight:1.4 }}>{alert.message}</p>
          <p className="font-mono text-xs text-slate-400 mt-1">
            {new Date(alert.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}
            {alert.source ? ` · ${alert.source}` : ''}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AlertsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { alerts, setAlerts, ackAlert } = useStore();
  const [filter, setFilter] = useState<'all' | AlertSeverity | 'unacked'>('all');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await alertApi.list({ limit: '80' }); setAlerts(r.data.data); } catch { }
    finally { setLoading(false); }
  }

  async function handleAck(id: string) {
    try { await alertApi.ack(id); ackAlert(id); } catch { }
  }

  useEffect(() => { load(); }, []);

  const filtered = alerts.filter(a => {
    if (filter === 'unacked') return !a.acknowledged && !a.resolved;
    if (filter !== 'all') return a.severity === filter;
    return !a.resolved;
  });

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.resolved).length,
    info: alerts.filter(a => a.severity === 'info' && !a.resolved).length,
    unacked: alerts.filter(a => !a.acknowledged && !a.resolved).length,
  };

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize: 18, letterSpacing: '0.05em' }}>Alert Centre</h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">Real-time alerts · AI + vitals engine</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Critical', val: counts.critical, color: '#dc2626' },
          { label: 'Warning', val: counts.warning, color: '#d97706' },
          { label: 'Info', val: counts.info, color: '#0145f2' },
          { label: 'Unacknowledged', val: counts.unacked, color: '#7c3aed' },
        ].map(k => (
          <div key={k.label} className="card px-4 py-3">
            <div className="section-label mb-1" style={{ fontSize: 8 }}>{k.label}</div>
            <div className="font-mono font-bold text-2xl" style={{ color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5">
        {([['all', 'All'], ['unacked', 'Unacknowledged'], ['critical', 'Critical'], ['warning', 'Warning'], ['info', 'Info']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key as any)}
            className="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: filter === key ? '#0145f2' : '#e2e8f0',
              color: filter === key ? '#0145f2' : '#64748b',
              background: filter === key ? 'rgba(1,69,242,0.07)' : 'transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map(a => (
            <AlertRow key={a._id} alert={a} onAck={handleAck} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCheck size={20} color="#16a34a" />
            </div>
            <p className="font-mono text-xs text-slate-400">No alerts matching this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
