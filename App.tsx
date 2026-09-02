import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import FinancePage from './pages/FinancePage';
import FamilyPage from './pages/FamilyPage';
import HealthPage from './pages/HealthPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import MedicinesSettingsPage from './pages/MedicinesSettingsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import RestockPage from './pages/RestockPage';
import MedicalProfilePage from './pages/MedicalProfilePage';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import { Toaster } from 'react-hot-toast';

const ThemedApp = () => {
  const { theme } = useAppContext();
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: theme === 'dark' ? '#27272A' : '#FFFFFF',
            color: theme === 'dark' ? '#FAFAFA' : '#1E293B',
            border: `1px solid ${theme === 'dark' ? '#3F3F46' : '#E2E8F0'}`,
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/family" element={<FamilyPage />} />
            <Route path="/family/:memberId" element={<MedicalProfilePage />} />
            <Route path="/calendar" element={<CalendarPage />} /> 
            <Route path="/health" element={<HealthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/medicines" element={<MedicinesSettingsPage />} />
            <Route path="/settings/appointments" element={<AppointmentsPage />} />
            <Route path="/restock" element={<RestockPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}

export default App;
