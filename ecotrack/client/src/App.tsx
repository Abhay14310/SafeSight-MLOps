// src/App.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useStore from '@/store/useStore';
import Layout      from '@/components/Layout';
import Login       from '@/pages/Login';
import Dashboard   from '@/pages/Dashboard';
import WasteLogPage from '@/pages/WasteLogPage';
import FleetPage   from '@/pages/FleetPage';
import BinsPage    from '@/pages/BinsPage';
import RoutesPage  from '@/pages/RoutesPage';
import SchedulePage from '@/pages/SchedulePage';
import ReportsPage from '@/pages/ReportsPage';
import AlertsPage  from '@/pages/AlertsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import TasukeRedirect from '@/pages/TasukeRedirect';
import WasteCameraPage from '@/pages/WasteCameraPage';

const PV = { initial:{opacity:0,y:8}, animate:{opacity:1,y:0,transition:{duration:0.32,ease:[0.16,1,0.3,1]}}, exit:{opacity:0,y:-8,transition:{duration:0.18}} };

function Guard({ children }: { children: React.ReactNode }) {
  return useStore(s=>s.isAuth) ? <>{children}</> : <Navigate to="/login" replace />;
}
function W({ children }: { children: React.ReactNode }) {
  return <motion.div variants={PV} initial="initial" animate="animate" exit="exit" style={{width:'100%',height:'100%'}}>{children}</motion.div>;
}

export default function App() {
  const loc = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/login"    element={<W><Login /></W>} />
        <Route path="/tasuke"   element={<Guard><W><TasukeRedirect /></W></Guard>} />
        <Route path="/"         element={<Guard><Layout><W><Dashboard /></W></Layout></Guard>} />
        <Route path="/waste"    element={<Guard><Layout><W><WasteLogPage /></W></Layout></Guard>} />
        <Route path="/camera"   element={<Guard><Layout><W><WasteCameraPage /></W></Layout></Guard>} />
        <Route path="/fleet"    element={<Guard><Layout><W><FleetPage /></W></Layout></Guard>} />
        <Route path="/bins"     element={<Guard><Layout><W><BinsPage /></W></Layout></Guard>} />
        <Route path="/routes"   element={<Guard><Layout><W><RoutesPage /></W></Layout></Guard>} />
        <Route path="/schedule" element={<Guard><Layout><W><SchedulePage /></W></Layout></Guard>} />
        <Route path="/reports"  element={<Guard><Layout><W><ReportsPage /></W></Layout></Guard>} />
        <Route path="/alerts"   element={<Guard><Layout><W><AlertsPage /></W></Layout></Guard>} />
        <Route path="/profile"  element={<Guard><Layout><W><ProfilePage /></W></Layout></Guard>} />
        <Route path="/settings" element={<Guard><Layout><W><SettingsPage /></W></Layout></Guard>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
