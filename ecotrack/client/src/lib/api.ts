// src/lib/api.ts
/// <reference types="vite/client" />
import axios from 'axios';
const getBaseURL = () => {
  // VITE_API_BASE is set by vite.config.ts:
  //   dev  → '/api'          (proxied to localhost:5055)
  //   prod → '/api/ecotrack' (Vercel serverless at api/ecotrack.js)
  // Use it directly — do NOT append /api again.
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (envUrl) return envUrl;
  // Fallback: detect from current path
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/ecotrack')) {
    return '/api/ecotrack';
  }
  return '/api';
};
const api = axios.create({ baseURL: getBaseURL(), timeout:12000 });
api.interceptors.request.use(c=>{ const t=localStorage.getItem('eco_token'); if(t)c.headers.Authorization=`Bearer ${t}`; return c; });
api.interceptors.response.use(r=>r,e=>{ if(e.response?.status===401){localStorage.removeItem('eco_token');localStorage.removeItem('eco_user');window.location.href='/ecotrack/login';} return Promise.reject(e); });

export const authApi     = { login:(email:string,password:string)=>api.post('/auth/login',{email,password}), me:()=>api.get('/auth/me'), profile:(d:Record<string,unknown>)=>api.patch('/auth/profile',d) };
export const dashApi     = { summary:()=>api.get('/dashboard/summary') };
export const wasteApi    = { list:(p?:Record<string,string>)=>api.get('/wastelogs',{params:p}), create:(d:Record<string,unknown>)=>api.post('/wastelogs',d), update:(id:string,d:Record<string,unknown>)=>api.patch(`/wastelogs/${id}`,d), delete:(id:string)=>api.delete(`/wastelogs/${id}`) };
export const vehicleApi  = { list:()=>api.get('/vehicles'), update:(id:string,d:Record<string,unknown>)=>api.patch(`/vehicles/${id}`,d) };
export const binApi      = { list:(p?:Record<string,string>)=>api.get('/bins',{params:p}), update:(id:string,d:Record<string,unknown>)=>api.patch(`/bins/${id}`,d) };
export const routeApi    = { list:()=>api.get('/routes'), create:(d:Record<string,unknown>)=>api.post('/routes',d), update:(id:string,d:Record<string,unknown>)=>api.patch(`/routes/${id}`,d) };
export const scheduleApi = { list:()=>api.get('/schedules'), create:(d:Record<string,unknown>)=>api.post('/schedules',d), update:(id:string,d:Record<string,unknown>)=>api.patch(`/schedules/${id}`,d), remove:(id:string)=>api.delete(`/schedules/${id}`) };
export const alertApi    = { list:(p?:Record<string,string>)=>api.get('/alerts',{params:p}), ack:(id:string)=>api.patch(`/alerts/${id}/ack`), resolve:(id:string)=>api.patch(`/alerts/${id}/resolve`) };
export const reportApi   = { weekly:(p?:Record<string,string>)=>api.get('/reports/weekly',{params:p}), byZone:(p?:Record<string,string>)=>api.get('/reports/by-zone',{params:p}), byType:(p?:Record<string,string>)=>api.get('/reports/by-type',{params:p}) };
export const settingsApi = { get:()=>api.get('/settings'), update:(d:Record<string,unknown>)=>api.patch('/settings',d), tasukeUrl:()=>api.get('/settings/tasuke-url') };
export default api;
