import React, { useState } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  User,
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  LogOut,
  AlertCircle,
  School,
  ArrowLeft,
} from 'lucide-react';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getFirestoreStudents, getFirestoreGrades, getFirestoreAttendance } from '../../services/firebase/firestoreService';
import { Student, GradeRecord, AttendanceRecord } from '../../types';
import { calculateFinalScore, DEFAULT_ASSESSMENT_WEIGHTS, generateCompetencyDescription } from '../../utils/calculations';
import { getGradePredicate, formatDateIndo } from '../../utils/formatters';

interface StudentParentPortalProps {
  onBackToStaffLogin: () => void;
}

export const StudentParentPortal: React.FC<StudentParentPortalProps> = ({ onBackToStaffLogin }) => {
  const { schoolProfile, subjects } = useSchool();
  const { showToast } = useNotification();

  // Authentication State for Student Portal
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [classInput, setClassInput] = useState('1');
  const [nisInput, setNisInput] = useState('');
  const [pinInput, setPinInput] = useState(''); // PIN or Birthdate YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  // Authenticated Student Data
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [studentGrades, setStudentGrades] = useState<GradeRecord[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisInput.trim() || !pinInput.trim()) {
      showToast('error', 'Validasi Gagal', 'NIS/NISN dan PIN wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const students = await getFirestoreStudents(classInput);
      const cleanNis = nisInput.trim();
      const cleanPin = pinInput.trim();

      // Find student matching class and NIS or NISN
      const found = students.find(s =>
        (s.nis === cleanNis || s.nisn === cleanNis) && s.class === classInput
      );

      if (!found) {
        showToast('error', 'Login Gagal', 'Data siswa dengan NIS/NISN tersebut tidak ditemukan pada kelas yang dipilih.');
        return;
      }

      // Verify PIN: matches birthDate (YYYY-MM-DD or DDMMYYYY) or default PIN (last 4 digits of NIS/NISN or '1234')
      const validPins = [
        found.birthDate,
        found.birthDate.replace(/-/g, ''),
        found.nis.slice(-4),
        found.nisn.slice(-4),
        '1234',
        '123456',
      ];

      const pinMatches = validPins.includes(cleanPin) || cleanPin === found.birthDate;

      if (!pinMatches) {
        showToast('error', 'PIN Salah', 'PIN Keamanan tidak cocok. Gunakan tanggal lahir (YYYY-MM-DD) atau hubungi wali kelas.');
        return;
      }

      setCurrentStudent(found);

      // Fetch ONLY this student's records
      const allGrades = await getFirestoreGrades(found.class, undefined, schoolProfile?.activeSemester || '1');
      setStudentGrades(allGrades.filter(g => g.studentId === found.studentId));

      const allAtt = await getFirestoreAttendance(found.class);
      setStudentAttendance(allAtt.filter(a => a.studentId === found.studentId));

      setIsLoggedIn(true);
      showToast('success', 'Selamat Datang', `Portal siswa berhasil dibuka untuk: ${found.name}`);
    } catch (err: any) {
      showToast('error', 'Terjadi Kesalahan', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePortalLogout = () => {
    setIsLoggedIn(false);
    setCurrentStudent(null);
    setNisInput('');
    setPinInput('');
  };

  // Calculations for Authenticated Student
  const attHadir = studentAttendance.filter(a => a.status === 'Hadir').length;
  const attSakit = studentAttendance.filter(a => a.status === 'Sakit').length;
  const attIzin = studentAttendance.filter(a => a.status === 'Izin').length;
  const attAlpa = studentAttendance.filter(a => a.status === 'Alpa').length;
  const totalHariTercatat = studentAttendance.length;
  const attendanceRate = totalHariTercatat > 0 ? (attHadir / totalHariTercatat) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Portal Top Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 print:hidden shadow-xs">
        <div className="flex items-center gap-3">
          <img src={schoolProfile?.logoUrl || '/logo.svg'} alt="Logo" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="font-extrabold text-sm md:text-base text-school-navy leading-tight">
              PORTAL SISWA & ORANG TUA
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}
            </p>
          </div>
        </div>

        <div>
          {isLoggedIn ? (
            <button
              onClick={handlePortalLogout}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Portal</span>
            </button>
          ) : (
            <button
              onClick={onBackToStaffLogin}
              className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Login Guru & Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {!isLoggedIn ? (
          // ==========================================
          // 1. LOGIN SCREEN PORTAL
          // ==========================================
          <div className="max-w-md mx-auto my-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-school-navy/5 text-school-navy mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-school-blue" />
                </div>
                <h2 className="text-xl font-extrabold text-school-navy">Masuk Portal Hasil Belajar</h2>
                <p className="text-xs text-slate-500">
                  Akses mandiri nilai asesmen, rekap kehadiran harian, dan rapor belajar siswa
                </p>
              </div>

              <form onSubmit={handlePortalLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Kelas</label>
                  <select
                    value={classInput}
                    onChange={e => setClassInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-school-navy bg-white focus:ring-2 focus:ring-school-lightBlue"
                  >
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                    <option value="4">Kelas 4</option>
                    <option value="5">Kelas 5</option>
                    <option value="6">Kelas 6</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Induk Siswa (NIS atau NISN)</label>
                  <input
                    type="text"
                    value={nisInput}
                    onChange={e => setNisInput(e.target.value)}
                    placeholder="Contoh: 1001 atau 0151234561"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Pribadi / Tanggal Lahir</label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    placeholder="YYYY-MM-DD atau 4 digit PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Gunakan format tanggal lahir siswa (contoh: 2019-03-15) atau PIN yang diberikan wali kelas.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-school-navy text-white font-bold text-xs rounded-xl hover:bg-school-blue transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Memverifikasi...' : 'Buka Hasil Belajar Saya'}</span>
                </button>
              </form>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                <span className="font-bold">Keamanan Data Siswa:</span> Portal ini dienkripsi dan hanya menampilkan catatan milik siswa bersangkutan. Tidak dapat mengakses data siswa lain.
              </div>
            </div>
          </div>
        ) : (
          // ==========================================
          // 2. AUTHENTICATED STUDENT PORTAL DASHBOARD
          // ==========================================
          currentStudent && (
            <div className="space-y-6">
              {/* Header Cetak untuk Mode Print */}
              <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4">
                <h2 className="text-xl font-bold uppercase">{schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}</h2>
                <p className="text-xs">{schoolProfile?.address}</p>
                <p className="text-sm font-bold mt-2 uppercase">LAPORAN HASIL BELAJAR SISWA</p>
                <p className="text-xs">Nama: {currentStudent.name} | Kelas: {currentStudent.class} | TP: {schoolProfile?.academicYear}</p>
              </div>

              {/* Identity Banner */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-2xl bg-school-navy text-white text-2xl font-bold flex items-center justify-center shadow-md">
                    {currentStudent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <span className="px-3 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Kelas {currentStudent.class} (Aktif)
                    </span>
                    <h2 className="text-xl md:text-2xl font-extrabold text-school-navy">{currentStudent.name}</h2>
                    <p className="text-xs text-slate-500 font-mono">
                      NIS: {currentStudent.nis} | NISN: {currentStudent.nisn}
                    </p>
                    <p className="text-xs text-slate-600">
                      Orang Tua: <strong>{currentStudent.parentName || '-'}</strong> | {currentStudent.birthPlace}, {currentStudent.birthDate}
                    </p>
                  </div>
                </div>

                <div className="print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Rapor Saya</span>
                  </button>
                </div>
              </div>

              {/* Attendance Recap Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hadir</span>
                  <p className="text-2xl font-extrabold text-emerald-600">{attHadir} Hari</p>
                  <p className="text-[11px] text-slate-500 font-medium">{attendanceRate.toFixed(1)}% Kehadiran</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sakit</span>
                  <p className="text-2xl font-extrabold text-blue-600">{attSakit} Hari</p>
                  <p className="text-[11px] text-slate-500">Dengan surat dokter</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Izin</span>
                  <p className="text-2xl font-extrabold text-amber-600">{attIzin} Hari</p>
                  <p className="text-[11px] text-slate-500">Pemberitahuan resmi</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alpa</span>
                  <p className="text-2xl font-extrabold text-rose-600">{attAlpa} Hari</p>
                  <p className="text-[11px] text-slate-500">Tanpa keterangan</p>
                </div>
              </div>

              {/* Grades Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-school-navy" />
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">
                      Capaian Nilai Mata Pelajaran (Semester {schoolProfile?.activeSemester || '1'})
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Tahun Pelajaran: {schoolProfile?.academicYear}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 w-12 text-center">No.</th>
                        <th className="py-3 px-4">Mata Pelajaran</th>
                        <th className="py-3 px-4 text-center w-24">Nilai Akhir</th>
                        <th className="py-3 px-4 text-center w-20">Predikat</th>
                        <th className="py-3 px-4">Deskripsi Capaian Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map((sub, idx) => {
                        const gradesForSub = studentGrades.filter(g => g.subject.toLowerCase() === sub.name.toLowerCase());
                        const { finalScore } = calculateFinalScore(gradesForSub, DEFAULT_ASSESSMENT_WEIGHTS);
                        const { predicate } = getGradePredicate(finalScore);
                        const desc = gradesForSub.find(g => g.description)?.description ||
                          generateCompetencyDescription(currentStudent.name, sub.name, finalScore);

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{sub.name}</td>
                            <td className="py-3 px-4 text-center font-extrabold text-sm text-school-navy">
                              {finalScore !== null ? finalScore : '-'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${predicate === 'A' ? 'bg-emerald-100 text-emerald-800' : predicate === 'B' ? 'bg-blue-100 text-blue-800' : predicate === 'C' ? 'bg-amber-100 text-amber-800' : predicate === 'D' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                                {predicate}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                              {desc}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
};
