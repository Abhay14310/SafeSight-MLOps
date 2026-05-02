// src/pages/PatientMonitor.tsx
import React,{ useEffect,useRef,useState,useCallback } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Heart,Activity,Wind,Thermometer,TrendingUp,AlertTriangle,ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';
import { alertApi } from '../lib/api';
import { getSocket } from '../lib/socket';
import type { Patient,VitalSnapshot } from '../types';

// ── Canvas waveform renderer ─────────────────────────────────
interface WaveProps { data:number[]; color:string; label:string; height?:number; filled?:boolean; }

function WaveCanvas({ data,color,label,height=80,filled=false }:WaveProps){
  const ref=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas=ref.current; if(!canvas)return;
    const ctx=canvas.getContext('2d')!;
    const{width:W,height:H}=canvas;
    ctx.clearRect(0,0,W,H);

    if(data.length<2)return;
    const min=Math.min(...data),max=Math.max(...data);
    const range=max-min||1;

    // Grid lines
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=1;
    for(let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(0,H*i/4); ctx.lineTo(W,H*i/4); ctx.stroke(); }

    const pts=data.slice(-Math.floor(W/3));
    const step=W/pts.length;

    if(filled){
      ctx.beginPath();
      pts.forEach((v,i)=>{ const x=i*step; const y=H-(v-min)/range*(H*0.85)-H*0.07; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
      ctx.lineTo(pts.length*step,H); ctx.lineTo(0,H); ctx.closePath();
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,color+'55'); grad.addColorStop(1,color+'00');
      ctx.fillStyle=grad; ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle=color; ctx.lineWidth=2;
    ctx.shadowColor=color; ctx.shadowBlur=6;
    pts.forEach((v,i)=>{ const x=i*step; const y=H-(v-min)/range*(H*0.85)-H*0.07; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke();
    ctx.shadowBlur=0;

    // Trailing dot
    if(pts.length>0){
      const lv=pts[pts.length-1];
      const lx=(pts.length-1)*step; const ly=H-(lv-min)/range*(H*0.85)-H*0.07;
      ctx.beginPath(); ctx.arc(lx,ly,3,0,Math.PI*2);
      ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10;
      ctx.fill(); ctx.shadowBlur=0;
    }
  },[data,color]);

  return(
    <div className="relative">
      <div className="section-label mb-1">{label}</div>
      <canvas ref={ref} width={700} height={height} className="ecg-canvas" style={{background:'rgba(0,0,0,0.2)',borderRadius:8,width:'100%',height}}/>
    </div>
  );
}

// ── Vital card ───────────────────────────────────────────────
function VCard({ label,val,unit,color,warn=false }:{ label:string;val:string|number;unit:string;color:string;warn?:boolean }){
  return(
    <motion.div layout className="vital-card" style={{borderColor:warn?'rgba(239,68,68,0.4)':undefined}}>
      {warn&&<motion.div animate={{opacity:[1,.3,1]}} transition={{duration:.9,repeat:Infinity}}
        className="absolute top-2 right-2"><AlertTriangle size={12} color="#EF4444"/></motion.div>}
      <div className="vital-label">{label}</div>
      <div className="vital-value" style={{color}}>{val}</div>
      <div className="vital-unit">{unit}</div>
    </motion.div>
  );
}

// ── Patient sidebar ──────────────────────────────────────────
function PatientSidebar({ patients,selectedId,onSelect }:{ patients:Patient[];selectedId:string|null;onSelect:(id:string)=>void }){
  const vitals=useStore(s=>s.vitals);
  return(
    <div className="w-52 min-w-52 flex flex-col overflow-hidden" style={{borderRight:'1px solid rgba(255,255,255,0.06)'}}>
      <div className="px-4 py-3 flex-shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="section-label">ICU Beds</div>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin py-2 px-2">
        {patients.map(p=>{
          const v=vitals[p._id];
          const isSel=selectedId===p._id;
          const iscrit=p.status==='critical';
          return(
            <button key={p._id} onClick={()=>onSelect(p._id)}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150"
              style={{
                background:isSel?'rgba(113,224,126,0.1)':iscrit&&!isSel?'rgba(239,68,68,0.06)':'transparent',
                border:`1px solid ${isSel?'rgba(113,224,126,0.35)':iscrit?'rgba(239,68,68,0.25)':'transparent'}`,
              }}>
              <div className={iscrit?'dot-red':p.status==='warning'?'dot-yellow':'dot-green'}/>
              <div className="flex-1 min-w-0">
                <div className="font-sans font-semibold text-white text-xs truncate">{p.name}</div>
                <div className="font-sans text-white/35 text-xs">{p.bedId}</div>
              </div>
              {v&&<div className="font-mono font-bold text-xs" style={{color:isSel?'#71E07E':'rgba(255,255,255,0.4)'}}>{Math.round(v.hr)}</div>}
              {isSel&&<ChevronRight size={11} style={{color:'#71E07E',flexShrink:0}}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PatientMonitor(){
  const ref=useRef<HTMLDivElement>(null);
  const{patients,vitals,ecgBuffer,respBuffer,alerts,selectedPatient,selectPatient}=useStore();
  const[localAlerts,setLocalAlerts]=useState<typeof alerts>([]);

  const selId=selectedPatient??patients[0]?._id;
  const selPatient=patients.find(p=>p._id===selId);
  const v:VitalSnapshot|null=vitals[selId??'']??null;
  const ecg=ecgBuffer[selId??'']??[];
  const resp=respBuffer[selId??'']??[];

  // SpO2 wave - smooth sine
  const spo2Wave=Array.from({length:200},(_,i)=>{
    const base=v?.spo2??98;
    return base-1+Math.sin(i*0.08)*1.5+Math.random()*0.3;
  });

  useEffect(()=>{
    if(!selId)return;
    alertApi.list({patientId:selId,resolved:'false',limit:'10'}).then(r=>setLocalAlerts(r.data.data)).catch(()=>{});
  },[selId]);

  useEffect(()=>{
    const ctx=gsap.context(()=>{ gsap.fromTo('.monitor-block',{opacity:0,y:14},{opacity:1,y:0,stagger:.07,duration:.45,ease:'power3.out'}); },ref);
    return()=>ctx.revert();
  },[selId]);

  if(!selPatient) return(
    <div className="flex items-center justify-center h-64 font-sans text-white/30">No patients loaded. Run seed service.</div>
  );

  const isCrit=selPatient.status==='critical';
  const isWarn=selPatient.status==='warning';

  return(
    <div ref={ref} className="flex h-full overflow-hidden">
      <PatientSidebar patients={patients} selectedId={selId??null} onSelect={id=>{selectPatient(id);}}/>

      <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-4">

        {/* Patient header */}
        <div className="monitor-block flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-sans font-bold text-lg flex-shrink-0"
                 style={{background:'linear-gradient(135deg,#6200D9,#BA5FFF)',color:'#fff'}}>
              {selPatient.bedId.replace('BED-','')}
            </div>
            <div>
              <div className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>{selPatient.name}</div>
              <div className="font-sans text-white/45 text-sm">{selPatient.diagnosis}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge badge-${isCrit?'red':isWarn?'yellow':'green'}`}>{selPatient.status}</span>
                <span className="badge badge-violet">Age {selPatient.age}</span>
                <span className="badge badge-muted">{selPatient.ward}</span>
                {selPatient.bloodType&&<span className="badge badge-muted">{selPatient.bloodType}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="section-label">Nurse</div>
            <div className="font-sans text-white/70 text-sm mt-0.5">{selPatient.nurseAssigned??'Unassigned'}</div>
            <div className="section-label mt-1">Morse Score</div>
            <div className="font-mono font-bold text-sm mt-0.5" style={{color:selPatient.morseScore>=45?'#EF4444':selPatient.morseScore>=25?'#F59E0B':'#71E07E'}}>
              {selPatient.morseScore} — {selPatient.morseScore>=45?'HIGH RISK':selPatient.morseScore>=25?'MEDIUM':'LOW'}
            </div>
          </div>
        </div>

        {/* Vitals grid */}
        <div className="monitor-block grid grid-cols-6 gap-3">
          <VCard label="Heart Rate"    val={v?Math.round(v.hr):'—'}  unit="bpm"  color="#EF4444" warn={v?v.hr<45||v.hr>130:false}/>
          <VCard label="SpO₂"         val={v?v.spo2.toFixed(0):'—'} unit="%"    color="#71E07E" warn={v?v.spo2<94:false}/>
          <VCard label="Resp Rate"    val={v?Math.round(v.resp):'—'} unit="/min" color="#BA5FFF" warn={v?v.resp>25:false}/>
          <VCard label="NIBP"         val={v?`${Math.round(v.sbp)}/${Math.round(v.dbp)}`:'—'} unit="mmHg" color="#6200D9" warn={v?v.sbp<90||v.sbp>180:false}/>
          <VCard label="Temp"         val={v?v.temp.toFixed(1):'—'}  unit="°C"   color="#F59E0B" warn={v?v.temp>38.5:false}/>
          <VCard label="EtCO₂"       val={v?Math.round(v.etco2??35):'—'} unit="mmHg" color="#3B82F6"/>
        </div>

        {/* ECG waveform */}
        <div className="monitor-block glass p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="live-pulse w-2 h-2 rounded-full" style={{background:'#71E07E'}}/>
              <span className="section-label">ECG — Lead II</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs" style={{color:'rgba(113,224,126,0.6)'}}>25mm/s · 10mm/mV</span>
              <span className="badge badge-green">Sinus Rhythm</span>
            </div>
          </div>
          <WaveCanvas data={ecg} color="#71E07E" label="" height={90}/>
        </div>

        {/* Resp + SpO2 */}
        <div className="monitor-block grid grid-cols-2 gap-4">
          <div className="glass p-4">
            <WaveCanvas data={resp} color="#BA5FFF" label="Respiration Waveform" height={70} filled/>
          </div>
          <div className="glass p-4">
            <WaveCanvas data={spo2Wave} color="#71E07E" label="SpO₂ Plethysmograph" height={70} filled/>
          </div>
        </div>

        {/* Patient alerts */}
        <div className="monitor-block glass p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="section-label">Patient Alerts</div>
            <span className="badge badge-red">{localAlerts.filter(a=>!a.acknowledged).length} unacked</span>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto scroll-thin">
            <AnimatePresence>
              {localAlerts.map(a=>(
                <motion.div key={a._id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
                  className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${a.severity==='critical'?'alert-row-critical':''}`}
                  style={{background:a.severity==='critical'?'rgba(239,68,68,0.08)':'rgba(245,158,11,0.06)',border:`1px solid ${a.severity==='critical'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.2)'}`}}>
                  <AlertTriangle size={13} style={{color:a.severity==='critical'?'#EF4444':'#F59E0B',flexShrink:0,marginTop:1}}/>
                  <div className="flex-1">
                    <div className="font-mono font-bold text-xs" style={{color:a.severity==='critical'?'#EF4444':'#F59E0B'}}>{a.type.replace(/_/g,' ')}</div>
                    <div className="font-sans text-white/65 text-xs mt-0.5">{a.message}</div>
                  </div>
                  <div className="font-mono text-white/30 text-xs flex-shrink-0">{new Date(a.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false})}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {localAlerts.length===0&&<div className="text-center py-4 font-sans text-white/25 text-xs">No active alerts for this patient</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
