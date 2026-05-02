// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '@/store/useStore';
import Layout    from '@/components/Layout';
import Login     from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CameraPage   from '@/pages/CameraPage';
import SalesPage    from '@/pages/SalesPage';
import InventoryPage from '@/pages/InventoryPage';
import FootfallPage from '@/pages/FootfallPage';
import StaffPage    from '@/pages/StaffPage';
import StoreMapPage from '@/pages/StoreMapPage';
import AlertsPage   from '@/pages/AlertsPage';

const PAGE = {
  initial:  { opacity:0, y:6 },
  animate:  { opacity:1, y:0, transition:{ duration:0.3, ease:[0.16,1,0.3,1] } },
  exit:     { opacity:0, y:-6, transition:{ duration:0.18 } },
};

function Guard({ children }: { children: React.ReactNode }) {
  const isAuth = useStore(s => s.isAuth);
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={PAGE} initial="initial" animate="animate" exit="exit"
                style={{ width:'100%', height:'100%' }}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/login" element={<Wrap><Login /></Wrap>} />
        <Route path="/" element={<Guard><Layout><Wrap><Dashboard /></Wrap></Layout></Guard>} />
        <Route path="/cameras"   element={<Guard><Layout><Wrap><CameraPage /></Wrap></Layout></Guard>} />
        <Route path="/sales"     element={<Guard><Layout><Wrap><SalesPage /></Wrap></Layout></Guard>} />
        <Route path="/inventory" element={<Guard><Layout><Wrap><InventoryPage /></Wrap></Layout></Guard>} />
        <Route path="/footfall"  element={<Guard><Layout><Wrap><FootfallPage /></Wrap></Layout></Guard>} />
        <Route path="/staff"     element={<Guard><Layout><Wrap><StaffPage /></Wrap></Layout></Guard>} />
        <Route path="/map"       element={<Guard><Layout><Wrap><StoreMapPage /></Wrap></Layout></Guard>} />
        <Route path="/alerts"    element={<Guard><Layout><Wrap><AlertsPage /></Wrap></Layout></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
