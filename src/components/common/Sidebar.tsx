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
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

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
  const { user, logout, isAdmin } = useAuth();
  const { schoolProfile } = useSchool();

  const spreadsheetUrl = schoolProfile?.spreadsheetUrl ||
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

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
      label: 'Absensi Siswa (1–31)',
      icon: CalendarCheck2,
      roles: ['admin', 'guru'],
    },
    {
      id: 'attendance-recap',
      label: 'Rekap Absensi',
      icon: BarChart3,
      roles: ['admin', 'guru', 'kepsek'],
    },
    {
      id: 'grades',
      label: 'Daftar Nilai Semester',
      icon: GraduationCap,
      roles: ['admin', 'guru'],
    },
    {
      id: 'grades-recap',
      label: 'Rekap Nilai & Leger',
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
      label: 'Sinkronisasi Data',
      icon: RefreshCw,
      roles: ['admin'],
    },
    {
      id: 'users',
      label: 'Pengguna & Guru',
      icon: UserCog,
      roles: ['admin'],
    },
    {
      id: 'settings',
      label: 'Pengaturan Sekolah',
      icon: Settings,
      roles: ['admin'],
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
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 bg-black/10">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo_sd.png"
              alt="Logo SDN Kesilir 02"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-extrabold text-xs tracking-wide text-white block">
                SDN KESILIR 02
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                Wuluhan, Jember
              </span>
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
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
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

        {/* Bottom Actions & Shortcuts */}
        <div className="p-3 border-t border-white/10 bg-black/20 space-y-2">
          {/* Link Langsung Google Sheets untuk Admin */}
          {isAdmin && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Sheets Master</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          )}

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
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
