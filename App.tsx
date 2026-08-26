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

const ThemedApp = () => {
  const { theme } = useAppContext();
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
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
        </Routes>
      </Layout>
    </HashRouter>
  )
}

function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}

export default App;