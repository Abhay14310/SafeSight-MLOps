// src/lib/api.ts
import axios from 'axios';
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 12000,
});
api.interceptors.request.use(c => {
  const t = localStorage.getItem('sr_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(r => r, e => {
  if (e.response?.status === 401) {
    localStorage.removeItem('sr_token');
    localStorage.removeItem('sr_user');
    window.location.href = '/login';
  }
  return Promise.reject(e);
});

export const authApi      = { login: (email:string, password:string) => api.post('/auth/login',{email,password}), me: () => api.get('/auth/me') };
export const cameraApi    = { list: () => api.get('/cameras') };
export const inventoryApi = { list: (p?:Record<string,string>) => api.get('/inventory',{params:p}), update:(id:string,d:Record<string,unknown>)=>api.patch(`/inventory/${id}`,d) };
export const alertApi     = { list:(p?:Record<string,string>)=>api.get('/alerts',{params:p}), ack:(id:string)=>api.patch(`/alerts/${id}/ack`), resolve:(id:string)=>api.patch(`/alerts/${id}/resolve`) };
export const salesApi     = { summary:()=>api.get('/sales/summary'), byZone:()=>api.get('/sales/by-zone'), recent:()=>api.get('/sales/recent') };
export const staffApi     = { list:()=>api.get('/staff'), update:(id:string,d:Record<string,unknown>)=>api.patch(`/staff/${id}`,d) };
export const dashApi      = { summary:()=>api.get('/dashboard/summary') };
export default api;
