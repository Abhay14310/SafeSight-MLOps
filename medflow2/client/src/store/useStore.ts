// src/store/useStore.ts
import { create } from 'zustand';
import type { User,Patient,VitalSnapshot,ECGPoint,PoseFrame,Alert,Task } from '../types';

export interface Store {
  user:User|null; token:string|null; isAuth:boolean;
  login:(u:User,t:string)=>void; logout:()=>void;

  patients:Patient[]; setPatients:(p:Patient[])=>void;
  selectedPatient:string|null; selectPatient:(id:string|null)=>void;

  vitals:Record<string,VitalSnapshot>; setVital:(v:VitalSnapshot)=>void;
  ecgBuffer:Record<string,number[]>; pushECG:(p:ECGPoint)=>void;
  respBuffer:Record<string,number[]>; pushResp:(p:ECGPoint)=>void;

  poseFrame:PoseFrame|null; setPose:(f:PoseFrame)=>void;
  poseHistory:PoseFrame[]; addPoseHistory:(f:PoseFrame)=>void;

  alerts:Alert[]; setAlerts:(a:Alert[])=>void; addAlert:(a:Alert)=>void; ackAlert:(id:string)=>void;
  tasks:Task[]; setTasks:(t:Task[])=>void; addTask:(t:Task)=>void; updateTask:(id:string,data:Partial<Task>)=>void;

  toasts:{id:string;type:string;msg:string}[];
  toast:(type:string,msg:string,dur?:number)=>void; removeToast:(id:string)=>void;
}

const MAX_ECG = 300;

const useStore = create<Store>((set,get) => ({
  user:  JSON.parse(localStorage.getItem('mf2_user')||'null'),
  token: localStorage.getItem('mf2_token'),
  isAuth:!!localStorage.getItem('mf2_token'),
  login: (u,t)=>{ localStorage.setItem('mf2_token',t); localStorage.setItem('mf2_user',JSON.stringify(u)); set({user:u,token:t,isAuth:true}); },
  logout:()=>{ localStorage.removeItem('mf2_token'); localStorage.removeItem('mf2_user'); set({user:null,token:null,isAuth:false}); },

  patients:[], setPatients:(p)=>set({patients:p}),
  selectedPatient:null, selectPatient:(id)=>set({selectedPatient:id}),

  vitals:{}, setVital:(v)=>set(s=>({vitals:{...s.vitals,[v.patientId]:v}})),
  ecgBuffer:{},
  pushECG:(p)=>set(s=>{
    const prev=s.ecgBuffer[p.patientId]??[];
    return { ecgBuffer:{...s.ecgBuffer,[p.patientId]:[...prev,p.ecg].slice(-MAX_ECG)} };
  }),
  respBuffer:{},
  pushResp:(p)=>set(s=>{
    const prev=s.respBuffer[p.patientId]??[];
    return { respBuffer:{...s.respBuffer,[p.patientId]:[...prev,p.resp].slice(-MAX_ECG)} };
  }),

  poseFrame:null, setPose:(f)=>set({poseFrame:f}),
  poseHistory:[], addPoseHistory:(f)=>set(s=>({poseHistory:[f,...s.poseHistory].slice(0,216)})),

  alerts:[], setAlerts:(a)=>set({alerts:a}),
  addAlert:(a)=>set(s=>({alerts:[a,...s.alerts].slice(0,100)})),
  ackAlert:(id)=>set(s=>({alerts:s.alerts.map(a=>a._id===id?{...a,acknowledged:true}:a)})),

  tasks:[], setTasks:(t)=>set({tasks:t}),
  addTask:(t)=>set(s=>({tasks:[t,...s.tasks]})),
  updateTask:(id,data)=>set(s=>({tasks:s.tasks.map(t=>t._id===id?{...t,...data}:t)})),

  toasts:[],
  toast:(type,msg,dur=4000)=>{
    const id=`t${Date.now()}`;
    set(s=>({toasts:[...s.toasts,{id,type,msg}]}));
    setTimeout(()=>get().removeToast(id),dur);
  },
  removeToast:(id)=>set(s=>({toasts:s.toasts.filter(t=>t.id!==id)})),
}));

export default useStore;
