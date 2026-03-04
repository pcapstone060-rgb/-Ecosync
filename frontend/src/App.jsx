import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardShell from './layouts/DashboardLayout';
import Sidebar from './layouts/Sidebar';
import MobileNav from './layouts/MobileNav';
import ErrorBoundary from './components/ErrorBoundary';
import AIAssistant from './components/AIAssistant';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LocationProvider } from './contexts/LocationContext';


// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveMap = lazy(() => import('./pages/LiveMap'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AlertPage = lazy(() => import('./pages/AlertPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Settings = lazy(() => import('./pages/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile')); // [NEW]
const GlobalView = lazy(() => import('./pages/GlobalView')); // [NEW]
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage')); // [NEW]
const AboutProject = lazy(() => import('./pages/AboutProject')); // [NEW]
const ContactSupport = lazy(() => import('./pages/ContactSupport')); // [NEW]
const SafetyHub = lazy(() => import('./pages/SafetyHub')); // [NEW]
const VerifyEnv = lazy(() => import('./pages/VerifyEnv'));

import API_BASE_URL from "./config";
const API_BASE = API_BASE_URL;

// Loading Fallback
const PageLoader = () => (
  <div className="flex h-full w-full items-center justify-center bg-transparent">
    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main Layout
const MainLayout = ({ children }) => (
  <div className="flex h-screen w-full bg-[#030712] text-slate-200 overflow-hidden font-outfit relative">
    <div className="mouse-glow" />
    <AIAssistant />
    <Sidebar />
    <MobileNav />
    <main className="flex-1 h-full overflow-y-auto relative z-10 scrollbar-hide pb-20 lg:pb-0">
      <div className="page-sweep" />
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </main>
  </div>
);

// Fullscreen Layout (No Sidebar)
const FullscreenLayout = ({ children }) => (
  <div className="flex h-screen w-full bg-[#030712] text-slate-200 overflow-hidden font-outfit relative">
    <div className="mouse-glow" />
    <AIAssistant />
    <main className="flex-1 h-full overflow-y-auto relative z-10 scrollbar-hide">
      <div className="page-sweep" />
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </main>
  </div>
);

function AppContent() {
  const navigate = useNavigate();

  // Mouse Glow Effect
  useEffect(() => {
    let frameId;
    const handleMouseMove = (e) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);


  return (
    <>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        } />

        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        } />

        <Route path="/alerts" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <AlertPage />
            </Suspense>
          </ProtectedRoute>
        } />



        <Route path="/about" element={
          <Suspense fallback={<PageLoader />}>
            <AboutProject />
          </Suspense>
        } />

        <Route path="/contact" element={
          <Suspense fallback={<PageLoader />}>
            <ContactSupport />
          </Suspense>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#030712] text-slate-200 overflow-hidden font-outfit relative">
              <div className="mouse-glow" />
              {/* <AIAssistant /> */}
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />

        {/* Map Route */}
        <Route path="/map" element={
          <ProtectedRoute>
            <MainLayout>
              <LiveMap />
            </MainLayout>
          </ProtectedRoute>
        } />



        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout>
              <Settings />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <MainLayout>
              <Analytics />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Global View Route */}
        <Route path="/global" element={
          <ProtectedRoute>
            <MainLayout>
              <GlobalView />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Routing Dashboard Sub-Pages via Main Dashboard Component */}
        <Route path="/safety" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#030712] text-slate-200 overflow-hidden font-outfit relative">
              <div className="mouse-glow" />
              <Dashboard initialView="safety" />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/about" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#030712] text-slate-200 overflow-hidden font-outfit relative">
              <div className="mouse-glow" />
              <Dashboard initialView="about" />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/support" element={
          <ProtectedRoute>
            <div className="flex h-screen w-full bg-[#030712] text-slate-200 overflow-hidden font-outfit relative">
              <div className="mouse-glow" />
              <Dashboard initialView="support" />
            </div>
          </ProtectedRoute>
        } />

        <Route path="/verify-env" element={<VerifyEnv />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <LocationProvider>
            <AppContent />
          </LocationProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
