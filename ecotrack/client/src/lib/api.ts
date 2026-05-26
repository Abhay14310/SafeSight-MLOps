// src/lib/api.ts
/// <reference types="vite/client" />
import axios from 'axios';
const api = axios.create({ baseURL:(import.meta.env.VITE_API_URL||'')+'/api', timeout:12000 });
api.interceptors.request.use(c=>{ const t=localStorage.getItem('eco_token'); if(t)c.headers.Authorization=`Bearer ${t}`; return c; });
api.interceptors.response.use(r=>r,e=>{ if(e.response?.status===401){localStorage.removeItem('eco_token');localStorage.removeItem('eco_user');window.location.href='/login';} return Promise.reject(e); });

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
