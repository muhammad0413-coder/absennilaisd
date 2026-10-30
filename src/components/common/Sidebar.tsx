import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  BarChart3,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  UserCog,
  Settings,
  LogOut,
  X,
  School,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'attendance-recap'
  | 'grades'
  | 'grades-recap'
  | 'report-cards'
  | 'reports'
  | 'sync'
  | 'users'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { user, logout, isAdmin, isTeacher, isPrincipal } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'students',
      label: 'Data Siswa',
      icon: Users,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'attendance',
      label: 'Absensi',
      icon: CalendarCheck2,
      roles: ['admin', 'guru'], // Guru inputs, Admin can view/input
    },
    {
      id: 'attendance-recap',
      label: 'Rekap Absensi',
      icon: BarChart3,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'grades',
      label: 'Input Nilai',
      icon: GraduationCap,
      roles: ['admin', 'guru'],
    },
    {
      id: 'grades-recap',
      label: 'Rekap Nilai',
      icon: FileSpreadsheet,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'report-cards',
      label: 'Rapor Siswa',
      icon: FileText,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'reports',
      label: 'Cetak Laporan',
      icon: Printer,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'sync',
      label: 'Sinkronisasi',
      icon: RefreshCw,
      roles: ['admin'], // Admin only
    },
    {
      id: 'users',
      label: 'Pengguna',
      icon: UserCog,
      roles: ['admin'], // Admin only
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      roles: ['admin'], // Admin only
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || '')
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-school-navy text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Branding Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-black/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-school-lightBlue flex items-center justify-center shadow-inner">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-wide text-white block">SIAKAD SD</span>
              <span className="text-[10px] text-slate-300 font-medium">Sistem Absensi & Nilai</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-300 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menus List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </p>

          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as ActiveTab);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-school-lightBlue text-white shadow-md font-semibold'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions & User Profile Card */}
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-2">
          {/* Portal Link Shortcut */}
          <a
            href="?portal=true"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-school-sky" />
              <span>Portal Siswa & Ortu</span>
            </span>
            <span className="text-[10px] bg-school-sky/20 text-school-sky px-1.5 py-0.5 rounded font-mono">Publik</span>
          </a>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
