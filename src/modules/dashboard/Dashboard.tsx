import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  UserX,
  FileCheck2,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { StatsCard } from '../../components/common/StatsCard';
import { getFirestoreStudents, getMonthlyAttendanceSheet } from '../../services/firebase/firestoreService';
import { Student } from '../../types';
import { formatDateIndo } from '../../utils/formatters';

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isAdmin, isTeacher, isPrincipal } = useAuth();
  const { schoolProfile } = useSchool();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const todayDay = now.getDate();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const spreadsheetUrl = schoolProfile?.spreadsheetUrl ||
    'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents();
        setStudents(studentList);
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const activeStudents = students.filter(s => s.status === 'Aktif');
  const inactiveStudents = students.filter(s => s.status !== 'Aktif');

  // Breakdown per class
  const classBreakdown = [1, 2, 3, 4, 5, 6].map(c => {
    const count = activeStudents.filter(s => s.class === String(c)).length;
    return { class: `Kelas ${c}`, count };
  });

  const teacherClass = user?.assignedClasses?.[0] || '1';
  const teacherStudents = activeStudents.filter(s => s.class === teacherClass);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-school-navy via-school-blue to-school-lightBlue text-white p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <img src="/logo_sd.png" alt="Logo SD" className="w-8 h-8 object-contain drop-shadow" />
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider inline-block">
              {schoolProfile?.name || 'SDN KESILIR 02 WULUHAN JEMBER'}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name || 'Pengguna'}!
          </h2>
          <p className="mt-2 text-slate-100 text-xs md:text-sm leading-relaxed">
            {isAdmin && 'Anda bertindak sebagai Administrator Utama. Kelola master siswa, penugasan guru, daftar hadir, nilai semester, serta akses langsung Google Spreadsheet master.'}
            {isTeacher && `Anda bertugas sebagai Wali Kelas ${teacherClass}. Anda dapat mengisi daftar hadir bulanan (1–31), menginput nilai formatif/sumatif, dan mencetak rapor F4 presisi.`}
            {isPrincipal && 'Pantau seluruh rekapitulasi kehadiran dan ketuntasan nilai siswa SDN Kesilir 02 kelas 1 sampai 6.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {/* Tombol Akses Langsung Google Spreadsheet untuk Administrator */}
            {isAdmin && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka & Edit di Google Spreadsheet Master</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 bg-white text-school-navy font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4 text-school-lightBlue" />
              <span>Daftar Hadir Siswa (1–31)</span>
            </button>

            <button
              onClick={() => onNavigate('grades')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Daftar Nilai Semester</span>
            </button>
          </div>
        </div>

        {/* Decorative Circle Background Pattern */}
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 rounded-full bg-white/10 pointer-events-none blur-2xl" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Siswa Terdaftar"
          value={`${activeStudents.length} Siswa`}
          subtitle={`SDN Kesilir 02 (${inactiveStudents.length} nonaktif)`}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Rombel Binaan"
          value={isTeacher ? `Kelas ${teacherClass}` : 'Kelas 1 s.d 6'}
          subtitle={isTeacher ? `${teacherStudents.length} siswa binaan` : '6 Rombongan Belajar'}
          icon={UserCheck}
          color="emerald"
        />
        <StatsCard
          title="Tahun Pelajaran"
          value={schoolProfile?.academicYear || '2026/2027'}
          subtitle={`Semester ${schoolProfile?.activeSemester || '1'}`}
          icon={FileCheck2}
          color="indigo"
        />
        <StatsCard
          title="Status Sinkronisasi"
          value="Siap Terhubung"
          subtitle="Google Sheets & Firebase"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Visual Charts & Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: Siswa per Kelas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Distribusi Siswa SDN Kesilir 02</h3>
              <p className="text-xs text-slate-500">Jumlah siswa aktif pada masing-masing rombongan belajar</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              Total {activeStudents.length} Siswa
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="class" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F2B5C', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="count" name="Siswa Aktif" fill="#1E40AF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Integrasi Google Spreadsheet Langsung */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm md:text-base">
                Google Sheets Master
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Semua data siswa, absensi, dan nilai dapat Anda buka dan edit langsung di lembar kerja Google Sheets secara bebas tanpa batas.
            </p>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-2">
            <p className="font-bold">Akses Administrator:</p>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              Buka spreadsheet master sekolah untuk menambah/mengedit pengguna, guru, siswa, dan pengaturan.
            </p>
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs transition"
            >
              <span>Buka di Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kop Resmi:</span>
            <span className="font-semibold text-slate-700">SDN Kesilir 02 Jember</span>
          </div>
        </div>
      </div>
    </div>
  );
};
