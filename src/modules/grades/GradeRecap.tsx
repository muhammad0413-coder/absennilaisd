import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Calculator,
  Info,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getFirestoreStudents, getFirestoreGrades } from '../../services/firebase/firestoreService';
import { exportToExcel } from '../../services/export/excelExport';
import { exportToCSV } from '../../services/export/csvExport';
import { Student, GradeRecord } from '../../types';
import { calculateFinalScore, DEFAULT_ASSESSMENT_WEIGHTS } from '../../utils/calculations';
import { getGradePredicate, formatDateIndo } from '../../utils/formatters';

export const GradeRecap: React.FC = () => {
  const { user, isAdmin, isTeacher, canAccessClass } = useAuth();
  const { schoolProfile, subjects } = useSchool();
  const { showToast } = useNotification();

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && user && user.assignedClasses.length > 0) {
      return user.assignedClasses[0];
    }
    return '1';
  });

  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.name || 'Matematika');
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(schoolProfile?.activeSemester || '1');
  const [searchTerm, setSearchTerm] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const studentList = await getFirestoreStudents(selectedClass);
        setStudents(studentList.filter(s => s.status === 'Aktif'));

        const gradeList = await getFirestoreGrades(selectedClass, selectedSubject, selectedSemester);
        setGrades(gradeList);
      } catch (e: any) {
        showToast('error', 'Gagal Memuat Rekap', e.message);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessClass(selectedClass)) {
      loadData();
    }
  }, [selectedClass, selectedSubject, selectedSemester]);

  // Aggregate grade recap per student
  const recapData = students.map(s => {
    const studentGrades = grades.filter(g => g.studentId === s.studentId);
    const { finalScore, summary, isComplete } = calculateFinalScore(studentGrades, DEFAULT_ASSESSMENT_WEIGHTS);
    const { predicate, label } = getGradePredicate(finalScore);

    return {
      studentId: s.studentId,
      nis: s.nis,
      nisn: s.nisn,
      name: s.name,
      class: s.class,
      formatif: summary['Formatif'],
      sumatifLM: summary['Sumatif Lingkup Materi'],
      sts: summary['Sumatif Tengah Semester'],
      sas: summary['Sumatif Akhir Semester'],
      finalScore: finalScore,
      predicate: predicate,
      predicateLabel: label,
      isComplete: isComplete,
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
      'Mata Pelajaran': selectedSubject,
      'Formatif (20%)': r.formatif ?? '-',
      'Sumatif LM (30%)': r.sumatifLM ?? '-',
      'STS (25%)': r.sts ?? '-',
      'SAS (25%)': r.sas ?? '-',
      'Nilai Akhir (NA)': r.finalScore ?? '-',
      'Predikat': r.predicate,
      'Keterangan': r.predicateLabel,
    }));
    exportToExcel(exportRows, `Rekap_Nilai_${selectedSubject}_Kelas_${selectedClass}_S${selectedSemester}`);
  };

  const handleExportCSV = () => {
    const exportRows = visibleRecap.map((r, idx) => ({
      No: idx + 1,
      NIS: r.nis,
      Nama: r.name,
      Formatif: r.formatif ?? '',
      SumatifLM: r.sumatifLM ?? '',
      STS: r.sts ?? '',
      SAS: r.sas ?? '',
      NilaiAkhir: r.finalScore ?? '',
      Predikat: r.predicate,
    }));
    exportToCSV(exportRows, `Rekap_Nilai_${selectedSubject}_Kelas_${selectedClass}`);
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
        <p className="text-sm font-bold mt-2 uppercase">REKAPITULASI NILAI AKHIR: {selectedSubject.toUpperCase()}</p>
        <p className="text-xs">Kelas: {selectedClass} | Semester: {selectedSemester} | Tahun Pelajaran: {schoolProfile?.academicYear}</p>
        <p className="text-[10px] text-slate-500">Bobot Penilaian: Formatif (20%) + Sumatif LM (30%) + STS (25%) + SAS (25%)</p>
      </div>

      {/* Screen Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Rekapitulasi Nilai Siswa</h2>
          <p className="text-xs text-slate-500">
            Penghitungan Nilai Akhir (NA) dan status kelengkapan asesmen
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            type="button"
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

            {/* Subject */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Mata Pelajaran:</span>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
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
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>

        {/* Formula Explainer Banner */}
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Rumus Nilai Akhir (NA):</strong> (Formatif × 20%) + (Sumatif LM × 30%) + (STS × 25%) + (SAS × 25%)
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700">Skala Predikat: A (&ge;88), B (&ge;74), C (&ge;60), D (&lt;60)</span>
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
                <th className="py-3 px-4 text-center w-24">Formatif (20%)</th>
                <th className="py-3 px-4 text-center w-28">Sumatif LM (30%)</th>
                <th className="py-3 px-4 text-center w-24">STS (25%)</th>
                <th className="py-3 px-4 text-center w-24">SAS (25%)</th>
                <th className="py-3 px-4 text-center w-28 bg-blue-50/50">Nilai Akhir</th>
                <th className="py-3 px-4 text-center w-20">Predikat</th>
                <th className="py-3 px-4 text-center w-28 print:hidden">Kelengkapan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Memuat rekapitulasi nilai...
                  </td>
                </tr>
              ) : visibleRecap.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    Belum ada nilai yang diinput untuk mata pelajaran ini.
                  </td>
                </tr>
              ) : (
                visibleRecap.map((recap, idx) => {
                  return (
                    <tr key={recap.studentId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{recap.nis || '-'}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{recap.name}</td>
                      <td className="py-3 px-4 text-center font-medium">{recap.formatif ?? '-'}</td>
                      <td className="py-3 px-4 text-center font-medium">{recap.sumatifLM ?? '-'}</td>
                      <td className="py-3 px-4 text-center font-medium">{recap.sts ?? '-'}</td>
                      <td className="py-3 px-4 text-center font-medium">{recap.sas ?? '-'}</td>
                      <td className="py-3 px-4 text-center font-extrabold text-sm text-school-navy bg-blue-50/50">
                        {recap.finalScore !== null ? recap.finalScore : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${recap.predicate === 'A' ? 'bg-emerald-100 text-emerald-800' : recap.predicate === 'B' ? 'bg-blue-100 text-blue-800' : recap.predicate === 'C' ? 'bg-amber-100 text-amber-800' : recap.predicate === 'D' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'}`}>
                          {recap.predicate}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${recap.isComplete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {recap.isComplete ? 'Lengkap' : 'Sebagian'}
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
          <p>Kota Bandung, {formatDateIndo(new Date())}</p>
          <p className="font-semibold">Guru Pengampu Mata Pelajaran</p>
          <div className="h-16" />
          <p className="font-bold underline">{user?.name || 'Guru'}</p>
          <p>NIP. {user?.nip || '-'}</p>
        </div>
      </div>
    </div>
  );
};
