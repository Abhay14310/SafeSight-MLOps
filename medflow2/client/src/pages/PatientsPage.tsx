// src/pages/PatientsPage.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  Users, Plus, Search, X, Edit2, LogOut, RefreshCw,
  Heart, Activity, Thermometer, Droplets, ChevronDown,
  User, Phone, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';

const API = (import.meta.env.VITE_API_URL || '') + '/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('mf2_token')}` });

/* ── Types ─────────────────────────────────────────────────── */
interface Baseline { hr:number; spo2:number; resp:number; sbp:number; dbp:number; temp:number; }
interface Patient {
  _id: string;
  bedId: string; name: string; age: number; gender: 'M'|'F'|'Other';
  diagnosis: string; ward: string; admittedAt: string;
  status: 'stable'|'warning'|'critical'|'discharged';
  nurseAssigned: string; morseScore: number;
  allergies: string[]; bloodType: string; weight: number; height: number;
  baseline: Baseline;
}

const EMPTY_FORM = {
  bedId:'', name:'', age:'', gender:'M' as 'M'|'F'|'Other',
  diagnosis:'', ward:'ICU-4A', nurseAssigned:'',
  bloodType:'', weight:'', height:'', morseScore:'0',
  allergies:'', status:'stable' as Patient['status'],
  baseline:{ hr:'75', spo2:'98', resp:'16', sbp:'120', dbp:'80', temp:'37.0' },
};

const STATUS_META: Record<string,{label:string;cls:string;dot:string}> = {
  stable:    { label:'Stable',    cls:'badge-green',  dot:'dot-green'  },
  warning:   { label:'Warning',   cls:'badge-yellow', dot:'dot-yellow' },
  critical:  { label:'Critical',  cls:'badge-red',    dot:'dot-red'    },
  discharged:{ label:'Discharged',cls:'badge-muted',  dot:'dot-grey'   },
};

const WARDS  = ['ICU-4A','ICU-4B','Ward-5','Ward-6','CCU','NICU','Emergency','Step-Down'];
const BLOODS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

/**
 * Render the patient registry page with patient list, search and status filters, KPI cards, and admit/edit modal.
 *
 * The page loads patients from the API, supports refresh, admit/edit flows (modal form), and discharge actions with confirmation. It shows loading skeletons, computes status and Morse risk indicators, and uses GSAP and Framer Motion for entry and modal animations.
 *
 * @returns The PatientsPage React element
 */
