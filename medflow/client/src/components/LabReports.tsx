// src/components/LabReports.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, ExternalLink, Loader } from 'lucide-react';
import { labApi } from '@/lib/api';
import useStore from '@/store/useStore';
import type { LabReport, LabReportValue } from '@/types';

const TYPE_ICONS: Record<string, string> = {
  blood:'🩸', urine:'🧪', ecg:'⚡', xray:'🔬', mri:'🧠',
  ct:'💊', ultrasound:'📡', pathology:'🔭', other:'📄',
};

const FLAG_COLORS: Record<string, string> = {
  normal:'#a0a0a0', low:'#00d4ff', high:'#ffaa00', critical:'#FF0000',
};

function ValueRow({ v }: { v: LabReportValue }) {
  const isBad = v.flag === 'high' || v.flag === 'low' || v.flag === 'critical';
  return (
    <tr>
      <td className="py-1.5 pr-3 font-mono" style={{ fontSize:10.5, color:'rgba(200,200,200,0.85)' }}>
        {v.label}
      </td>
      <td className="py-1.5 pr-3 font-mono font-bold text-right" style={{ fontSize:11, color: FLAG_COLORS[v.flag] }}>
        {String(v.value)}
      </td>
      <td className="py-1.5 pr-3 font-mono" style={{ fontSize:9, color:'rgba(100,100,100,0.8)' }}>
        {v.unit}
      </td>
      <td className="py-1.5 pr-2">
        <span className="font-mono px-1.5 py-0.5 rounded" style={{
          fontSize:8, letterSpacing:'0.1em',
          color: FLAG_COLORS[v.flag],
          background: `${FLAG_COLORS[v.flag]}15`,
          border: `1px solid ${FLAG_COLORS[v.flag]}30`,
        }}>
          {v.flag.toUpperCase()}
        </span>
      </td>
      <td className="py-1.5 text-right font-mono" style={{ fontSize:9, color:'rgba(80,80,80,0.8)' }}>
        {v.normalMin !== undefined ? `${v.normalMin}–${v.normalMax}` : '—'}
      </td>
    </tr>
  );
}

