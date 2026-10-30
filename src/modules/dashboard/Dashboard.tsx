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
import { getFirestoreStudents, getFirestoreAttendance } from '../../services/firebase/firestoreService';
import { Student, AttendanceRecord } from '../../types';
import { getTodayDateString, formatDateIndo } from '../../utils/formatters';

interface DashboardProps {
  onNavigate: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isAdmin, isTeacher, isPrincipal } = useAuth();
  const { schoolProfile } = useSchool();

  const [students, setStudents] = useState<Student[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = getTodayDateString();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents();
        setStudents(studentList);

        // Load today's attendance for relevant classes
        const targetClasses = isTeacher && user ? user.assignedClasses : ['1', '2', '3', '4', '5', '6'];
        let attList: AttendanceRecord[] = [];
        for (const cls of targetClasses) {
          const res = await getFirestoreAttendance(cls, todayStr);
          attList = [...attList, ...res];
        }
        setTodayAttendance(attList);
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, isTeacher, todayStr]);

  // Calculations for Admin / Kepsek
  const activeStudents = students.filter(s => s.status === 'Aktif');
  const inactiveStudents = students.filter(s => s.status !== 'Aktif');

  // Breakdown per class (1-6)
  const classBreakdown = [1, 2, 3, 4, 5, 6].map(c => {
    const count = activeStudents.filter(s => s.class === String(c)).length;
    return { class: `Kelas ${c}`, count };
  });

  // Attendance metrics today
  const presentCount = todayAttendance.filter(a => a.status === 'Hadir').length;
  const sickCount = todayAttendance.filter(a => a.status === 'Sakit').length;
  const permitCount = todayAttendance.filter(a => a.status === 'Izin').length;
  const absentCount = todayAttendance.filter(a => a.status === 'Alpa').length;
  const totalRecordedToday = todayAttendance.length;

  const attendanceRate = totalRecordedToday > 0
    ? Math.round((presentCount / totalRecordedToday) * 100)
    : 0;

  // Teacher specific data
  const teacherClass = user?.assignedClasses?.[0] || '1';
  const teacherStudents = activeStudents.filter(s => s.class === teacherClass);
  const teacherTodayAtt = todayAttendance.filter(a => a.class === teacherClass);
  const isTeacherAttendanceFilled = teacherTodayAtt.length > 0;

  const attendancePieData = [
    { name: 'Hadir', value: presentCount, color: '#10B981' },
    { name: 'Sakit', value: sickCount, color: '#3B82F6' },
    { name: 'Izin', value: permitCount, color: '#F59E0B' },
    { name: 'Alpa', value: absentCount, color: '#EF4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-linear-to-r from-school-navy via-school-blue to-school-lightBlue text-white p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider inline-block mb-3">
            {schoolProfile?.name || 'SIAKAD SD'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name || 'Pengguna'}!
          </h2>
          <p className="mt-2 text-slate-100 text-xs md:text-sm leading-relaxed">
            {isAdmin && 'Anda memiliki hak akses penuh untuk mengelola master siswa, absensi, nilai, integrasi Google Workspace, dan konfigurasi sekolah.'}
            {isTeacher && `Anda bertugas sebagai Wali Kelas ${teacherClass}. Anda dapat mengisi absensi harian, menginput nilai asesmen, dan mencetak rapor siswa kelas Anda.`}
            {isPrincipal && 'Pantau seluruh statistik kehadiran siswa, ketuntasan input nilai guru, serta rekapitulasi capaian belajar kelas 1 sampai 6.'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {isTeacher && (
              <>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="px-4 py-2 bg-white text-school-navy font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow flex items-center gap-1.5"
                >
                  <CalendarCheck className="w-4 h-4 text-school-lightBlue" />
                  <span>{isTeacherAttendanceFilled ? 'Perbarui Absensi Hari Ini' : 'Isi Absensi Hari Ini'}</span>
                </button>
                <button
                  onClick={() => onNavigate('grades')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Input Nilai Asesmen</span>
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => onNavigate('sync')}
                  className="px-4 py-2 bg-white text-school-navy font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow flex items-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-school-lightBlue" />
                  <span>Pusat Sinkronisasi Data</span>
                </button>
                <button
                  onClick={() => onNavigate('students')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Kelola Siswa</span>
                </button>
              </>
            )}

            {isPrincipal && (
              <button
                onClick={() => onNavigate('reports')}
                className="px-4 py-2 bg-white text-school-navy font-bold text-xs rounded-xl hover:bg-slate-100 transition shadow flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-school-lightBlue" />
                <span>Cetak Rekap Laporan Sekolah</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative Circle Background Pattern */}
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 rounded-full bg-white/10 pointer-events-none blur-2xl" />
      </div>

      {/* KPI Cards Grid */}
      {isTeacher ? (
        // Teacher KPI Cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={`Siswa Kelas ${teacherClass}`}
            value={`${teacherStudents.length} Siswa`}
            subtitle="Siswa Aktif Terdaftar"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Absensi Hari Ini"
            value={isTeacherAttendanceFilled ? `${teacherTodayAtt.length} Tercatat` : 'Belum Diisi'}
            subtitle={formatDateIndo(todayStr)}
            icon={CalendarCheck}
            color={isTeacherAttendanceFilled ? 'emerald' : 'amber'}
          />
          <StatsCard
            title="Tingkat Hadir"
            value={`${attendanceRate}%`}
            subtitle={`${presentCount} dari ${teacherTodayAtt.length || teacherStudents.length} hadir`}
            icon={UserCheck}
            color="emerald"
          />
          <StatsCard
            title="Semester Aktif"
            value={`Semester ${schoolProfile?.activeSemester || '1'}`}
            subtitle={`TA ${schoolProfile?.academicYear || '2026/2027'}`}
            icon={FileCheck2}
            color="indigo"
          />
        </div>
      ) : (
        // Admin & Principal KPI Cards
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Siswa Aktif"
            value={`${activeStudents.length} Siswa`}
            subtitle={`${inactiveStudents.length} nonaktif/pindah/lulus`}
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="Kehadiran Hari Ini"
            value={`${presentCount} Hadir`}
            subtitle={`${totalRecordedToday} siswa terdata hari ini`}
            icon={UserCheck}
            color="emerald"
          />
          <StatsCard
            title="Persentase Kehadiran"
            value={`${attendanceRate}%`}
            subtitle="Rata-rata kehadiran hari ini"
            icon={TrendingUp}
            color={attendanceRate >= 85 ? 'emerald' : 'amber'}
          />
          <StatsCard
            title="Ketidakhadiran"
            value={`${sickCount + permitCount + absentCount} Siswa`}
            subtitle={`S: ${sickCount} | I: ${permitCount} | A: ${absentCount}`}
            icon={UserX}
            color="rose"
          />
        </div>
      )}

      {/* Visual Charts & Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: Siswa per Kelas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Distribusi Siswa Kelas 1–6</h3>
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

        {/* Right Card: Status Kehadiran Hari Ini */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base">Rekap Kehadiran Hari Ini</h3>
            <p className="text-xs text-slate-500">{formatDateIndo(todayStr)}</p>
          </div>

          {totalRecordedToday > 0 ? (
            <div className="space-y-4">
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {attendancePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <span className="text-emerald-800 font-semibold">Hadir</span>
                  <span className="font-bold text-emerald-900">{presentCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <span className="text-blue-800 font-semibold">Sakit</span>
                  <span className="font-bold text-blue-900">{sickCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <span className="text-amber-800 font-semibold">Izin</span>
                  <span className="font-bold text-amber-900">{permitCount}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                  <span className="text-rose-800 font-semibold">Alpa</span>
                  <span className="font-bold text-rose-900">{absentCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4">
              <Clock className="w-10 h-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-xs">Belum ada absensi diisi hari ini</p>
              <p className="text-[11px] text-slate-400 mt-1">Guru kelas dapat mengisi absensi melalui menu Absensi Harian.</p>
              <button
                onClick={() => onNavigate('attendance')}
                className="mt-4 px-3 py-1.5 bg-school-navy text-white text-xs font-semibold rounded-lg hover:bg-school-blue transition"
              >
                Buka Form Absensi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
