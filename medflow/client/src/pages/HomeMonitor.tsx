// src/pages/HomeMonitor.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  ArrowLeft, Activity, User, Bed, Phone,
  ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react';

import useStore from '@/store/useStore';
import { patientApi } from '@/lib/api';
import { useVitals, useGSAPEntrance } from '@/hooks/useVitals';

import VitalsPanel    from '@/components/VitalsPanel';
import AICamera       from '@/components/AICamera';
import ThreeBodyModel, { buildAlertZones } from '@/components/ThreeBodyModel';
import LabReports     from '@/components/LabReports';
import AlertPanel     from '@/components/AlertPanel';
import type { Patient, VitalsHistoryPoint } from '@/types';

const DarkTooltip = ({ active, payload, label }: { active?:boolean; payload?:unknown[]; label?:string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-2.5 py-2 rounded-md" style={{ fontSize:10 }}>
      <p className="font-mono text-grey-400 mb-1">{label}</p>
      {(payload as Array<{ name:string; value:number; color:string }>).map(p => (
        <p key={p.name} className="font-mono font-bold" style={{ color:p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function VitalsChart({ history, metric, color, label, unit }: {
  history: VitalsHistoryPoint[];
  metric:'bpm'|'spo2'|'systolic'|'temp'; color:string; label:string; unit:string;
}) {
  const data = history.slice(-40).map(h => ({
    time: new Date(h.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false}),
    val:  Number(h[metric]),
  }));
  return (
    <div className="glass rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="vital-label">{label}</span>
        <span className="font-mono font-bold" style={{fontSize:13,color}}>
          {data.length ? data[data.length-1].val.toFixed(unit==='°C'?1:0) : '—'}
          <span className="vital-unit ml-1">{unit}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <AreaChart data={data} margin={{top:4,right:4,left:-20,bottom:0}}>
          <defs>
            <linearGradient id={`g-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false}/>
          <XAxis dataKey="time" tick={{fontSize:8,fill:'rgba(255,255,255,0.25)',fontFamily:'Space Mono'}} tickLine={false} axisLine={false} interval={9}/>
          <YAxis tick={{fontSize:8,fill:'rgba(255,255,255,0.25)'}} tickLine={false} axisLine={false}/>
          <Tooltip content={<DarkTooltip />}/>
          <Area type="monotone" dataKey="val" name={label} stroke={color} strokeWidth={1.5}
                fill={`url(#g-${metric})`} dot={false} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PatientInfo({ patient }: { patient: Patient }) {
  const statusColor: Record<string,string> = { critical:'#FF0000', warning:'#ffaa00', stable:'#00ff88', discharged:'#505050' };
  const col = statusColor[patient.status] ?? '#a0a0a0';
  return (
    <div className="glass rounded-lg p-3 gsap-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-mono font-bold"
             style={{background:`${col}18`,border:`1px solid ${col}35`,color:col,fontSize:14}}>
          {patient.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h2 className="font-mono font-bold text-white" style={{fontSize:13}}>{patient.name}</h2>
            <span className="badge" style={{fontSize:7.5,background:`${col}15`,border:`1px solid ${col}35`,color:col,letterSpacing:'0.12em',padding:'2px 6px'}}>
              {patient.status.toUpperCase()}
            </span>
          </div>
          <p className="font-mono text-grey-400" style={{fontSize:9}}>
            {patient.mrn} · {patient.age}Y · {patient.gender} · {patient.bloodType}
          </p>
        </div>
      </div>
      <div className="divider-h my-2.5"/>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {[
          { icon:<Bed size={10}/>,      label:'Ward / Bed',  val:`${patient.ward} / ${patient.bed}` },
          { icon:<Activity size={10}/>, label:'Condition',   val:patient.condition },
          { icon:<User size={10}/>,     label:'Attending',   val:patient.attendingDoctor ?? '—' },
          { icon:<Phone size={10}/>,    label:'Emergency',   val:patient.emergencyContact?.name ?? '—' },
        ].map(row => (
          <div key={row.label} className="flex items-start gap-1.5">
            <span className="text-grey-400 mt-0.5 flex-shrink-0">{row.icon}</span>
            <div>
              <div className="vital-label" style={{fontSize:7.5}}>{row.label}</div>
              <div className="text-white" style={{fontSize:10}}>{row.val}</div>
            </div>
          </div>
        ))}
      </div>
      {patient.tags?.length > 0 && (
        <div className="flex gap-1 flex-wrap mt-2.5">
          {patient.tags.map(t => <span key={t} className="badge-muted" style={{fontSize:7.5,padding:'2px 6px'}}>{t}</span>)}
        </div>
      )}
    </div>
  );
}

type ActiveTab = 'vitals'|'ai'|'3d'|'labs'|'alerts';

export default function HomeMonitor() {
  const { patientId } = useParams<{ patientId:string }>();
  const navigate      = useNavigate();
  const containerRef  = useGSAPEntrance([patientId]);

  const { patients, selectedPatient, setSelected, alerts } = useStore();
  const [patient,   setPatient]   = useState<Patient | null>(selectedPatient);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vitals');
  const [wireframe, setWireframe] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const { latest: vitals, history } = useVitals(patient?._id);

  useEffect(() => {
    if (!patientId) {
      if (patients.length) { setPatient(patients[0]); setSelected(patients[0]); }
      return;
    }
    const found = patients.find(p => p._id === patientId);
    if (found) { setPatient(found); setSelected(found); return; }
    setLoading(true);
    patientApi.get(patientId)
      .then(r => { setPatient(r.data.data); setSelected(r.data.data); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [patientId, patients]);

  const patientAlerts = alerts.filter(a => {
    const pid = !a.patientId ? undefined : typeof a.patientId === 'string' ? a.patientId : (a.patientId as any)?._id;
    return pid === patient?._id;
  });

  const alertZones = buildAlertZones(
    vitals,
    patientAlerts.map(a => ({ type:a.type, severity:a.severity }))
  );

  const TABS: { key:ActiveTab; label:string }[] = [
    { key:'vitals', label:'Vitals' },
    { key:'ai',     label:'AI Cam' },
    { key:'3d',     label:'3D View' },
    { key:'labs',   label:'Lab Reports' },
    { key:'alerts', label:`Alerts${patientAlerts.filter(a=>!a.acknowledged).length?` (${patientAlerts.filter(a=>!a.acknowledged).length})`:''}` },
  ];

  if (loading || !patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-3 text-grey-400 font-mono text-xs">
          <RefreshCw size={14} className="animate-spin"/> Loading patient…
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden">

      {/* LEFT INFO PANEL */}
      <div className="flex flex-col gap-3 overflow-hidden" style={{width:280,minWidth:280,padding:'12px 0 12px 12px'}}>
        <button onClick={() => navigate('/')} className="btn-ghost text-xs self-start py-1.5 px-3 gsap-fade-in">
          <ArrowLeft size={12}/> Nurse Station
        </button>

        <PatientInfo patient={patient}/>

        {patients.length > 1 && (
          <div className="glass rounded-lg p-3 gsap-slide-up">
            <p className="section-label mb-2">Switch Patient</p>
            <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-dark">
              {patients.map(p => (
                <button key={p._id}
                  onClick={() => { setPatient(p); setSelected(p); navigate(`/home-monitor/${p._id}`); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md font-mono transition-colors flex items-center gap-2 ${
                    p._id===patient._id?'bg-cyan/10 text-cyan':'text-grey-300 hover:bg-white/5'}`}
                  style={{fontSize:10}}>
                  <div className="w-1 h-3 rounded-full flex-shrink-0" style={{
                    background:p.status==='critical'?'#FF0000':p.status==='warning'?'#ffaa00':'#00ff88'
                  }}/>
                  {p.name}<span className="text-grey-400 ml-auto">{p.bed}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {vitals && (
          <div className="glass rounded-lg p-3 gsap-slide-up">
            <p className="section-label mb-2">Quick Summary</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {k:'HR',   v:String(vitals.bpm),                  u:'BPM',  c:'#FF4D6D'},
                {k:'SpO₂', v:`${vitals.spo2}%`,                    u:'',     c:'#00d4ff'},
                {k:'BP',   v:`${vitals.systolic}/${vitals.diastolic}`,u:'mmHg',c:'#a855f7'},
                {k:'Temp', v:vitals.temp.toFixed(1),               u:'°C',   c:'#ffaa00'},
              ].map(i => (
                <div key={i.k} className="text-center p-1.5 rounded"
                     style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="vital-label" style={{fontSize:7.5}}>{i.k}</div>
                  <div className="font-mono font-bold" style={{fontSize:14,color:i.c}}>
                    {i.v}<span style={{fontSize:8,color:'rgba(255,255,255,0.3)',marginLeft:2}}>{i.u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT TAB CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-3 gap-3">
        {/* Tab nav */}
        <div className="flex items-center gap-1 border-b pb-2 flex-shrink-0 gsap-fade-in"
             style={{borderColor:'rgba(255,255,255,0.07)'}}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`font-mono px-3 py-1.5 rounded-md transition-all ${
                activeTab===tab.key
                  ?'bg-cyan/10 text-cyan border border-cyan/25'
                  :'text-grey-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={{fontSize:9.5,letterSpacing:'0.1em'}}>
              {tab.label.toUpperCase()}
            </button>
          ))}
          {activeTab==='3d' && (
            <button onClick={()=>setWireframe(v=>!v)}
              className="ml-auto flex items-center gap-1.5 text-grey-400 hover:text-white font-mono text-xs transition-colors">
              {wireframe?<ToggleRight size={14} className="text-cyan"/>:<ToggleLeft size={14}/>}
              {wireframe?'WIREFRAME':'SOLID'}
            </button>
          )}
        </div>

        {/* Tab panels */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            transition={{duration:0.25}}
            className="flex-1 overflow-y-auto scrollbar-dark">

            {activeTab==='vitals' && (
              <div className="space-y-4 pb-4">
                <VitalsPanel vitals={vitals} history={history}/>
                {history.length > 5 && (
                  <>
                    <p className="section-label mt-4">History Charts</p>
                    <div className="grid grid-cols-2 gap-3">
                      <VitalsChart history={history} metric="bpm"      color="#FF4D6D" label="Heart Rate"  unit="BPM"/>
                      <VitalsChart history={history} metric="spo2"     color="#00d4ff" label="SpO₂"        unit="%"/>
                      <VitalsChart history={history} metric="systolic" color="#a855f7" label="Systolic BP" unit="mmHg"/>
                      <VitalsChart history={history} metric="temp"     color="#ffaa00" label="Temperature" unit="°C"/>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab==='ai' && (
              <div style={{minHeight:400}}>
                <AICamera patientId={patient._id} isAlert={patient.status==='critical'}/>
              </div>
            )}

            {activeTab==='3d' && (
              <div className="space-y-3 pb-4">
                <div className="rounded-lg overflow-hidden" style={{height:380}}>
                  <ThreeBodyModel alertZones={alertZones} vitals={vitals} wireframe={wireframe} className="w-full h-full"/>
                </div>
                <div className="glass rounded-lg p-3">
                  <p className="section-label mb-2">Active Alert Zones</p>
                  {alertZones.length===0
                    ? <p className="font-mono text-grey-400 text-xs">No active zones</p>
                    : <div className="space-y-1.5">
                        {alertZones.map(z => (
                          <div key={z.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                              background:z.severity==='critical'?'#FF0000':z.severity==='warning'?'#ffaa00':'#00d4ff',
                              boxShadow:`0 0 5px ${z.severity==='critical'?'#FF0000':z.severity==='warning'?'#ffaa00':'#00d4ff'}`,
                            }}/>
                            <span className="font-mono text-grey-300" style={{fontSize:10}}>{z.label}</span>
                            <span className="font-mono text-grey-400 ml-auto capitalize" style={{fontSize:9}}>{z.severity}</span>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            )}

            {activeTab==='labs' && (
              <div style={{minHeight:400}}>
                <LabReports patientId={patient._id}/>
              </div>
            )}

            {activeTab==='alerts' && (
              <div style={{minHeight:300}}>
                <AlertPanel/>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
