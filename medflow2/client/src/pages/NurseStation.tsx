// src/pages/NurseStation.tsx
import React,{ useEffect,useRef,useState } from 'react';
import { motion,AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Users,Clock,CheckCircle,Plus,AlertTriangle,Zap,Activity } from 'lucide-react';
import { taskApi } from '../lib/api';
import useStore from '../store/useStore';
import type { Task,TaskUrgency } from '../types';
import type { Store } from '../store/useStore';

const URGENCY_META:Record<TaskUrgency,{color:string;bg:string;label:string;icon:React.ReactNode}> = {
  stat:    { color:'#EF4444',bg:'rgba(239,68,68,0.12)',  label:'STAT',    icon:<Zap size={10}/> },
  urgent:  { color:'#F59E0B',bg:'rgba(245,158,11,0.1)',  label:'URGENT',  icon:<AlertTriangle size={10}/> },
  routine: { color:'#71E07E',bg:'rgba(113,224,126,0.08)',label:'ROUTINE', icon:<Activity size={10}/> },
};

const STATUS_DOT:Record<string,string>={stable:'dot-green',warning:'dot-yellow',critical:'dot-red'};

// ── Bed card ─────────────────────────────────────────────────
function BedCard({ patient,vitals,tasks,onClick }:{patient:Store['patients'][0];vitals:Store['vitals'][string]|undefined;tasks:Task[];onClick:()=>void}){
  const isCrit=patient.status==='critical';
  const pendingTasks=tasks.filter(t=>t.bedId===patient.bedId&&t.status==='pending');
  const statTask=pendingTasks.find(t=>t.urgency==='stat');

  return(
    <motion.div layout whileHover={{y:-2}}
      onClick={onClick} className="glass p-4 cursor-pointer transition-all"
      style={{borderColor:isCrit?'rgba(239,68,68,0.35)':statTask?'rgba(245,158,11,0.25)':'rgba(113,224,126,0.1)',boxShadow:isCrit?'0 0 20px rgba(239,68,68,0.12)':undefined}}>
      {/* Bed header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={STATUS_DOT[patient.status]??'dot-grey'}/>
          <div className="font-mono font-bold text-xs" style={{color:'rgba(113,224,126,0.7)'}}>{patient.bedId}</div>
        </div>
        <span className={`badge badge-${isCrit?'red':patient.status==='warning'?'yellow':'green'}`}>{patient.status}</span>
      </div>

      <div className="font-sans font-semibold text-white text-sm mb-0.5">{patient.name}</div>
      <div className="font-sans text-white/35 text-xs mb-3 truncate">{patient.diagnosis}</div>

      {/* Mini vitals */}
      {vitals&&(
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {l:'HR',v:Math.round(vitals.hr),u:'bpm',w:vitals.hr<45||vitals.hr>130},
            {l:'SpO₂',v:vitals.spo2.toFixed(0),u:'%',w:vitals.spo2<94},
            {l:'Resp',v:Math.round(vitals.resp),u:'/m',w:vitals.resp>25},
          ].map(x=>(
            <div key={x.l} className="text-center rounded-lg py-1.5" style={{background:'rgba(255,255,255,0.04)'}}>
              <div className="font-mono font-bold text-sm" style={{color:x.w?'#EF4444':'#71E07E'}}>{x.v}</div>
              <div className="font-sans text-white/30 text-xs">{x.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Task count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={11} style={{color:'rgba(255,255,255,0.3)'}}/>
          <span className="font-sans text-white/35 text-xs">{pendingTasks.length} task{pendingTasks.length!==1?'s':''} pending</span>
        </div>
        {statTask&&(
          <motion.div animate={{opacity:[1,.4,1]}} transition={{duration:.8,repeat:Infinity}}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{background:'rgba(239,68,68,0.2)'}}>
            <Zap size={9} color="#EF4444"/>
            <span className="font-mono text-xs font-bold text-red-400">STAT</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Task row ─────────────────────────────────────────────────
function TaskRow({ task,onComplete }:{ task:Task;onComplete:(id:string)=>void }){
  const m=URGENCY_META[task.urgency];
  const isDone=task.status==='completed';
  return(
    <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,height:0}}
      className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all ${task.urgency==='stat'&&!isDone?'alert-row-critical':''}`}
      style={{background:isDone?'rgba(255,255,255,0.03)':m.bg,border:`1px solid ${isDone?'rgba(255,255,255,0.06)':m.color}30`,opacity:isDone?.55:1}}>
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <span style={{color:m.color}}>{m.icon}</span>
        <span className="font-mono font-bold" style={{color:m.color,fontSize:'0.6rem',letterSpacing:'0.08em'}}>{m.label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="badge badge-muted" style={{fontSize:'0.6rem'}}>{task.bedId}</span>
          <span className="font-sans text-white/35 text-xs">{task.type?.replace('_',' ')}</span>
        </div>
        <div className="font-sans text-white/75 text-sm">{task.description}</div>
        {task.dueAt&&(
          <div className="font-mono text-white/30 text-xs mt-0.5">
            Due: {new Date(task.dueAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:false})}
          </div>
        )}
      </div>
      {!isDone&&(
        <button onClick={()=>onComplete(task._id)}
          className="flex-shrink-0 text-white/25 hover:text-green-DEFAULT transition-colors p-1">
          <CheckCircle size={16}/>
        </button>
      )}
    </motion.div>
  );
}

export default function NurseStation(){
  const ref=useRef<HTMLDivElement>(null);
  const{patients,vitals,tasks,setTasks,updateTask,addTask,toast,selectPatient}=useStore();
  const navigate=useStore; // using direct navigate
  const[filter,setFilter]=useState<'all'|TaskUrgency>('all');
  const[showForm,setShowForm]=useState(false);
  const[form,setForm]=useState({bedId:'BED-01',type:'MEDICATION',description:'',urgency:'routine' as TaskUrgency,dueAt:''});

  useEffect(()=>{
    const ctx=gsap.context(()=>{ gsap.fromTo('.ns-block',{opacity:0,y:14},{opacity:1,y:0,stagger:.07,duration:.45,ease:'power3.out'}); },ref);
    return()=>ctx.revert();
  },[]);

  async function completeTask(id:string){
    try{
      await taskApi.update(id,{status:'completed',completedAt:new Date().toISOString()});
      updateTask(id,{status:'completed'});
    }catch{}
  }

  async function createTask(e:React.FormEvent){
    e.preventDefault();
    try{
      const r=await taskApi.create({...form,dueAt:form.dueAt?new Date(form.dueAt).toISOString():undefined});
      addTask(r.data.data);
      setShowForm(false);
      toast('success','Task created');
      setForm({bedId:'BED-01',type:'MEDICATION',description:'',urgency:'routine',dueAt:''});
    }catch{ toast('error','Failed'); }
  }

  const allTasks=tasks.filter(t=>t.status!=='cancelled');
  const filteredTasks=filter==='all'?allTasks:allTasks.filter(t=>t.urgency===filter);
  const pendingCount=allTasks.filter(t=>t.status==='pending').length;
  const statCount=allTasks.filter(t=>t.urgency==='stat'&&t.status==='pending').length;

  return(
    <div ref={ref} className="p-5 space-y-5">
      {/* Header */}
      <div className="ns-block flex items-center justify-between">
        <div>
          <h1 className="font-sans font-bold text-white" style={{fontSize:'1.25rem'}}>Nurse Station</h1>
          <p className="font-sans text-white/40 text-sm mt-0.5">ICU-4A · {patients.length} beds · {pendingCount} tasks pending</p>
        </div>
        <div className="flex items-center gap-2">
          {statCount>0&&(
            <motion.div animate={{opacity:[1,.4,1]}} transition={{duration:.9,repeat:Infinity}}
              className="badge badge-red">{statCount} STAT</motion.div>
          )}
          <button onClick={()=>setShowForm(v=>!v)} className="btn-green text-sm">
            <Plus size={14}/>{showForm?'Cancel':'Add Task'}
          </button>
        </div>
      </div>

      {/* Bed grid */}
      <div className="ns-block grid grid-cols-5 gap-4">
        {patients.map(p=>(
          <BedCard key={p._id} patient={p} vitals={vitals[p._id]} tasks={tasks}
            onClick={()=>{ selectPatient(p._id); }}/>
        ))}
        {patients.length===0&&[...Array(5)].map((_,i)=>(
          <div key={i} className="glass p-4 flex items-center justify-center" style={{minHeight:160}}>
            <div className="font-sans text-white/15 text-xs text-center">BED-0{i+1}<br/>Vacant</div>
          </div>
        ))}
      </div>

      {/* Create task form */}
      <AnimatePresence>
        {showForm&&(
          <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-14}}
            className="ns-block glass p-5">
            <div className="section-label mb-4">New Task</div>
            <form onSubmit={createTask} className="grid grid-cols-4 gap-4">
              <div>
                <label className="section-label block mb-1.5">Bed</label>
                <select className="mf-input" value={form.bedId} onChange={e=>setForm({...form,bedId:e.target.value})}>
                  {patients.map(p=><option key={p._id} value={p.bedId}>{p.bedId} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label block mb-1.5">Type</label>
                <select className="mf-input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                  {['MEDICATION','VITALS_CHECK','POSITION_CHANGE','LAB_DRAW','WOUND_CARE','CONSULT','CUSTOM'].map(t=><option key={t}>{t.replace('_',' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="section-label block mb-1.5">Urgency</label>
                <select className="mf-input" value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value as TaskUrgency})}>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
              <div>
                <label className="section-label block mb-1.5">Due Time</label>
                <input type="datetime-local" className="mf-input" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})}/>
              </div>
              <div className="col-span-3">
                <label className="section-label block mb-1.5">Description</label>
                <input className="mf-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the task…" required/>
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-green w-full justify-center">Create Task</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task queue */}
      <div className="ns-block glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="section-label">Task Queue — {filteredTasks.length} items</div>
          <div className="flex gap-1.5">
            {(['all','stat','urgent','routine'] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className="font-sans text-xs px-3 py-1 rounded-lg capitalize transition-all"
                style={{
                  background:filter===f?'rgba(113,224,126,0.15)':'rgba(255,255,255,0.04)',
                  border:`1px solid ${filter===f?'rgba(113,224,126,0.3)':'rgba(255,255,255,0.07)'}`,
                  color:filter===f?'#71E07E':'rgba(255,255,255,0.4)',
                }}>
                {f==='all'?'All':URGENCY_META[f as TaskUrgency].label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto scroll-thin pr-1">
          <AnimatePresence>
            {filteredTasks.sort((a,b)=>({ stat:0,urgent:1,routine:2 }[a.urgency])-({ stat:0,urgent:1,routine:2 }[b.urgency])).map(t=>(
              <TaskRow key={t._id} task={t} onComplete={completeTask}/>
            ))}
          </AnimatePresence>
          {filteredTasks.length===0&&(
            <div className="text-center py-10 font-sans text-white/25 text-sm">No tasks in this category</div>
          )}
        </div>
      </div>
    </div>
  );
}
