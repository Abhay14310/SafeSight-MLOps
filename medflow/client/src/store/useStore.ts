// src/store/useStore.ts
import { create } from 'zustand';
import type { Patient, Vitals, Alert, User } from '@/types';

// ─── AUTH SLICE ────────────────────────────────────────────────
interface AuthSlice {
  user:            User | null;
  token:           string | null;
  isAuthenticated: boolean;
  login:  (user: User, token: string) => void;
  logout: () => void;
}

// ─── PATIENT SLICE ─────────────────────────────────────────────
interface PatientSlice {
  patients:        Patient[];
  selectedPatient: Patient | null;
  setPatients:     (patients: Patient[]) => void;
  setSelected:     (p: Patient | null) => void;
  updatePatient:   (id: string, update: Partial<Patient>) => void;
}

// ─── VITALS SLICE ──────────────────────────────────────────────
interface VitalsSlice {
  vitalsMap:   Record<string, Vitals>;      // patientId → latest vitals
  setVitals:   (patientId: string, v: Vitals) => void;
  clearVitals: () => void;
}

// ─── ALERTS SLICE ──────────────────────────────────────────────
interface AlertsSlice {
  alerts:          Alert[];
  unreadCount:     number;
  addAlert:        (a: Alert) => void;
  setAlerts:       (alerts: Alert[]) => void;
  acknowledgeAlert:(id: string) => void;
  clearUnread:     () => void;
}

// ─── UI SLICE ──────────────────────────────────────────────────
interface UISlice {
  sidebarOpen:    boolean;
  activeTab:      string;
  theme:          'dark';
  toggleSidebar:  () => void;
  setActiveTab:   (tab: string) => void;
  toasts:         Toast[];
  addToast:       (t: Omit<Toast, 'id'>) => void;
  removeToast:    (id: string) => void;
}

interface Toast {
  id:       string;
  type:     'success' | 'error' | 'warning' | 'info';
  message:  string;
  duration: number;
}

// ─── COMBINED STORE ────────────────────────────────────────────
type Store = AuthSlice & PatientSlice & VitalsSlice & AlertsSlice & UISlice;

const useStore = create<Store>((set, get) => ({

  // ── AUTH ──
  user:            JSON.parse(localStorage.getItem('mf_user') || 'null'),
  token:           localStorage.getItem('mf_token'),
  isAuthenticated: !!localStorage.getItem('mf_token'),

  login: (user, token) => {
    localStorage.setItem('mf_token', token);
    localStorage.setItem('mf_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('mf_token');
    localStorage.removeItem('mf_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // ── PATIENTS ──
  patients:        [],
  selectedPatient: null,
  setPatients:     (patients) => set({ patients }),
  setSelected:     (selectedPatient) => set({ selectedPatient }),
  updatePatient:   (id, update) => set((s) => ({
    patients: s.patients.map(p => p._id === id ? { ...p, ...update } : p),
    selectedPatient: s.selectedPatient?._id === id
      ? { ...s.selectedPatient, ...update } : s.selectedPatient,
  })),

  // ── VITALS ──
  vitalsMap: {},
  setVitals: (patientId, v) => set((s) => ({
    vitalsMap: { ...s.vitalsMap, [patientId]: v },
  })),
  clearVitals: () => set({ vitalsMap: {} }),

  // ── ALERTS ──
  alerts:      [],
  unreadCount: 0,
  addAlert: (a) => set((s) => ({
    alerts:      [a, ...s.alerts].slice(0, 100),
    unreadCount: s.unreadCount + 1,
  })),
  setAlerts:   (alerts)  => set({ alerts }),
  acknowledgeAlert: (id) => set((s) => ({
    alerts: s.alerts.map(a => a._id === id ? { ...a, acknowledged: true } : a),
  })),
  clearUnread: () => set({ unreadCount: 0 }),

  // ── UI ──
  sidebarOpen:   true,
  activeTab:     'overview',
  theme:         'dark',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTab:  (tab) => set({ activeTab: tab }),

  toasts: [],
  addToast: (t) => {
    const id = `toast-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => get().removeToast(id), t.duration || 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export default useStore;
