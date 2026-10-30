import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCheck,
  Printer,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getFirestoreStudents,
  getFirestoreAttendance,
  saveBatchFirestoreAttendance,
  logAuditEvent,
} from '../../services/firebase/firestoreService';
import { syncAttendanceToSheets } from '../../services/sync/syncManager';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { getTodayDateString, formatDateIndo } from '../../utils/formatters';

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

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavedInDb, setIsSavedInDb] = useState(false);

  // Load students & existing attendance for this class and date
  useEffect(() => {
    async function loadClassData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents(selectedClass);
        const active = studentList.filter(s => s.status === 'Aktif');
        setStudents(active);

        const existingRecords = await getFirestoreAttendance(selectedClass, selectedDate);
        const map: Record<string, { status: AttendanceStatus; notes: string }> = {};

        if (existingRecords.length > 0) {
          setIsSavedInDb(true);
          existingRecords.forEach(r => {
            map[r.studentId] = {
              status: r.status,
              notes: r.notes || '',
            };
          });
        } else {
          setIsSavedInDb(false);
          // Default: all active students marked as 'Hadir'
          active.forEach(s => {
            map[s.studentId] = { status: 'Hadir', notes: '' };
          });
        }
        setAttendanceMap(map);
      } catch (err: any) {
        showToast('error', 'Gagal Memuat Data', err.message);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessClass(selectedClass)) {
      loadClassData();
    }
  }, [selectedClass, selectedDate]);

  // Set status for a single student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { notes: '' }),
        status: status,
      },
    }));
  };

  // Set notes for a single student
  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { status: 'Hadir' }),
        notes: notes,
      },
    }));
  };

  // Mark all active students present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    students.forEach(s => {
      updated[s.studentId] = {
        status: 'Hadir',
        notes: attendanceMap[s.studentId]?.notes || '',
      };
    });
    setAttendanceMap(updated);
    showToast('info', 'Hadir Semua', 'Seluruh siswa ditandai Hadir.');
  };

  // Save batch attendance to Firestore & Google Sheets
  const handleSaveAttendance = async () => {
    if (!canAccessClass(selectedClass)) {
      showToast('error', 'Akses Ditolak', 'Anda tidak berwenang mengelola kelas ini.');
      return;
    }

    setSaving(true);
    try {
      const recordsToSave: AttendanceRecord[] = students.map(s => {
        const entry = attendanceMap[s.studentId] || { status: 'Hadir', notes: '' };
        const recordId = `ATT-${selectedClass}-${selectedDate}-${s.studentId}`;
        return {
          attendanceId: recordId,
          studentId: s.studentId,
          studentName: s.name,
          nis: s.nis,
          nisn: s.nisn,
          class: selectedClass,
          date: selectedDate,
          schoolYear: schoolProfile?.academicYear || '2026/2027',
          semester: schoolProfile?.activeSemester || '1',
          status: entry.status,
          notes: entry.notes,
          createdBy: user?.name || user?.email,
          updatedBy: user?.name || user?.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        };
      });

      // 1. Save to Firestore
      await saveBatchFirestoreAttendance(recordsToSave);
      setIsSavedInDb(true);

      // 2. Audit Trail
      await logAuditEvent(
        user,
        'INPUT_ABSENSI',
        'Attendance',
        `Kelas ${selectedClass} - ${selectedDate}`,
        `Menyimpan absensi ${recordsToSave.length} siswa`
      );

      // 3. Trigger async sync to Google Sheets
      syncAttendanceToSheets(selectedClass, selectedDate).catch(e => {
        console.warn('Background Sheets sync error:', e);
      });

      showToast('success', 'Absensi Berhasil Disimpan', `Data kehadiran Kelas ${selectedClass} tersimpan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Absensi', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter students by search term
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nis.includes(searchTerm)
  );

  // Quick stats for today
  const summary = {
    hadir: Object.values(attendanceMap).filter(v => v.status === 'Hadir').length,
    sakit: Object.values(attendanceMap).filter(v => v.status === 'Sakit').length,
    izin: Object.values(attendanceMap).filter(v => v.status === 'Izin').length,
    alpa: Object.values(attendanceMap).filter(v => v.status === 'Alpa').length,
  };

  return (
    <div className="space-y-5">
      {/* Printable Header */}
      <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-4">
        <h2 className="text-xl font-bold uppercase">{schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}</h2>
        <p className="text-xs">{schoolProfile?.address}</p>
        <p className="text-sm font-bold mt-2 uppercase">DAFTAR HADIR HARIAN SISWA KELAS {selectedClass}</p>
        <p className="text-xs">Hari / Tanggal: {formatDateIndo(selectedDate)} | Semester: {schoolProfile?.activeSemester} | TP: {schoolProfile?.academicYear}</p>
      </div>

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Absensi Harian Siswa</h2>
          <p className="text-xs text-slate-500">
            Pencatatan kehadiran siswa per tanggal dan kelas secara realtime
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            type="button"
            className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Hadir Semua</span>
          </button>

          <button
            onClick={handlePrint}
            type="button"
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak A4</span>
          </button>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            type="button"
            className="px-4 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Kelas Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Pilih Kelas:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                disabled={isTeacher && user?.assignedClasses.length === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-school-navy bg-white focus:ring-2 focus:ring-school-lightBlue disabled:bg-slate-100"
              >
                <option value="1">Kelas 1</option>
                <option value="2">Kelas 2</option>
                <option value="3">Kelas 3</option>
                <option value="4">Kelas 4</option>
                <option value="5">Kelas 5</option>
                <option value="6">Kelas 6</option>
              </select>
            </div>

            {/* Tanggal Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Tanggal:</span>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-school-lightBlue bg-white"
                />
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              {isSavedInDb ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sudah Tersimpan di Database</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Belum Disimpan</span>
                </span>
              )}
            </div>
          </div>

          {/* Search student */}
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

        {/* Quick Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
            <span className="font-semibold text-emerald-800">Hadir:</span>
            <span className="font-bold text-emerald-950 text-sm">{summary.hadir}</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <span className="font-semibold text-blue-800">Sakit:</span>
            <span className="font-bold text-blue-950 text-sm">{summary.sakit}</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
            <span className="font-semibold text-amber-800">Izin:</span>
            <span className="font-bold text-amber-950 text-sm">{summary.izin}</span>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
            <span className="font-semibold text-rose-800">Alpa:</span>
            <span className="font-bold text-rose-950 text-sm">{summary.alpa}</span>
          </div>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-center w-12">No.</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4 text-center w-64 print:hidden">Status Kehadiran</th>
                <th className="py-3 px-4 text-center hidden print:table-cell w-20">Hadir</th>
                <th className="py-3 px-4 text-center hidden print:table-cell w-20">Sakit</th>
                <th className="py-3 px-4 text-center hidden print:table-cell w-20">Izin</th>
                <th className="py-3 px-4 text-center hidden print:table-cell w-20">Alpa</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat data siswa kelas {selectedClass}...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Tidak ada siswa aktif di kelas {selectedClass}.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const entry = attendanceMap[student.studentId] || { status: 'Hadir', notes: '' };

                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{student.nis || '-'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{student.name}</td>

                      {/* Interactive Radio/Button Status Picker (Screen Only) */}
                      <td className="py-3 px-4 print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as AttendanceStatus[]).map(statusOpt => {
                            const isSelected = entry.status === statusOpt;
                            const colors = {
                              Hadir: isSelected ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700',
                              Sakit: isSelected ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                              Izin: isSelected ? 'bg-amber-500 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700',
                              Alpa: isSelected ? 'bg-rose-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700',
                            }[statusOpt];

                            return (
                              <button
                                key={statusOpt}
                                type="button"
                                onClick={() => handleStatusChange(student.studentId, statusOpt)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] transition ${colors}`}
                              >
                                {statusOpt}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Print Checkbox cells */}
                      <td className="py-2 px-2 text-center hidden print:table-cell font-bold">{entry.status === 'Hadir' ? '✓' : ''}</td>
                      <td className="py-2 px-2 text-center hidden print:table-cell font-bold">{entry.status === 'Sakit' ? '✓' : ''}</td>
                      <td className="py-2 px-2 text-center hidden print:table-cell font-bold">{entry.status === 'Izin' ? '✓' : ''}</td>
                      <td className="py-2 px-2 text-center hidden print:table-cell font-bold">{entry.status === 'Alpa' ? '✓' : ''}</td>

                      {/* Notes Input */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={entry.notes}
                          onChange={e => handleNotesChange(student.studentId, e.target.value)}
                          placeholder="Catatan..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-school-lightBlue print:border-none print:p-0"
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

      {/* Signature Area for Printing */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 mt-6 text-center text-xs">
        <div>
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline">{schoolProfile?.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
          <p>NIP. {schoolProfile?.principalNip || '-'}</p>
        </div>
        <div>
          <p>Kota Bandung, {formatDateIndo(selectedDate)}</p>
          <p className="font-semibold">Guru Wali Kelas {selectedClass}</p>
          <div className="h-16" />
          <p className="font-bold underline">{user?.name || 'Guru Kelas'}</p>
          <p>NIP. {user?.nip || '-'}</p>
        </div>
      </div>
    </div>
  );
};
