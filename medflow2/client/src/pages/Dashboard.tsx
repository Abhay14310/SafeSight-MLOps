// src/pages/Dashboard.tsx
import React,{ useEffect,useRef,Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion,AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Canvas,useFrame } from '@react-three/fiber';
import { Sphere,MeshDistortMaterial,Float } from '@react-three/drei';
import * as THREE from 'three';
import { Activity,Heart,Cpu,AlertTriangle,Users,ArrowRight,Zap,Shield,Brain } from 'lucide-react';
import useStore from '../store/useStore';

gsap.registerPlugin(ScrollTrigger);

// ── 3D floating orb ─────────────────────────────────────────
function MedOrb(){
  const ref=useRef<THREE.Mesh>(null!);
  useFrame((_,d)=>{ if(ref.current) { ref.current.rotation.x+=d*0.12; ref.current.rotation.y+=d*0.18; } });
  return(
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={ref} args={[1.8,64,64]}>
        <MeshDistortMaterial color="#6200D9" distort={0.35} speed={2.5} roughness={0.1} metalness={0.6}
          emissive="#BA5FFF" emissiveIntensity={0.25}/>
      </Sphere>
    </Float>
  );
}

function RingOrbit({ r,speed,color }:{ r:number;speed:number;color:string }){
  const ref=useRef<THREE.Group>(null!);
  useFrame((_,d)=>{ if(ref.current) { ref.current.rotation.z+=d*speed; ref.current.rotation.y+=d*speed*0.3; } });
  return(
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[r,0.012,8,80]}/>
        <meshBasicMaterial color={color} transparent opacity={0.35}/>
      </mesh>
      <mesh position={[r,0,0]}>
        <sphereGeometry args={[0.07,8,8]}/>
        <meshBasicMaterial color={color}/>
      </mesh>
    </group>
  );
}

function HeroScene3D(){
  return(
    <Canvas camera={{position:[0,0,5.5],fov:40}} gl={{antialias:true,alpha:true}} style={{background:'transparent'}}>
      <ambientLight intensity={0.4}/>
      <pointLight position={[4,4,4]} intensity={1.2} color="#BA5FFF"/>
      <pointLight position={[-4,-2,2]} intensity={0.6} color="#71E07E"/>
      <Suspense fallback={null}>
        <MedOrb/>
        <RingOrbit r={2.6} speed={0.22} color="#71E07E"/>
        <RingOrbit r={3.4} speed={-0.14} color="#BA5FFF"/>
        <RingOrbit r={4.1} speed={0.09} color="#6200D9"/>
      </Suspense>
    </Canvas>
  );
}

// ── Status dot per patient status ───────────────────────────
function StatusDot({status}:{status:string}){
  const c={stable:'dot-green',warning:'dot-yellow',critical:'dot-red'}[status]??'dot-grey';
  return <div className={c}/>;
}

// ── Service cards ────────────────────────────────────────────
const SERVICES=[
  {name:'MEDPOSE-v2',icon:<Brain size={20}/>,color:'#BA5FFF',desc:'Skeleton AI engine'},
  {name:'ECG Processor',icon:<Activity size={20}/>,color:'#71E07E',desc:'Real-time waveform'},
  {name:'Vital Monitor',icon:<Heart size={20}/>,color:'#EF4444',desc:'Multi-param stream'},
  {name:'FHIR Gateway',icon:<Shield size={20}/>,color:'#6200D9',desc:'HL7 R4 compliant'},
  {name:'Alert Bus',icon:<Zap size={20}/>,color:'#F59E0B',desc:'Event routing'},
  {name:'AI Inference',icon:<Cpu size={20}/>,color:'#3B82F6',desc:'GPU-accelerated'},
];

