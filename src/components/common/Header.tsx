import React from 'react';
import { Menu, LogOut, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenProfile }) => {
  const { user, logout, isAdmin } = useAuth();
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

  const spreadsheetUrl = schoolProfile?.spreadsheetUrl ||
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

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
          <img
            src="/logo_sd.png"
            alt="Logo SDN Kesilir 02"
            className="w-9 h-9 object-contain"
          />
          <div>
            <h1 className="font-extrabold text-xs md:text-sm text-school-navy leading-tight">
              {schoolProfile?.name || 'SEKOLAH DASAR NEGERI KESILIR 02'}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              Kec. Wuluhan, Kab. Jember — TP {schoolProfile?.academicYear || '2026/2027'} (Sem {schoolProfile?.activeSemester || '1'})
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions, Google Sheet Link & User Info */}
      <div className="flex items-center gap-2.5">
        {/* Tombol Langsung Google Sheets untuk Administrator */}
        {isAdmin && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="Buka Database Master Google Spreadsheet untuk Edit Langsung"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Buka Google Spreadsheet</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        )}

        {/* Role Badge */}
        {user && (
          <div className="hidden md:flex items-center gap-1.5">
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
          <div className="hidden lg:block text-left">
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
