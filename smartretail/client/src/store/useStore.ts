import{create}from'zustand';
import type{User,CameraFrame,FootfallZone,POSTransaction,Alert,InventoryItem}from'@/types';
interface Store{
  user:User|null;token:string|null;isAuth:boolean;
  login:(u:User,t:string)=>void;logout:()=>void;
  cameras:Record<string,CameraFrame>;setCameraFrame:(f:CameraFrame)=>void;
  footfall:FootfallZone[];setFootfall:(z:FootfallZone[])=>void;
  transactions:POSTransaction[];addTx:(t:POSTransaction)=>void;
  dailyRevenue:number;dailyTxCount:number;
  alerts:Alert[];setAlerts:(a:Alert[])=>void;addAlert:(a:Alert)=>void;ackAlert:(id:string)=>void;
  inventory:InventoryItem[];setInventory:(i:InventoryItem[])=>void;
  toasts:{id:string;type:string;msg:string}[];
  addToast:(type:string,msg:string)=>void;removeToast:(id:string)=>void;
}
const useStore=create<Store>((set,get)=>({
  user:JSON.parse(localStorage.getItem('sr_user')||'null'),
  token:localStorage.getItem('sr_token'),
  isAuth:!!localStorage.getItem('sr_token'),
  login:(u,t)=>{localStorage.setItem('sr_token',t);localStorage.setItem('sr_user',JSON.stringify(u));set({user:u,token:t,isAuth:true})},
  logout:()=>{localStorage.removeItem('sr_token');localStorage.removeItem('sr_user');set({user:null,token:null,isAuth:false})},
  cameras:{},
  setCameraFrame:(f)=>set(s=>({cameras:{...s.cameras,[f.camId]:f}})),
  footfall:[],setFootfall:(z)=>set({footfall:z}),
  transactions:[],dailyRevenue:0,dailyTxCount:0,
  addTx:(t)=>set(s=>({
    transactions:[t,...s.transactions].slice(0,50),
    dailyRevenue:t.dailyTotal,
    dailyTxCount:t.dailyTxCount,
  })),
  alerts:[],
  setAlerts:(a)=>set({alerts:a}),
  addAlert:(a)=>set(s=>({alerts:[a,...s.alerts].slice(0,80)})),
  ackAlert:(id)=>set(s=>({alerts:s.alerts.map(a=>a._id===id?{...a,acknowledged:true}:a)})),
  inventory:[],setInventory:(i)=>set({inventory:i}),
  toasts:[],
  addToast:(type,msg)=>{
    const id=`t${Date.now()}`;
    set(s=>({toasts:[...s.toasts,{id,type,msg}]}));
    setTimeout(()=>get().removeToast(id),4000);
  },
  removeToast:(id)=>set(s=>({toasts:s.toasts.filter(t=>t.id!==id)})),
}));
export default useStore;
