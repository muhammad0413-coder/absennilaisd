import React, { useState, useEffect } from 'react';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SchoolProvider } from './contexts/SchoolContext';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { StudentParentPortal } from './modules/portal/StudentParentPortal';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [showStudentPortal, setShowStudentPortal] = useState(() => {
    return window.location.search.includes('portal=true');
  });

  useEffect(() => {
    const handlePopState = () => {
      setShowStudentPortal(window.location.search.includes('portal=true'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-school-lightBlue border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm tracking-wide">Memuat Sistem Informasi Sekolah...</p>
      </div>
    );
  }

  // If in Student / Parent Portal Mode
  if (showStudentPortal) {
    return (
      <StudentParentPortal
        onBackToStaffLogin={() => {
          setShowStudentPortal(false);
          const url = new URL(window.location.href);
          url.searchParams.delete('portal');
          window.history.pushState({}, '', url.toString());
        }}
      />
    );
  }

  // If not logged in, show Staff Login Page
  if (!user) {
    return (
      <LoginPage
        onOpenStudentPortal={() => {
          setShowStudentPortal(true);
          const url = new URL(window.location.href);
          url.searchParams.set('portal', 'true');
          window.history.pushState({}, '', url.toString());
        }}
      />
    );
  }

  // Logged-in Staff Application Layout
  return <AppLayout />;
};

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <SchoolProvider>
          <MainAppContent />
        </SchoolProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}
