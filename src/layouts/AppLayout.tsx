import React, { useState } from 'react';
import { Header } from '../components/common/Header';
import { Sidebar, ActiveTab } from '../components/common/Sidebar';
import { ConnectionStatusBanner } from '../components/common/ConnectionStatusBanner';
import { ProfileModal } from '../components/common/ProfileModal';
import { Dashboard } from '../modules/dashboard/Dashboard';
import { StudentList } from '../modules/students/StudentList';
import { AttendanceDaily } from '../modules/attendance/AttendanceDaily';
import { AttendanceRecap } from '../modules/attendance/AttendanceRecap';
import { GradeInput } from '../modules/grades/GradeInput';
import { GradeRecap } from '../modules/grades/GradeRecap';
import { ReportCardView } from '../modules/report-cards/ReportCardView';
import { PrintCenter } from '../modules/reports/PrintCenter';
import { SyncDashboard } from '../modules/synchronization/SyncDashboard';
import { UserManagement } from '../modules/users/UserManagement';
import { SchoolSettings } from '../modules/settings/SchoolSettings';

export const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Realtime 4-Pillar Status Banner */}
        <ConnectionStatusBanner />

        {/* Scrollable Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
            {activeTab === 'students' && <StudentList />}
            {activeTab === 'attendance' && <AttendanceDaily />}
            {activeTab === 'attendance-recap' && <AttendanceRecap />}
            {activeTab === 'grades' && <GradeInput />}
            {activeTab === 'grades-recap' && <GradeRecap />}
            {activeTab === 'report-cards' && <ReportCardView />}
            {activeTab === 'reports' && <PrintCenter onNavigate={setActiveTab} />}
            {activeTab === 'sync' && <SyncDashboard />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'settings' && <SchoolSettings />}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
