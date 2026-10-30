import React from 'react';
import { Menu, LogOut, User, Bell, Shield, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenProfile }) => {
  const { user, logout } = useAuth();
  const { schoolProfile } = useSchool();

  const roleLabelMap = {
    admin: 'Administrator',
    guru: 'Guru Kelas',
    kepsek: 'Kepala Sekolah',
  };

  const roleBadgeColor = {
    admin: 'bg-rose-100 text-rose-800 border-rose-200',
    guru: 'bg-blue-100 text-blue-800 border-blue-200',
    kepsek: 'bg-purple-100 text-purple-800 border-purple-200',
  }[user?.role || 'guru'];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs print:hidden">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img src={schoolProfile?.logoUrl || '/logo.svg'} alt="Logo" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="font-bold text-sm md:text-base text-school-navy leading-tight">
              {schoolProfile?.name || 'SD NEGERI 01'}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Tahun Ajaran: {schoolProfile?.academicYear || '2026/2027'} (Semester {schoolProfile?.activeSemester || '1'})
            </p>
          </div>
        </div>
      </div>

      {/* Right: User Information & Action Menu */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleBadgeColor}`}>
              {roleLabelMap[user.role]} {user.role === 'guru' && user.assignedClasses.length > 0 && `(Kelas ${user.assignedClasses.join(', ')})`}
            </span>
          </div>
        )}

        {/* User Profile Button */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
          title="Buka Profil"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-school-navy text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
          )}
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[150px]">{user?.name}</p>
            <p className="text-[10px] text-slate-500">{user?.email}</p>
          </div>
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          title="Keluar dari Sistem"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
