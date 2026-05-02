// src/store/useStore.ts
import { create } from 'zustand';
import type { User, Vehicle, VehicleFrame, Bin, BinUpdate, Alert, LiveCollection, DashSummary } from '@/types';

interface Store {
  user: User|null; token:string|null; isAuth:boolean;
  login: (u:User,t:string)=>void; logout:()=>void; updateUser:(u:Partial<User>)=>void;
  vehicles: Record<string,VehicleFrame>;
  setVehicleFrame:(f:VehicleFrame)=>void;
  bins: Bin[]; setBins:(b:Bin[])=>void; updateBin:(u:BinUpdate)=>void;
  alerts: Alert[]; setAlerts:(a:Alert[])=>void; addAlert:(a:Alert)=>void; ackAlert:(id:string)=>void;
  collections: LiveCollection[]; addCollection:(c:LiveCollection)=>void;
  summary: DashSummary|null; setSummary:(s:DashSummary)=>void;
  toasts:{id:string;type:string;msg:string}[];
  addToast:(type:string,msg:string,dur?:number)=>void; removeToast:(id:string)=>void;
}

const useStore = create<Store>((set,get)=>({
  user:   JSON.parse(localStorage.getItem('eco_user')||'null'),
  token:  localStorage.getItem('eco_token'),
  isAuth: !!localStorage.getItem('eco_token'),
  login:  (u,t)=>{ localStorage.setItem('eco_token',t); localStorage.setItem('eco_user',JSON.stringify(u)); set({user:u,token:t,isAuth:true}); },
  logout: ()=>{ localStorage.removeItem('eco_token'); localStorage.removeItem('eco_user'); set({user:null,token:null,isAuth:false}); },
  updateUser: (u)=>set(s=>({ user: s.user ? {...s.user,...u} : s.user })),

  vehicles:{}, setVehicleFrame:(f)=>set(s=>({vehicles:{...s.vehicles,[f.vehicleId]:f}})),
  bins:[], setBins:(b)=>set({bins:b}),
  updateBin:(u)=>set(s=>({bins:s.bins.map(b=>b.binId===u.binId?{...b,fillLevel:u.fillLevel}:b)})),

  alerts:[], setAlerts:(a)=>set({alerts:a}),
  addAlert:(a)=>set(s=>({alerts:[a,...s.alerts].slice(0,100)})),
  ackAlert:(id)=>set(s=>({alerts:s.alerts.map(a=>a._id===id?{...a,acknowledged:true}:a)})),

  collections:[], addCollection:(c)=>set(s=>({collections:[c,...s.collections].slice(0,60)})),
  summary:null, setSummary:(s)=>set({summary:s}),

  toasts:[],
  addToast:(type,msg,dur=4000)=>{
    const id=`t${Date.now()}`;
    set(s=>({toasts:[...s.toasts,{id,type,msg}]}));
    setTimeout(()=>get().removeToast(id),dur);
  },
  removeToast:(id)=>set(s=>({toasts:s.toasts.filter(t=>t.id!==id)})),
}));

export default useStore;
