import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getFirestoreStudents, getFirestoreAttendance } from '../../services/firebase/firestoreService';
import { exportToExcel } from '../../services/export/excelExport';
import { exportToCSV } from '../../services/export/csvExport';
import { Student, AttendanceRecord, StudentAttendanceRecap } from '../../types';
import { formatDateIndo, formatPercentage } from '../../utils/formatters';

export const AttendanceRecap: React.FC = () => {
  const { user, isAdmin, isTeacher, canAccessClass } = useAuth();
  const { schoolProfile } = useSchool();
  const { showToast } = useNotification();

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && user && user.assignedClasses.length > 0) {
      return user.assignedClasses[0];
    }
    return '1';
  });

  const [periodType, setPeriodType] = useState<'monthly' | 'semester' | 'custom'>('semester');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(schoolProfile?.activeSemester || '1');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents(selectedClass);
        setStudents(studentList.filter(s => s.status === 'Aktif'));

        const allAtt = await getFirestoreAttendance(selectedClass);
        setAttendanceRecords(allAtt);
      } catch (e: any) {
        showToast('error', 'Gagal Memuat Rekap', e.message);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessClass(selectedClass)) {
      loadData();
    }
  }, [selectedClass]);

  // Filter attendance records by selected period
  const filteredRecords = attendanceRecords.filter(r => {
    if (periodType === 'monthly') {
      return r.date.startsWith(selectedMonth);
    } else if (periodType === 'semester') {
      return r.semester === selectedSemester;
    } else if (periodType === 'custom') {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    }
    return true;
  });

  // Calculate distinct recorded dates (Hari Efektif Belajar yang ada absensi)
  const distinctDates = Array.from(new Set(filteredRecords.map(r => r.date))).sort();

  // Aggregate stats per student
  const recapData: StudentAttendanceRecap[] = students.map(s => {
    const studentRecords = filteredRecords.filter(r => r.studentId === s.studentId);
    let present = 0;
    let sick = 0;
    let permit = 0;
    let absent = 0;

    studentRecords.forEach(r => {
      if (r.status === 'Hadir') present++;
      else if (r.status === 'Sakit') sick++;
      else if (r.status === 'Izin') permit++;
      else if (r.status === 'Alpa') absent++;
    });

    const totalDays = studentRecords.length;
    // Persentase kehadiran = jumlah hadir / total hari tercatat * 100%
    // Hari tanpa data tidak dianggap alpa
    const rate = totalDays > 0 ? (present / totalDays) * 100 : 0;

    return {
      studentId: s.studentId,
      nis: s.nis,
      nisn: s.nisn,
      name: s.name,
      class: s.class,
      present,
      sick,
      permit,
      absent,
      totalDays,
      attendanceRate: rate,
    };
  });

  const visibleRecap = recapData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nis.includes(searchTerm)
  );

  const handleExportExcel = () => {
    const exportRows = visibleRecap.map((r, idx) => ({
      'No.': idx + 1,
      'NIS': r.nis,
      'NISN': r.nisn,
      'Nama Siswa': r.name,
      'Kelas': r.class,
      'Hadir (H)': r.present,
      'Sakit (S)': r.sick,
      'Izin (I)': r.permit,
      'Alpa (A)': r.absent,
      'Total Hari': r.totalDays,
      'Persentase Kehadiran': `${r.attendanceRate.toFixed(1)}%`,
    }));
    exportToExcel(exportRows, `Rekap_Absensi_Kelas_${selectedClass}_${periodType}`);
  };

  const handleExportCSV = () => {
    const exportRows = visibleRecap.map((r, idx) => ({
      No: idx + 1,
      NIS: r.nis,
      Nama: r.name,
      Kelas: r.class,
      Hadir: r.present,
      Sakit: r.sick,
      Izin: r.permit,
      Alpa: r.absent,
      Total: r.totalDays,
      Persen: `${r.attendanceRate.toFixed(1)}%`,
    }));
    exportToCSV(exportRows, `Rekap_Absensi_Kelas_${selectedClass}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Printable Header */}
      <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4">
        <h2 className="text-xl font-bold uppercase">{schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}</h2>
        <p className="text-xs">{schoolProfile?.address}</p>
        <p className="text-sm font-bold mt-2 uppercase">REKAPITULASI KEHADIRAN SISWA KELAS {selectedClass}</p>
        <p className="text-xs">
          Periode: {periodType === 'monthly' ? `Bulan ${selectedMonth}` : periodType === 'semester' ? `Semester ${selectedSemester} (${schoolProfile?.academicYear})` : `${startDate} s.d ${endDate}`} | Total Hari Belajar Terdata: {distinctDates.length} Hari
        </p>
      </div>

      {/* Screen Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Rekapitulasi Absensi Siswa</h2>
          <p className="text-xs text-slate-500">
            Analisis rekap kehadiran siswa bulanan, semester, atau rentang tanggal kustom
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak A4</span>
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Class */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Kelas:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={isTeacher && user?.assignedClasses.length === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-school-navy bg-white disabled:bg-slate-100"
              >
                <option value="1">Kelas 1</option>
                <option value="2">Kelas 2</option>
                <option value="3">Kelas 3</option>
                <option value="4">Kelas 4</option>
                <option value="5">Kelas 5</option>
                <option value="6">Kelas 6</option>
              </select>
            </div>

            {/* Period Type */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPeriodType('semester')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${periodType === 'semester' ? 'bg-white text-school-navy shadow-xs' : 'text-slate-600'}`}
              >
                Semester
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${periodType === 'monthly' ? 'bg-white text-school-navy shadow-xs' : 'text-slate-600'}`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${periodType === 'custom' ? 'bg-white text-school-navy shadow-xs' : 'text-slate-600'}`}
              >
                Rentang Tanggal
              </button>
            </div>

            {/* Dynamic Period Input */}
            {periodType === 'semester' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Semester:</span>
                <select
                  value={selectedSemester}
                  onChange={e => setSelectedSemester(e.target.value as '1' | '2')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-medium"
                >
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
            )}

            {periodType === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Bulan:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            )}

            {periodType === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
                <span className="text-xs text-slate-400">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-1">
          Hari Belajar Tercatat: <strong className="text-school-navy">{distinctDates.length} Hari</strong> | Menampilkan {visibleRecap.length} Siswa
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-center w-12">No.</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-center w-20">Hadir (H)</th>
                <th className="py-3 px-4 text-center w-20">Sakit (S)</th>
                <th className="py-3 px-4 text-center w-20">Izin (I)</th>
                <th className="py-3 px-4 text-center w-20">Alpa (A)</th>
                <th className="py-3 px-4 text-center w-24">Total Hari</th>
                <th className="py-3 px-4 text-center w-32">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Memuat rekapitulasi kehadiran...
                  </td>
                </tr>
              ) : visibleRecap.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Belum ada data kehadiran pada periode ini.
                  </td>
                </tr>
              ) : (
                visibleRecap.map((recap, idx) => {
                  return (
                    <tr key={recap.studentId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{recap.nis || '-'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{recap.name}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700 bg-emerald-50/40">{recap.present}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-700 bg-blue-50/40">{recap.sick}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-700 bg-amber-50/40">{recap.permit}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700 bg-rose-50/40">{recap.absent}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{recap.totalDays}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${recap.attendanceRate >= 85 ? 'bg-emerald-100 text-emerald-800' : recap.attendanceRate >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                          {recap.attendanceRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Signature */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 text-center text-xs">
        <div>
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{schoolProfile?.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
          <p>NIP. {schoolProfile?.principalNip || '-'}</p>
        </div>
        <div>
          <p>Kota Bandung, {formatDateIndo(new Date())}</p>
          <p className="font-semibold">Wali Kelas {selectedClass}</p>
          <div className="h-16" />
          <p className="font-bold underline">{user?.name || 'Guru Kelas'}</p>
          <p>NIP. {user?.nip || '-'}</p>
        </div>
      </div>
    </div>
  );
};
