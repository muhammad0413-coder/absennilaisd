import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getFirestoreStudents,
  getFirestoreGrades,
  getFirestoreAttendance,
} from '../../services/firebase/firestoreService';
import { callAppsScript } from '../../services/apps-script/appsScriptApi';
import { Student, GradeRecord, AttendanceRecord } from '../../types';
import { calculateFinalScore, DEFAULT_ASSESSMENT_WEIGHTS, generateCompetencyDescription } from '../../utils/calculations';
import { getGradePredicate, formatDateIndo } from '../../utils/formatters';

export const ReportCardView: React.FC = () => {
  const { user, isAdmin, isTeacher, canAccessClass } = useAuth();
  const { schoolProfile, subjects } = useSchool();
  const { showToast } = useNotification();

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && user && user.assignedClasses.length > 0) {
      return user.assignedClasses[0];
    }
    return '1';
  });

  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(schoolProfile?.activeSemester || '1');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [allGrades, setAllGrades] = useState<GradeRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [teacherNotesMap, setTeacherNotesMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [printAllMode, setPrintAllMode] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents(selectedClass);
        const active = studentList.filter(s => s.status === 'Aktif');
        setStudents(active);
        setSelectedStudentIndex(0);

        // Load all grades for this class and semester
        const gradeList = await getFirestoreGrades(selectedClass, undefined, selectedSemester);
        setAllGrades(gradeList);

        // Load all attendance for this class and semester
        const attList = await getFirestoreAttendance(selectedClass);
        const filteredAtt = attList.filter(a => a.semester === selectedSemester);
        setAllAttendance(filteredAtt);

        // Load cached teacher notes
        const cachedNotes = localStorage.getItem(`rapor_notes_${selectedClass}_S${selectedSemester}`);
        if (cachedNotes) {
          setTeacherNotesMap(JSON.parse(cachedNotes));
        }
      } catch (e: any) {
        showToast('error', 'Gagal Memuat Data Rapor', e.message);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessClass(selectedClass)) {
      loadReportData();
    }
  }, [selectedClass, selectedSemester]);

  const currentStudent = students[selectedStudentIndex];

  // Calculate subject scores for a given student
  const getStudentSubjectScores = (studentId: string) => {
    const studentGrades = allGrades.filter(g => g.studentId === studentId);

    return subjects.map(sub => {
      const subjectGrades = studentGrades.filter(g => g.subject.toLowerCase() === sub.name.toLowerCase());
      const { finalScore } = calculateFinalScore(subjectGrades, DEFAULT_ASSESSMENT_WEIGHTS);
      const { predicate } = getGradePredicate(finalScore);

      // Description: use saved grade description or generate automatically
      const latestDesc = subjectGrades.find(g => g.description)?.description ||
        generateCompetencyDescription(currentStudent?.name || 'Siswa', sub.name, finalScore);

      return {
        subject: sub.name,
        kkm: sub.kkm,
        finalScore: finalScore,
        predicate: predicate,
        description: latestDesc,
      };
    });
  };

  // Calculate attendance recap for a student
  const getStudentAttendanceRecap = (studentId: string) => {
    const studentAtt = allAttendance.filter(a => a.studentId === studentId);
    let sick = 0;
    let permit = 0;
    let absent = 0;
    studentAtt.forEach(a => {
      if (a.status === 'Sakit') sick++;
      else if (a.status === 'Izin') permit++;
      else if (a.status === 'Alpa') absent++;
    });
    return { sick, permit, absent };
  };

  const handleTeacherNoteChange = (studentId: string, text: string) => {
    const updated = { ...teacherNotesMap, [studentId]: text };
    setTeacherNotesMap(updated);
    localStorage.setItem(`rapor_notes_${selectedClass}_S${selectedSemester}`, JSON.stringify(updated));
  };

  const handlePrintCurrent = () => {
    setPrintAllMode(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintAll = () => {
    setPrintAllMode(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Archive to Google Drive via Apps Script
  const handleArchiveToDrive = async () => {
    if (!currentStudent) return;
    setArchiving(true);
    try {
      const htmlContent = document.getElementById('report-card-container')?.outerHTML || '';
      const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));

      const res = await callAppsScript('createArchive', {
        fileName: `Rapor_${currentStudent.name.replace(/\s+/g, '_')}_Kelas${selectedClass}_S${selectedSemester}.html`,
        fileBase64: base64Content,
        mimeType: 'text/html',
        category: 'report_card',
      });

      if (res.success) {
        showToast('success', 'Arsip Berhasil', 'Salinan rapor berhasil diarsipkan ke Google Drive.');
      } else {
        showToast('info', 'Arsip Disimpan Lokal', 'Laporan dicetak/diunduh. (Hubungkan Apps Script untuk arsip Google Drive permanen).');
      }
    } catch (err: any) {
      showToast('error', 'Gagal Arsip ke Drive', err.message);
    } finally {
      setArchiving(false);
    }
  };

  // Render Single Student Report Card Layout
  const renderReportCard = (student: Student) => {
    const subjectScores = getStudentSubjectScores(student.studentId);
    const att = getStudentAttendanceRecap(student.studentId);
    const teacherNote = teacherNotesMap[student.studentId] ||
      `Ananda ${student.name} menunjukkan perkembangan sikap dan kemampuan akademik yang baik pada Semester ${selectedSemester}. Pertahankan prestasi dan terus semangat belajar!`;

    return (
      <div key={student.studentId} className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto text-slate-800 space-y-6 page-break">
        {/* Kop Rapor Sekolah */}
        <div className="border-b-4 border-double border-slate-800 pb-4 flex items-center justify-between gap-4">
          <img src={schoolProfile?.logoUrl || '/logo.svg'} alt="Logo Sekolah" className="w-20 h-20 object-contain" />
          <div className="text-center flex-1">
            <h3 className="font-extrabold text-lg uppercase text-school-navy leading-tight">
              {schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">{schoolProfile?.address}</p>
            <p className="text-[11px] text-slate-500">
              Desa {schoolProfile?.village}, Kec. {schoolProfile?.subdistrict}, {schoolProfile?.regency}, Prov. {schoolProfile?.province}
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-1">NPSN: {schoolProfile?.npsn}</p>
          </div>
          <div className="w-20 h-20 invisible md:visible" />
        </div>

        {/* Judul Rapor */}
        <div className="text-center space-y-1">
          <h4 className="text-base font-extrabold uppercase tracking-wide underline">
            LAPORAN HASIL BELAJAR SISWA (RAPOR)
          </h4>
          <p className="text-xs font-semibold text-slate-600">
            Tahun Pelajaran {schoolProfile?.academicYear} — Semester {selectedSemester === '1' ? '1 (Ganjil)' : '2 (Genap)'}
          </p>
        </div>

        {/* Identitas Siswa */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex">
            <span className="w-32 font-semibold text-slate-600">Nama Siswa</span>
            <span className="font-bold text-slate-900">: {student.name}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-slate-600">Kelas</span>
            <span className="font-bold text-slate-900">: Kelas {student.class}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-slate-600">NIS / NISN</span>
            <span className="font-mono text-slate-900">: {student.nis || '-'} / {student.nisn || '-'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-semibold text-slate-600">Fase / Kurikulum</span>
            <span className="font-medium text-slate-900">: Fase {['1','2'].includes(student.class) ? 'A' : ['3','4'].includes(student.class) ? 'B' : 'C'} (Kurikulum Merdeka)</span>
          </div>
        </div>

        {/* Tabel Nilai Capaian Kompetensi */}
        <div className="space-y-2">
          <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">A. Nilai Capaian Hasil Belajar</h5>
          <table className="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                <th className="py-2.5 px-3 border border-slate-300 text-center w-10">No.</th>
                <th className="py-2.5 px-3 border border-slate-300">Mata Pelajaran</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center w-20">Nilai Akhir</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center w-16">Predikat</th>
                <th className="py-2.5 px-3 border border-slate-300">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {subjectScores.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 border border-slate-300 text-center font-medium">{idx + 1}</td>
                  <td className="py-2 px-3 border border-slate-300 font-semibold text-slate-800">{row.subject}</td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-extrabold text-school-navy">
                    {row.finalScore !== null ? row.finalScore : '-'}
                  </td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-bold">{row.predicate}</td>
                  <td className="py-2 px-3 border border-slate-300 text-[11px] text-slate-600 leading-relaxed">
                    {row.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rekap Absensi & Catatan Wali Kelas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Kolom Absensi */}
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">B. Rekap Kehadiran</h5>
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 text-slate-600">Sakit (S)</td>
                  <td className="py-1.5 font-bold text-right">{att.sick} hari</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1.5 text-slate-600">Izin (I)</td>
                  <td className="py-1.5 font-bold text-right">{att.permit} hari</td>
                </tr>
                <tr>
                  <td className="py-1.5 text-slate-600">Tanpa Keterangan (A)</td>
                  <td className="py-1.5 font-bold text-right">{att.absent} hari</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kolom Catatan Wali Kelas */}
          <div className="md:col-span-2 border border-slate-300 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700">C. Catatan Wali Kelas</h5>
            <textarea
              rows={3}
              value={teacherNote}
              onChange={e => handleTeacherNoteChange(student.studentId, e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-school-lightBlue print:border-none print:p-0 print:bg-transparent"
            />
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs text-slate-800">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Orang Tua / Wali</p>
            <div className="h-16" />
            <p className="font-bold border-b border-slate-400 w-36 mx-auto" />
          </div>
          <div>
            <p>&nbsp;</p>
            <p className="font-semibold">Wali Kelas {student.class}</p>
            <div className="h-16" />
            <p className="font-bold underline">{user?.name || 'Wali Kelas'}</p>
            <p>NIP. {user?.nip || '-'}</p>
          </div>
          <div>
            <p>Kota Bandung, {formatDateIndo(new Date())}</p>
            <p className="font-semibold">Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold underline">{schoolProfile?.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
            <p>NIP. {schoolProfile?.principalNip || '-'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Screen Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select */}
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

          {/* Semester Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Semester:</span>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value as '1' | '2')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>

          {/* Student Selector Pagination */}
          {students.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedStudentIndex === 0}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-2">
                Siswa {selectedStudentIndex + 1} dari {students.length}: <strong>{currentStudent?.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentIndex(prev => Math.min(students.length - 1, prev + 1))}
                disabled={selectedStudentIndex === students.length - 1}
                className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleArchiveToDrive}
            disabled={archiving || !currentStudent}
            className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition flex items-center gap-1.5"
            title="Simpan arsip rapor ke Google Drive"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>{archiving ? 'Mengarsipkan...' : 'Arsip ke Drive'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCurrent}
            disabled={!currentStudent}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Siswa Ini</span>
          </button>

          <button
            type="button"
            onClick={handlePrintAll}
            disabled={students.length === 0}
            className="px-4 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak 1 Kelas ({students.length} Siswa)</span>
          </button>
        </div>
      </div>

      {/* Main Rapor Preview Container */}
      <div id="report-card-container">
        {loading ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            Memuat data rapor siswa...
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            Tidak ada siswa aktif di kelas {selectedClass}.
          </div>
        ) : printAllMode ? (
          // Print all students in the class
          <div className="space-y-8">
            {students.map(s => renderReportCard(s))}
          </div>
        ) : (
          // Preview single student
          currentStudent && renderReportCard(currentStudent)
        )}
      </div>
    </div>
  );
};
