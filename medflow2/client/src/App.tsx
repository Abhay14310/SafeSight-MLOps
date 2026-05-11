// src/App.tsx
import React from 'react';
import { Routes,Route,Navigate,useLocation } from 'react-router-dom';
import { AnimatePresence,motion } from 'framer-motion';
import useStore from './store/useStore';
import Layout         from './components/Layout';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import PatientMonitor from './pages/PatientMonitor';
import PoseAnalysis   from './pages/PoseAnalysis';
import NurseStation   from './pages/NurseStation';
import DockerDeploy   from './pages/DockerDeploy';
import AlertsPage     from './pages/AlertsPage';
import ProfilePage    from './pages/ProfilePage';
import SettingsPage   from './pages/SettingsPage';
import TasukeGateway  from './pages/TasukeGateway';
import PatientsPage   from './pages/PatientsPage';

const PV={ initial:{opacity:0,y:8},animate:{opacity:1,y:0,transition:{duration:0.3,ease:[.16,1,.3,1]}},exit:{opacity:0,y:-8,transition:{duration:0.18}} };
/**
 * Renders its children for authenticated users and redirects unauthenticated users to the login page.
 *
 * @param children - Content to render when the user is authenticated
 * @returns The provided `children` when authenticated, otherwise a `Navigate` element that redirects to `"/login"`
 */
function Guard({children}:{children:React.ReactNode}){ return useStore(s=>s.isAuth)?<>{children}</>:<Navigate to="/login" replace/>; }
function W({children}:{children:React.ReactNode}){ return <motion.div variants={PV} initial="initial" animate="animate" exit="exit" style={{width:'100%',height:'100%'}}>{children}</motion.div>; }

/**
 * Application root component that defines client routes and coordinates animated page transitions.
 *
 * Renders route definitions for public and authenticated pages, wraps authenticated routes with the app layout and guards, and uses AnimatePresence to animate route changes.
 *
 * @returns A React element that renders the application's routes with authentication guards and animated transitions.
 */
export default function App(){
  const loc=useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route path="/login"   element={<W><Login/></W>}/>
        <Route path="/tasuke"  element={<Guard><W><TasukeGateway/></W></Guard>}/>
        <Route path="/"        element={<Guard><Layout><W><Dashboard/></W></Layout></Guard>}/>
        <Route path="/monitor"  element={<Guard><Layout><W><PatientMonitor/></W></Layout></Guard>}/>
        <Route path="/patients" element={<Guard><Layout><W><PatientsPage/></W></Layout></Guard>}/>
        <Route path="/pose"    element={<Guard><Layout><W><PoseAnalysis/></W></Layout></Guard>}/>
        <Route path="/nurse"   element={<Guard><Layout><W><NurseStation/></W></Layout></Guard>}/>
        <Route path="/docker"  element={<Guard><Layout><W><DockerDeploy/></W></Layout></Guard>}/>
        <Route path="/alerts"  element={<Guard><Layout><W><AlertsPage/></W></Layout></Guard>}/>
        <Route path="/profile" element={<Guard><Layout><W><ProfilePage/></W></Layout></Guard>}/>
        <Route path="/settings"element={<Guard><Layout><W><SettingsPage/></W></Layout></Guard>}/>
        <Route path="*"        element={<Navigate to="/" replace/>}/>
      </Routes>
    </AnimatePresence>
  );
}
