import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAppStore } from './store/appStore';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import EquipmentExplorer from './pages/EquipmentExplorer';
import SmartBooking from './pages/SmartBooking';
import MyRequests from './pages/MyRequests';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import FacultyApprovals from './pages/FacultyApprovals';

function MainAppContent() {
  const { state } = useAppStore();
  const { activePage } = state;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'explorer':
        return <EquipmentExplorer />;
      case 'booking':
        return <SmartBooking />;
      case 'requests':
        return <MyRequests />;
      case 'projects':
        return <Projects />;
      case 'analytics':
        return <Analytics />;
      case 'assistant':
        return <AIAssistant />;
      case 'approvals':
        return <FacultyApprovals />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0e0e11',
            color: '#ececf0',
            border: '1px solid rgba(255,106,0,0.5)',
            boxShadow: '0 0 24px rgba(255,106,0,0.25)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#ff6a00', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#000' } },
        }}
      />
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