function ReportCard({ report }: { report: LabReport }) {
  const [expanded, setExpanded] = useState(false);
  const hasValues = report.values?.length > 0;
  const hasFlagged = report.values?.some(v => v.flag !== 'normal');
  const isFlagged = report.status === 'flagged';

  return (
    <motion.div
      layout
      className={`glass rounded-lg overflow-hidden ${isFlagged ? 'alert-warning' : ''}`}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ fontSize:18, lineHeight:1, marginTop:1 }}>
          {TYPE_ICONS[report.type] ?? '📄'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-mono font-bold text-white truncate" style={{ fontSize:11 }}>
              {report.title}
            </p>
            {isFlagged && (
              <AlertTriangle size={11} className="text-amber flex-shrink-0" />
            )}
            {!isFlagged && report.status === 'completed' && (
              <CheckCircle size={10} className="text-green flex-shrink-0 opacity-50" />
            )}
          </div>
          <p className="font-mono text-grey-400 truncate" style={{ fontSize:9 }}>
            {report.reportedBy ?? '—'} · {new Date(report.reportedAt).toLocaleDateString('en-IN')}
          </p>
          {report.summary && (
            <p className="text-grey-300 mt-1 line-clamp-1" style={{ fontSize:10, lineHeight:1.4 }}>
              {report.summary}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {report.fileUrl && (
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-grey-400 hover:text-cyan transition-colors"
            >
              <ExternalLink size={12} />
            </a>
          )}
          {expanded ? <ChevronUp size={12} className="text-grey-400" /> : <ChevronDown size={12} className="text-grey-400" />}
        </div>
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0 }}
            animate={{ height:'auto' }}
            exit={{ height:0 }}
            transition={{ duration:0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
              {report.findings && (
                <p className="text-grey-300 pt-2 mb-2" style={{ fontSize:10.5, lineHeight:1.5 }}>
                  {report.findings}
                </p>
              )}
              {hasValues && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full" style={{ borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                        {['Parameter','Value','Unit','Flag','Reference'].map(h => (
                          <th key={h} className="pb-1.5 text-left font-mono text-grey-400"
                              style={{ fontSize:8, letterSpacing:'0.1em' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderTop:'1px solid transparent' }}>
                      {report.values.map((v,i) => <ValueRow key={i} v={v} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── UPLOAD FORM ──────────────────────────────────────────────
function UploadForm({
  patientId,
  onSuccess,
}: { patientId: string; onSuccess: () => void }) {
  const [title,    setTitle]    = useState('');
  const [type,     setType]     = useState('blood');
  const [summary,  setSummary]  = useState('');
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { addToast } = useStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('patientId', patientId);
      fd.append('title', title);
      fd.append('type', type);
      fd.append('summary', summary);
      fd.append('status', 'completed');
      if (file) fd.append('file', file);
      await labApi.create(fd);
      addToast({ type:'success', message:'Lab report uploaded', duration:3000 });
      onSuccess();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      className="glass rounded-lg p-4 space-y-3"
    >
      <p className="section-label">Upload Lab Report</p>

      <div>
        <label className="section-label block mb-1">Title</label>
        <input type="text" value={title} onChange={e=>setTitle(e.target.value)}
               className="input-dark" placeholder="e.g. Complete Blood Count" required />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="section-label block mb-1">Type</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="input-dark">
            {['blood','urine','ecg','xray','mri','ct','ultrasound','pathology','other'].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="section-label block mb-1">File (PDF/IMG)</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                 onChange={e => setFile(e.target.files?.[0] ?? null)}
                 className="input-dark text-xs" style={{paddingTop:6}} />
        </div>
      </div>

      <div>
        <label className="section-label block mb-1">Summary</label>
        <textarea value={summary} onChange={e=>setSummary(e.target.value)}
                  className="input-dark resize-none" rows={2}
                  placeholder="Brief summary of findings…" />
      </div>

      {error && <p className="font-mono text-red text-xs">{error}</p>}

      <button type="submit" disabled={loading}
              className="btn-cyan w-full justify-center py-2">
        {loading
          ? <><Loader size={12} className="animate-spin" /> Uploading…</>
          : <><Upload size={12} /> Upload Report</>
        }
      </button>
    </motion.form>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function LabReports({ patientId }: { patientId: string }) {
  const [reports,     setReports]     = useState<LabReport[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [showUpload,  setShowUpload]  = useState(false);
  const [filterType,  setFilterType]  = useState('all');

  async function fetch() {
    setLoading(true);
    try {
      const res = await labApi.list(patientId);
      setReports(res.data.data);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { if (patientId) fetch(); }, [patientId]);

  const filtered = filterType === 'all'
    ? reports
    : reports.filter(r => r.type === filterType);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-cyan" />
          <span className="section-label">Lab Reports</span>
          <span className="badge-muted">{reports.length}</span>
        </div>
        <button
          onClick={() => setShowUpload(v => !v)}
          className={showUpload ? 'btn-ghost text-xs px-3 py-1.5' : 'btn-cyan text-xs px-3 py-1.5'}
        >
          <Upload size={11} /> {showUpload ? 'Cancel' : 'Upload'}
        </button>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showUpload && (
          <UploadForm
            patientId={patientId}
            onSuccess={() => { setShowUpload(false); fetch(); }}
          />
        )}
      </AnimatePresence>

      {/* Type filter */}
      <div className="flex gap-1 flex-wrap flex-shrink-0">
        {['all','blood','ecg','xray','mri','urine','other'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`font-mono px-2 py-0.5 rounded text-xs capitalize border transition-all ${
              filterType===t ? 'border-cyan/35 text-cyan bg-cyan/5' : 'border-border text-grey-400 hover:text-white'
            }`}
            style={{ fontSize:8.5, letterSpacing:'0.1em' }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Report list */}
      <div className="flex-1 overflow-y-auto scrollbar-dark space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <Loader size={16} className="animate-spin text-grey-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <FileText size={20} className="text-grey-400 opacity-40" />
            <span className="font-mono text-grey-400" style={{fontSize:9}}>NO REPORTS FOUND</span>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map(r => <ReportCard key={r._id} report={r} />)}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