export default function PatientsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { addToast } = (useStore as any)();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]  = useState<Patient|null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [discharging, setDischarging] = useState<string|null>(null);

  /* GSAP entrance */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.pt-card', { opacity:0, y:16 }, { opacity:1, y:0, stagger:0.06, duration:0.5, ease:'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [patients]);

  /* Fetch */
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/patients?status=all`, { headers: authHeaders() });
      setPatients(data.data ?? []);
    } catch { addToast?.('error','Failed to load patients'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  /* Filter */
  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.bedId.toLowerCase().includes(q) || p.diagnosis?.toLowerCase().includes(q);
    const matchS = filterStatus === 'all' || p.status === filterStatus;
    return matchQ && matchS;
  });

  /**
   * Open the admit-patient modal and initialize the form for creating a new patient.
   *
   * Clears any current editing context, resets the form to default values, and shows the modal.
   */
  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  /**
   * Open the patient edit modal and populate the form with the provided patient's data.
   *
   * @param p - The patient whose values will prefill the edit form and be set as the active editing target
   */
  function openEdit(p: Patient) {
    setEditing(p);
    setForm({
      bedId: p.bedId, name: p.name, age: String(p.age||''),
      gender: p.gender||'M', diagnosis: p.diagnosis||'',
      ward: p.ward||'ICU-4A', nurseAssigned: p.nurseAssigned||'',
      bloodType: p.bloodType||'', weight: String(p.weight||''),
      height: String(p.height||''), morseScore: String(p.morseScore||0),
      allergies: (p.allergies||[]).join(', '), status: p.status,
      baseline: {
        hr: String(p.baseline?.hr||75), spo2: String(p.baseline?.spo2||98),
        resp: String(p.baseline?.resp||16), sbp: String(p.baseline?.sbp||120),
        dbp: String(p.baseline?.dbp||80), temp: String(p.baseline?.temp||37),
      },
    });
    setShowModal(true);
  }

  /**
   * Create or update a patient record from the modal form and refresh the patient list.
   *
   * Validates required fields (bed ID and name), builds a normalized payload from the form
   * (converting numeric fields and parsing allergies/baseline vitals), then sends it to the
   * backend to either update the current patient or admit a new one. Shows success or error
   * toasts, closes the modal on success, and ensures the saving state is cleared after completion.
   *
   * @param e - The form submission event
   */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bedId || !form.name) { addToast?.('warning','Bed ID and Name are required'); return; }
    setSaving(true);
    try {
      const payload = {
        bedId: form.bedId.trim().toUpperCase(),
        name: form.name.trim(), age: Number(form.age)||0,
        gender: form.gender, diagnosis: form.diagnosis,
        ward: form.ward, nurseAssigned: form.nurseAssigned,
        bloodType: form.bloodType, weight: Number(form.weight)||0,
        height: Number(form.height)||0, morseScore: Number(form.morseScore)||0,
        status: form.status,
        allergies: form.allergies ? form.allergies.split(',').map(s=>s.trim()).filter(Boolean) : [],
        baseline: {
          hr: Number(form.baseline.hr), spo2: Number(form.baseline.spo2),
          resp: Number(form.baseline.resp), sbp: Number(form.baseline.sbp),
          dbp: Number(form.baseline.dbp), temp: parseFloat(form.baseline.temp),
        },
      };
      if (editing) {
        await axios.patch(`${API}/patients/${editing._id}`, payload, { headers: authHeaders() });
        addToast?.('success', `Patient ${form.name} updated`);
      } else {
        await axios.post(`${API}/patients`, payload, { headers: authHeaders() });
        addToast?.('success', `Patient ${form.name} admitted`);
      }
      setShowModal(false);
      fetchPatients();
    } catch (err: any) {
      addToast?.('error', err?.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  /**
   * Prompt the user to confirm and, if confirmed, discharge the specified patient via the API and update UI state.
   *
   * Prompts with a confirmation dialog; if confirmed, sets the discharge-in-progress state for the patient, sends a DELETE request to remove the patient, shows a success or error toast depending on the outcome, refreshes the patient list on success, and always clears the discharge-in-progress state when finished.
   *
   * @param p - The patient to discharge (used for confirmation text, API id, and toast messaging)
   */
  async function discharge(p: Patient) {
    if (!confirm(`Discharge ${p.name} from ${p.bedId}?`)) return;
    setDischarging(p._id);
    try {
      await axios.delete(`${API}/patients/${p._id}`, { headers: authHeaders() });
      addToast?.('success', `${p.name} discharged`);
      fetchPatients();
    } catch { addToast?.('error','Discharge failed'); }
    finally { setDischarging(null); }
  }

  /**
 * Update a top-level field on the form state with a new string value.
 *
 * @param k - The form field name to set
 * @param v - The new string value for the field
 */
  function setF(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }
  /**
 * Update a single baseline vital field on the form model.
 *
 * @param k - Baseline field key to update (e.g., "hr", "spo2", "resp", "sbp", "dbp", "temp")
 * @param v - New string value for the specified baseline field
 */
function setBL(k: string, v: string) { setForm(f => ({ ...f, baseline: { ...f.baseline, [k]: v } })); }
  const counts = { total: patients.length, critical: patients.filter(p=>p.status==='critical').length, warning: patients.filter(p=>p.status==='warning').length, stable: patients.filter(p=>p.status==='stable').length };

  return (
    <div ref={ref} className="p-6 space-y-5 relative z-10" style={{ overflowY:'auto', height:'100%' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans font-bold text-white" style={{ fontSize:'1.5rem', letterSpacing:'-0.01em' }}>Patient Registry</h1>
          <p className="section-label mt-0.5">Active admissions · {counts.total} patients</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPatients} className="btn-ghost" title="Refresh"><RefreshCw size={13}/></button>
          <button onClick={openAdd} className="btn-green"><Plus size={14}/> Admit Patient</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total Patients', val:counts.total,    icon:<Users size={16}/>,          color:'#71E07E' },
          { label:'Critical',       val:counts.critical, icon:<AlertTriangle size={16}/>,   color:'#EF4444' },
          { label:'Warning',        val:counts.warning,  icon:<Activity size={16}/>,         color:'#F59E0B' },
          { label:'Stable',         val:counts.stable,   icon:<ShieldCheck size={16}/>,      color:'#71E07E' },
        ].map(k => (
          <div key={k.label} className="glass p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background:`${k.color}18` }}>
              <span style={{ color:k.color }}>{k.icon}</span>
            </div>
            <div>
              <div className="font-mono font-bold text-white" style={{ fontSize:'1.4rem', lineHeight:1 }}>{k.val}</div>
              <div className="section-label mt-0.5">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'rgba(255,255,255,0.35)' }}/>
          <input className="mf-input pl-9" placeholder="Search name, bed ID, diagnosis…"
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['all','stable','warning','critical','discharged'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
                  className="font-sans font-semibold px-3 py-1.5 rounded-lg text-xs capitalize transition-all duration-150"
                  style={{
                    background: filterStatus === s ? 'rgba(113,224,126,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${filterStatus === s ? 'rgba(113,224,126,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: filterStatus === s ? '#71E07E' : 'rgba(255,255,255,0.55)',
                  }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(113,224,126,0.1)' }}>
                {['Bed / Patient','Age · Gender · Blood','Diagnosis','Ward','Morse Risk','Status','Actions'].map(h => (
                  <th key={h} className="section-label px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    {[...Array(7)].map((_,j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background:'rgba(255,255,255,0.07)', width: j===0?'140px':'80px' }}/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center" style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem' }}>
                  No patients found
                </td></tr>
              ) : filtered.map(p => {
                const sm = STATUS_META[p.status] ?? STATUS_META.stable;
                const morseColor = p.morseScore >= 45 ? '#EF4444' : p.morseScore >= 25 ? '#F59E0B' : '#71E07E';
                return (
                  <tr key={p._id} className="pt-card transition-colors duration-150"
                      style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white text-sm">{p.bedId}</div>
                      <div className="font-sans text-sm mt-0.5" style={{ color:'rgba(255,255,255,0.75)' }}>{p.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-sans text-sm text-white">{p.age}y · {p.gender}</div>
                      {p.bloodType && <div className="font-mono text-xs mt-0.5" style={{ color:'#EF4444' }}>{p.bloodType}</div>}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-sans text-sm" style={{ color:'rgba(255,255,255,0.75)' }}>{p.diagnosis || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs" style={{ color:'rgba(186,95,255,0.9)' }}>{p.ward}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-sm" style={{ color:morseColor }}>{p.morseScore}</div>
                      <div className="font-sans text-xs mt-0.5" style={{ color:'rgba(255,255,255,0.35)' }}>
                        {p.morseScore>=45?'High Risk':p.morseScore>=25?'Med Risk':'Low Risk'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={sm.cls}>
                        <span className={`${sm.dot} mr-1.5 inline-block`} style={{ width:'6px', height:'6px', borderRadius:'50%', background: sm.dot.includes('green')?'#71E07E':sm.dot.includes('yellow')?'#F59E0B':sm.dot.includes('red')?'#EF4444':'rgba(255,255,255,0.3)' }}/>
                        {sm.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(p)} className="btn-ghost py-1 px-2" title="Edit">
                          <Edit2 size={12}/>
                        </button>
                        {p.status !== 'discharged' && (
                          <button onClick={() => discharge(p)} disabled={discharging===p._id}
                                  className="btn-ghost py-1 px-2" title="Discharge"
                                  style={{ borderColor:'rgba(239,68,68,0.25)', color:'rgba(239,68,68,0.7)' }}>
                            <LogOut size={12}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4"
                      style={{ background:'rgba(5,14,32,0.75)', backdropFilter:'blur(8px)' }}>
            <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9, y:20 }}
                        className="glass-dark w-full max-w-2xl rounded-2xl overflow-hidden"
                        style={{ border:'1px solid rgba(113,224,126,0.2)', maxHeight:'90vh', overflowY:'auto' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div className="font-sans font-bold text-white" style={{ fontSize:'1.05rem' }}>
                    {editing ? 'Edit Patient' : 'Admit New Patient'}
                  </div>
                  <div className="section-label mt-0.5">{editing ? `Updating ${editing.name}` : 'Fill in patient details'}</div>
                </div>
                <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5"><X size={16}/></button>
              </div>

              <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

                {/* Row 1 — Bed + Name + Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="section-label block mb-1.5">Bed ID *</label>
                    <input className="mf-input" placeholder="BED-01" required
                           value={form.bedId} onChange={e=>setF('bedId',e.target.value)} disabled={!!editing}/>
                  </div>
                  <div className="col-span-2">
                    <label className="section-label block mb-1.5">Full Name *</label>
                    <input className="mf-input" placeholder="Patient full name" required
                           value={form.name} onChange={e=>setF('name',e.target.value)}/>
                  </div>
                </div>

                {/* Row 2 — Age + Gender + Blood + Ward */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="section-label block mb-1.5">Age</label>
                    <input type="number" min="0" max="130" className="mf-input" placeholder="45"
                           value={form.age} onChange={e=>setF('age',e.target.value)}/>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Gender</label>
                    <select className="mf-input" value={form.gender} onChange={e=>setF('gender',e.target.value as any)}>
                      {['M','F','Other'].map(g=><option key={g} value={g}>{g==='M'?'Male':g==='F'?'Female':'Other'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Blood Type</label>
                    <select className="mf-input" value={form.bloodType} onChange={e=>setF('bloodType',e.target.value)}>
                      <option value="">Unknown</option>
                      {BLOODS.map(b=><option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Ward</label>
                    <select className="mf-input" value={form.ward} onChange={e=>setF('ward',e.target.value)}>
                      {WARDS.map(w=><option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Diagnosis + Nurse + Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="section-label block mb-1.5">Diagnosis / Condition</label>
                    <input className="mf-input" placeholder="e.g. Post-op cardiac surgery"
                           value={form.diagnosis} onChange={e=>setF('diagnosis',e.target.value)}/>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Status</label>
                    <select className="mf-input" value={form.status} onChange={e=>setF('status',e.target.value as any)}>
                      {['stable','warning','critical'].map(s=><option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                {/* Weight + Height + Morse + Nurse */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="section-label block mb-1.5">Weight (kg)</label>
                    <input type="number" className="mf-input" placeholder="70"
                           value={form.weight} onChange={e=>setF('weight',e.target.value)}/>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Height (cm)</label>
                    <input type="number" className="mf-input" placeholder="170"
                           value={form.height} onChange={e=>setF('height',e.target.value)}/>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Morse Score</label>
                    <input type="number" min="0" max="125" className="mf-input" placeholder="0"
                           value={form.morseScore} onChange={e=>setF('morseScore',e.target.value)}/>
                  </div>
                  <div>
                    <label className="section-label block mb-1.5">Nurse Assigned</label>
                    <input className="mf-input" placeholder="Nurse name"
                           value={form.nurseAssigned} onChange={e=>setF('nurseAssigned',e.target.value)}/>
                  </div>
                </div>

                {/* Baseline Vitals */}
                <div>
                  <div className="section-label mb-3 flex items-center gap-2">
                    <Heart size={12}/> Baseline Vitals
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {[
                      {k:'hr',   label:'HR (bpm)',  ph:'75'  },
                      {k:'spo2', label:'SpO₂ (%)',  ph:'98'  },
                      {k:'resp', label:'Resp/min',  ph:'16'  },
                      {k:'sbp',  label:'SBP mmHg',  ph:'120' },
                      {k:'dbp',  label:'DBP mmHg',  ph:'80'  },
                      {k:'temp', label:'Temp °C',   ph:'37.0'},
                    ].map(({k,label,ph}) => (
                      <div key={k}>
                        <label className="section-label block mb-1.5" style={{ fontSize:'0.6rem' }}>{label}</label>
                        <input type="number" step="0.1" className="mf-input" placeholder={ph}
                               value={(form.baseline as any)[k]} onChange={e=>setBL(k,e.target.value)}/>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <label className="section-label block mb-1.5">Allergies (comma-separated)</label>
                  <input className="mf-input" placeholder="Penicillin, Sulfa, Aspirin"
                         value={form.allergies} onChange={e=>setF('allergies',e.target.value)}/>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-green">
                    {saving
                      ? <><span className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin"/>Saving…</>
                      : editing ? 'Update Patient' : 'Admit Patient'
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
