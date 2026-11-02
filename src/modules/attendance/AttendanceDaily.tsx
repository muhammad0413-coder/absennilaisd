import React, { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  Search,
  CheckCheck,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getFirestoreStudents,
  getMonthlyAttendanceSheet,
  saveMonthlyAttendanceSheet,
  logAuditEvent,
} from '../../services/firebase/firestoreService';
import { exportToExcel } from '../../services/export/excelExport';
import { Student, AttendanceStatus, MonthlyAttendanceSheet } from '../../types';
import { KopSurat } from '../../components/common/KopSurat';
import { formatDateIndo } from '../../utils/formatters';

export const AttendanceDaily: React.FC = () => {
  const { user, isAdmin, isTeacher, canAccessClass } = useAuth();
  const { schoolProfile } = useSchool();
  const { showToast } = useNotification();

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && user && user.assignedClasses.length > 0) {
      return user.assignedClasses[0];
    }
    return '1';
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceSheet, setAttendanceSheet] = useState<MonthlyAttendanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [todayDay, setTodayDay] = useState<number>(new Date().getDate());

  // Load students & monthly attendance sheet
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents(selectedClass);
        const active = studentList.filter(s => s.status === 'Aktif');
        setStudents(active);

        const sheet = await getMonthlyAttendanceSheet(selectedClass, selectedMonth);
        setAttendanceSheet(sheet);
      } catch (err: any) {
        showToast('error', 'Gagal Memuat Absensi', err.message);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessClass(selectedClass)) {
      loadData();
    }
  }, [selectedClass, selectedMonth]);

  // Toggle or set attendance status for student on specific day (1..31)
  const handleCellClick = (studentId: string, day: number) => {
    if (!attendanceSheet) return;
    const currentStatus = attendanceSheet.days[studentId]?.[day] || '';

    // Cycle: '' -> 'H' -> 'S' -> 'I' -> 'A' -> ''
    let nextStatus: AttendanceStatus = '';
    if (currentStatus === '') nextStatus = 'Hadir';
    else if (currentStatus === 'Hadir' || currentStatus === 'H') nextStatus = 'Sakit';
    else if (currentStatus === 'Sakit' || currentStatus === 'S') nextStatus = 'Izin';
    else if (currentStatus === 'Izin' || currentStatus === 'I') nextStatus = 'Alpa';
    else nextStatus = '';

    setAttendanceSheet(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: {
          ...prev.days,
          [studentId]: {
            ...(prev.days[studentId] || {}),
            [day]: nextStatus,
          },
        },
      };
    });
  };

  // Mark all active students present on today or selected day
  const handleMarkAllPresentToday = () => {
    if (!attendanceSheet) return;
    setAttendanceSheet(prev => {
      if (!prev) return null;
      const updatedDays = { ...prev.days };
      students.forEach(s => {
        if (!updatedDays[s.studentId]) updatedDays[s.studentId] = {};
        updatedDays[s.studentId][todayDay] = 'Hadir';
      });
      return {
        ...prev,
        days: updatedDays,
      };
    });
    showToast('info', 'Hadir Semua', `Seluruh siswa ditandai Hadir pada tanggal ${todayDay}.`);
  };

  // Update notes
  const handleNotesChange = (studentId: string, text: string) => {
    if (!attendanceSheet) return;
    setAttendanceSheet(prev => {
      if (!prev) return null;
      return {
        ...prev,
        notes: {
          ...prev.notes,
          [studentId]: text,
        },
      };
    });
  };

  // Save attendance sheet
  const handleSaveSheet = async () => {
    if (!attendanceSheet || !canAccessClass(selectedClass)) {
      showToast('error', 'Akses Ditolak', 'Anda tidak berwenang mengelola kelas ini.');
      return;
    }

    setSaving(true);
    try {
      await saveMonthlyAttendanceSheet(attendanceSheet);
      await logAuditEvent(
        user,
        'SIMPAN_ABSENSI_BULANAN',
        'MonthlyAttendance',
        `Kelas ${selectedClass} - ${selectedMonth}`,
        `Menyimpan daftar hadir siswa bulan ${selectedMonth}`
      );
      showToast('success', 'Absensi Tersimpan', `Daftar hadir Kelas ${selectedClass} bulan ${selectedMonth} berhasil disimpan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Absensi', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!attendanceSheet) return;
    const rows = students.map((s, idx) => {
      const studentDays = attendanceSheet.days[s.studentId] || {};
      let sCount = 0;
      let iCount = 0;
      let aCount = 0;

      const rowObj: Record<string, any> = {
        'No.': idx + 1,
        'NIS': s.nis,
        'Nama Siswa': s.name,
      };

      for (let d = 1; d <= 31; d++) {
        const val = studentDays[d] || '';
        let code = '';
        if (val === 'Hadir' || val === 'H') code = 'H';
        else if (val === 'Sakit' || val === 'S') { code = 'S'; sCount++; }
        else if (val === 'Izin' || val === 'I') { code = 'I'; iCount++; }
        else if (val === 'Alpa' || val === 'A') { code = 'A'; aCount++; }
        rowObj[String(d)] = code;
      }

      rowObj['S'] = sCount;
      rowObj['I'] = iCount;
      rowObj['A'] = aCount;
      rowObj['Jml'] = sCount + iCount + aCount;
      rowObj['KET'] = attendanceSheet.notes[s.studentId] || '';

      return rowObj;
    });

    exportToExcel(rows, `Daftar_Hadir_SDN_Kesilir_02_Kelas_${selectedClass}_${selectedMonth}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nis.includes(searchTerm)
  );

  // Month name helper
  const getMonthName = (monthStr: string) => {
    try {
      const [y, m] = monthStr.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
    } catch {
      return monthStr;
    }
  };

  // Calculate monthly stats
  let totalHadirAll = 0;
  let totalRecordedSlots = 0;
  if (attendanceSheet) {
    students.forEach(s => {
      const dMap = attendanceSheet.days[s.studentId] || {};
      for (let d = 1; d <= 31; d++) {
        const val = dMap[d];
        if (val) {
          totalRecordedSlots++;
          if (val === 'Hadir' || val === 'H') totalHadirAll++;
        }
      }
    });
  }
  const overallPercentage = totalRecordedSlots > 0
    ? Math.round((totalHadirAll / totalRecordedSlots) * 1000) / 10
    : 100;

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* CETAK KOP SURAT RESMI SDN KESILIR 02 (Aktif saat Print F4) */}
      {/* ============================================================== */}
      <div className="hidden print:block mb-2">
        <KopSurat />
        <div className="text-center my-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">
            DAFTAR HADIR SISWA
          </h2>
          <h3 className="text-xs font-bold uppercase">
            TAHUN AJARAN {schoolProfile?.academicYear || '2026/2027'}
          </h3>
          <h4 className="text-xs font-bold uppercase">
            KELAS {selectedClass} SDN KESILIR 02
          </h4>
          <p className="text-[10px] font-semibold mt-1">
            Bulan : {getMonthName(selectedMonth)}
          </p>
        </div>
      </div>

      {/* Screen Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Daftar Hadir Siswa Bulanan (1–31)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Format lembar absensi bulanan 31 hari presisi (Sesuai Format Gambar 1)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresentToday}
            className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Hadir Semua Tgl {todayDay}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition flex items-center gap-1.5 shadow-sm"
            title="Cetak Presisi Kertas F4 (Folio) Landscape"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak F4 Landscape</span>
          </button>

          <button
            onClick={handleSaveSheet}
            disabled={saving || !attendanceSheet}
            className="px-4 py-2 bg-school-navy text-white text-xs font-bold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Kelas */}
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

            {/* Bulan */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Bulan:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              />
            </div>

            {/* Tanggal Cepat */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Pilih Tgl:</span>
              <input
                type="number"
                min="1"
                max="31"
                value={todayDay}
                onChange={e => setTodayDay(Number(e.target.value))}
                className="w-14 px-2 py-1.5 rounded-xl border border-slate-200 text-xs text-center font-bold"
              />
            </div>
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

        {/* Legend Petunjuk */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-500">Petunjuk Klik Kolom Tanggal:</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">H = Hadir</span>
          <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">S = Sakit</span>
          <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">I = Izin</span>
          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">A = Alpa</span>
          <span className="text-slate-400">(Klik sel untuk mengganti status bergantian)</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABEL PRESISI ABSENSI BULANAN 1-31 PERSIS GAMBAR 1 */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-black shadow-xs overflow-hidden print:border-black print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-black text-[11px] print:text-[8pt]">
            <thead>
              {/* Baris 1 */}
              <tr className="bg-slate-100 font-bold border-b border-black">
                <th rowSpan={2} className="py-1 px-1 border border-black w-8">NO</th>
                <th rowSpan={2} className="py-1 px-2 border border-black text-left min-w-[180px]">NAMA</th>
                <th colSpan={31} className="py-0.5 border border-black uppercase tracking-wider text-[10px] print:text-[7.5pt]">
                  TANGGAL
                </th>
                <th rowSpan={2} className="py-1 border border-black w-7">S</th>
                <th rowSpan={2} className="py-1 border border-black w-7">I</th>
                <th rowSpan={2} className="py-1 border border-black w-7">A</th>
                <th rowSpan={2} className="py-1 border border-black w-8">Jml</th>
                <th rowSpan={2} className="py-1 px-2 border border-black w-24 text-left">KET</th>
              </tr>

              {/* Baris 2: Hari 1 sampai 31 persis format vertikal Gambar 1 */}
              <tr className="bg-slate-50 font-bold border-b border-black text-[9px] print:text-[7pt]">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <th
                    key={d}
                    className={`border border-black w-[19px] p-0.5 ${d === todayDay ? 'bg-blue-100 font-extrabold print:bg-transparent' : ''}`}
                  >
                    {/* Render format vertikal bertumpuk seperti Gambar 1 untuk tanggal >= 10 */}
                    {d < 10 ? (
                      <div>{d}</div>
                    ) : (
                      <div className="leading-[9px] flex flex-col items-center">
                        <span>{Math.floor(d / 10)}</span>
                        <span>{d % 10}</span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={38} className="py-8 text-center text-slate-500">
                    Memuat daftar hadir...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={38} className="py-8 text-center text-slate-500">
                    Tidak ada siswa pada rombel ini.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const studentDays = attendanceSheet?.days[student.studentId] || {};
                  let sCount = 0;
                  let iCount = 0;
                  let aCount = 0;

                  for (let d = 1; d <= 31; d++) {
                    const st = studentDays[d] || '';
                    if (st === 'Sakit' || st === 'S') sCount++;
                    else if (st === 'Izin' || st === 'I') iCount++;
                    else if (st === 'Alpa' || st === 'A') aCount++;
                  }
                  const totalAbsen = sCount + iCount + aCount;

                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50">
                      {/* NO */}
                      <td className="border border-black py-0.5 font-medium">{idx + 1}.</td>
                      {/* NAMA */}
                      <td className="border border-black py-0.5 px-2 text-left font-bold uppercase truncate max-w-[200px]">
                        {student.name}
                      </td>

                      {/* KOLOM TANGGAL 1 - 31 */}
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                        const val = studentDays[d] || '';
                        let displayChar = '';
                        let colorClass = '';

                        if (val === 'Hadir' || val === 'H') {
                          displayChar = '✓';
                          colorClass = 'text-emerald-700 font-bold';
                        } else if (val === 'Sakit' || val === 'S') {
                          displayChar = 'S';
                          colorClass = 'text-blue-700 font-extrabold bg-blue-50/50 print:bg-transparent';
                        } else if (val === 'Izin' || val === 'I') {
                          displayChar = 'I';
                          colorClass = 'text-amber-700 font-extrabold bg-amber-50/50 print:bg-transparent';
                        } else if (val === 'Alpa' || val === 'A') {
                          displayChar = 'A';
                          colorClass = 'text-rose-700 font-extrabold bg-rose-50/50 print:bg-transparent';
                        }

                        return (
                          <td
                            key={d}
                            onClick={() => handleCellClick(student.studentId, d)}
                            className={`border border-black p-0 cursor-pointer select-none text-[10px] print:text-[8pt] ${colorClass} ${d === todayDay ? 'bg-blue-50/30 print:bg-transparent' : ''}`}
                            title={`Klik untuk ubah kehadiran Tgl ${d}`}
                          >
                            {displayChar}
                          </td>
                        );
                      })}

                      {/* S */}
                      <td className="border border-black py-0.5 font-bold text-blue-700">
                        {sCount > 0 ? sCount : ''}
                      </td>
                      {/* I */}
                      <td className="border border-black py-0.5 font-bold text-amber-700">
                        {iCount > 0 ? iCount : ''}
                      </td>
                      {/* A */}
                      <td className="border border-black py-0.5 font-bold text-rose-700">
                        {aCount > 0 ? aCount : ''}
                      </td>
                      {/* Jml */}
                      <td className="border border-black py-0.5 font-extrabold text-black bg-slate-100 print:bg-transparent">
                        {totalAbsen > 0 ? totalAbsen : ''}
                      </td>
                      {/* KET */}
                      <td className="border border-black py-0.5 px-1 text-left">
                        <input
                          type="text"
                          value={attendanceSheet?.notes[student.studentId] || ''}
                          onChange={e => handleNotesChange(student.studentId, e.target.value)}
                          placeholder=""
                          className="w-full text-[10px] print:text-[7pt] bg-transparent border-none p-0 focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prosentase Absen Bulan ini & Tanda Tangan Sesuai Gambar 1 */}
      <div className="pt-3 text-[11px] print:text-[8.5pt] text-black">
        <div className="text-center font-bold mb-6">
          Prosentase Absen Bulan ini &nbsp;&nbsp;&nbsp;&nbsp; = &nbsp;&nbsp;&nbsp;&nbsp;{' '}
          <span className="font-extrabold underline">{overallPercentage}%</span>
        </div>

        {/* Tanda Tangan Kiri & Kanan Sesuai Gambar 1 */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs print:text-[9pt] pt-2">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah SDN Kesilir 02</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {schoolProfile?.principalName || 'Abdullah Mahsar, S.Pd'}
            </p>
            <p>NIP. {schoolProfile?.principalNip || '198306012014121000'}</p>
          </div>

          <div>
            <p>&nbsp;</p>
            <p className="font-bold">Guru kelas {selectedClass}</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {user?.role === 'guru' ? (user.name || 'Suci Ayu Ningrum, S.Pd') : 'Suci Ayu Ningrum, S.Pd'}
            </p>
            <p>NIP. {user?.role === 'guru' && user.nip ? user.nip : '199410142023212000'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
