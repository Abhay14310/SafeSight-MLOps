// src/lib/api.ts
import axios from 'axios';
const getBaseURL = () => {
  // Check both VITE_API_URL and VITE_API_BASE for environment override
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (envUrl) return envUrl.endsWith('/api') ? envUrl : envUrl + '/api';
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/medflow')) {
    return '/api/medflow2';
  }
  return '/api';
};
const api = axios.create({ baseURL: getBaseURL(), timeout:12000 });
api.interceptors.request.use(c=>{ const t=localStorage.getItem('mf2_token'); if(t)c.headers.Authorization=`Bearer ${t}`; return c; });
api.interceptors.response.use(r=>r,e=>{ if(e.response?.status===401){ localStorage.removeItem('mf2_token'); localStorage.removeItem('mf2_user'); window.location.href='/login'; } return Promise.reject(e); });

export const authApi    = { login:(email:string,p:string)=>api.post('/auth/login',{email,password:p}), me:()=>api.get('/auth/me'), profile:(d:Record<string,unknown>)=>api.patch('/auth/profile',d) };
export const patientApi = { list:()=>api.get('/patients'), get:(id:string)=>api.get(`/patients/${id}`), update:(id:string,d:Record<string,unknown>)=>api.patch(`/patients/${id}`,d) };
export const vitalsApi  = { history:(id:string,limit=100)=>api.get(`/vitals/${id}`,{params:{limit}}) };
export const alertApi   = { list:(p?:Record<string,string>)=>api.get('/alerts',{params:p}), ack:(id:string)=>api.patch(`/alerts/${id}/ack`), resolve:(id:string)=>api.patch(`/alerts/${id}/resolve`) };
export const taskApi    = { list:(p?:Record<string,string>)=>api.get('/tasks',{params:p}), create:(d:Record<string,unknown>)=>api.post('/tasks',d), update:(id:string,d:Record<string,unknown>)=>api.patch(`/tasks/${id}`,d) };
export const poseApi    = { history:(id:string)=>api.get(`/pose/history/${id}`) };
export const settingsApi= { get:()=>api.get('/settings'), update:(d:Record<string,unknown>)=>api.patch('/settings',d), tasukeUrl:()=>api.get('/settings/tasuke-url') };
export default api;
