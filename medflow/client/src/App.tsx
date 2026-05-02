// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from '@/store/useStore';
import { useSocket } from '@/hooks/useSocket';
import { patientApi, alertApi } from '@/lib/api';

// Pages
import Login        from '@/pages/Login';
import NurseStation from '@/pages/NurseStation';
import HomeMonitor  from '@/pages/HomeMonitor';
import Layout       from '@/components/Layout';
import ToastStack   from '@/components/ToastStack';

// ── Error Boundary ────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          width: '100vw', height: '100vh', background: '#000', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'monospace', padding: '20px'
        }}>
          <div style={{ maxWidth: '500px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', marginBottom: '20px', color: '#ff4d6d' }}>⚠️ Application Error</p>
            <pre style={{ 
              background: '#1a1a1a', 
              padding: '15px', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px',
              textAlign: 'left'
            }}>
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                background: '#00d4ff',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Auth guard ────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(s => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Page transition wrapper ───────────────────────────────────
const PAGE_VARIANTS = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

// ── Bootstrap: load patients + alerts ─────────────────────────
function AppBootstrap() {
  const { isAuthenticated, setPatients, setAlerts } = useStore();
  useSocket(); // Connect socket globally

  useEffect(() => {
    if (!isAuthenticated) return;

    patientApi.list()
      .then(r => setPatients(r.data.data))
      .catch(() => {});

    alertApi.list({ limit: '50', resolved: 'false' })
      .then(r => setAlerts(r.data.data))
      .catch(() => {});
  }, [isAuthenticated]);

  return null;
}

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  const location = useLocation();

  return (
    <ErrorBoundary>
      <>
        <AppBootstrap />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            {/* Public */}
            <Route path="/login" element={
              <PageWrapper><Login /></PageWrapper>
            } />

            {/* Protected — Nurse Station (multi-patient) */}
            <Route path="/" element={
              <RequireAuth>
                <Layout>
                  <PageWrapper><NurseStation /></PageWrapper>
                </Layout>
              </RequireAuth>
            } />

            {/* Protected — Home Monitor (single patient deep dive) */}
            <Route path="/home-monitor/:patientId?" element={
              <RequireAuth>
                <Layout>
                  <PageWrapper><HomeMonitor /></PageWrapper>
                </Layout>
              </RequireAuth>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        {/* Global toast notifications */}
        <ToastStack />
      </>
    </ErrorBoundary>
  );
}