export default function Dashboard(){
  const ref=useNavigate();
  const mainRef=useRef<HTMLDivElement>(null);
  const{patients,vitals,alerts,selectedPatient,selectPatient}=useStore();
  const criticalCount=patients.filter(p=>p.status==='critical').length;
  const unread=alerts.filter(a=>!a.acknowledged&&!a.resolved).length;

  useEffect(()=>{
    let ctx: gsap.Context;
    if(mainRef.current) {
      ctx=gsap.context(()=>{
        gsap.fromTo('.hero-word',{y:40,opacity:0},{y:0,opacity:1,stagger:.1,duration:.8,ease:'power3.out'});
        gsap.fromTo('.hero-sub',{y:20,opacity:0},{y:0,opacity:1,duration:.6,ease:'power3.out',delay:.4});
        gsap.fromTo('.stat-card',{y:24,opacity:0,scale:.96},{y:0,opacity:1,scale:1,stagger:.07,duration:.5,ease:'power3.out'});
        gsap.fromTo('.svc-card',{y:20,opacity:0},{y:0,opacity:1,stagger:.05,duration:.45,ease:'power3.out'});
        
        // Wrap patient-row in a check to prevent empty NodeList GSAP bug
        const rows = mainRef.current?.querySelectorAll('.patient-row');
        if (rows && rows.length > 0) {
          gsap.fromTo('.patient-row',{x:-16,opacity:0},{x:0,opacity:1,stagger:.06,duration:.4,ease:'power3.out'});
        }
      },mainRef);
    }
    return () => { if (ctx) ctx.revert(); };
  },[]);

  return(
    <div ref={mainRef}>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden" style={{minHeight:480}}>
        <div className="absolute inset-0 z-10" style={{pointerEvents:'none'}}>
          <HeroScene3D/>
        </div>
        <div className="relative z-20 flex flex-col justify-center px-8 pt-16 pb-10" style={{minHeight:480}}>
          <div className="section-label mb-3">ICU-4A · AI Clinical Intelligence</div>
          <div className="overflow-hidden">
            <div style={{display:'flex',gap:'0.6rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
              {['MedFlow','2.0','—','AI','Powered','ICU'].map((w,i)=>(
                <span key={i} className="hero-word font-sans font-bold text-white opacity-0" style={{fontSize:'2.8rem',lineHeight:1.15,letterSpacing:'-0.02em',color:w==='2.0'?'#71E07E':w==='AI'?'#BA5FFF':'#fff'}}>{w}</span>
              ))}
            </div>
          </div>
          <p className="hero-sub font-sans text-white/55 opacity-0 mb-8" style={{fontSize:'1.05rem',maxWidth:420}}>
            Real-time patient surveillance, MEDPOSE-v2 skeleton analysis, and intelligent clinical alerting.
          </p>
          <div className="flex gap-3">
            <button onClick={()=>ref('/monitor')} className="btn-green text-sm">
              <Heart size={15}/> Patient Monitor <ArrowRight size={14}/>
            </button>
            <button onClick={()=>ref('/nurse')} className="btn-ghost text-sm">
              <Users size={15}/> Nurse Station
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="stats-row px-6 pb-6 grid grid-cols-4 gap-4">
        {[
          {label:'ICU Patients',val:patients.length,unit:'',color:'#71E07E',icon:<Users size={18}/>},
          {label:'Critical',val:criticalCount,unit:'',color:'#EF4444',icon:<AlertTriangle size={18}/>},
          {label:'Active Alerts',val:unread,unit:'',color:'#F59E0B',icon:<Zap size={18}/>},
          {label:'Avg HR',val:Math.round(Object.values(vitals).reduce((s,v)=>s+v.hr,0)/(Object.values(vitals).length||1)),unit:'bpm',color:'#BA5FFF',icon:<Heart size={18}/>},
        ].map(k=>(
          <div key={k.label} className="stat-card glass p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="section-label">{k.label}</span>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${k.color}18`}}>
                <span style={{color:k.color}}>{k.icon}</span>
              </div>
            </div>
            <div className="font-mono font-bold" style={{fontSize:'2rem',color:k.color,lineHeight:1}}>
              {k.val}<span className="font-mono text-white/30 ml-1" style={{fontSize:'0.75rem'}}>{k.unit}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ── AI SERVICES GRID ── */}
      <section className="svc-grid px-6 pb-6">
        <div className="section-label mb-3">AI Service Registry</div>
        <div className="grid grid-cols-3 gap-3">
          {SERVICES.map((s,i)=>(
            <div key={s.name} className="svc-card glass-dark p-4 flex items-center gap-3 cursor-pointer hover:border-green-DEFAULT/30 transition-all" style={{borderColor:i===8?'rgba(239,68,68,0.2)':undefined}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${s.color}15`}}>
                <span style={{color:s.color}}>{s.icon}</span>
              </div>
              <div>
                <div className="font-sans font-semibold text-white text-sm">{s.name}</div>
                <div className="font-sans text-white/40 text-xs">{s.desc}</div>
              </div>
              <div className="ml-auto">
                <div className="dot-green"/>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PATIENTS SECTION ── */}
      <section className="patients-section px-6 pb-8">
        <div className="section-label mb-3">Active Patients — ICU-4A</div>
        <div className="space-y-2">
          {patients.map(p=>{
            const v=vitals[p._id];
            const isSelected=selectedPatient===p._id;
            return(
              <motion.div key={p._id} layout
                onClick={()=>{selectPatient(p._id);ref('/monitor');}}
                className="patient-row glass flex items-center gap-4 px-4 py-3 cursor-pointer transition-all"
                style={{borderColor:isSelected?'rgba(113,224,126,0.4)':p.status==='critical'?'rgba(239,68,68,0.25)':undefined}}
                whileHover={{x:4}}>
                <StatusDot status={p.status}/>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-sans font-bold text-sm flex-shrink-0"
                     style={{background:'rgba(98,0,217,0.25)',color:'#BA5FFF'}}>
                  {p.bedId.replace('BED-','')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-semibold text-white text-sm">{p.name}</div>
                  <div className="font-sans text-white/40 text-xs truncate">{p.diagnosis}</div>
                </div>
                {v&&(
                  <div className="flex gap-4 text-right flex-shrink-0">
                    <div>
                      <div className="font-mono font-bold text-sm" style={{color:'#71E07E'}}>{Math.round(v.hr)}</div>
                      <div className="font-sans text-white/30 text-xs">HR</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-sm" style={{color:v.spo2<94?'#EF4444':'#BA5FFF'}}>{v.spo2.toFixed(0)}%</div>
                      <div className="font-sans text-white/30 text-xs">SpO₂</div>
                    </div>
                  </div>
                )}
                <span className={`badge badge-${p.status==='stable'?'green':p.status==='warning'?'yellow':'red'}`}>{p.status}</span>
              </motion.div>
            );
          })}
          {patients.length===0&&<div className="text-center py-12 font-sans text-white/30 text-sm">No patients loaded — run seed service</div>}
        </div>
      </section>
    </div>
  );
}
