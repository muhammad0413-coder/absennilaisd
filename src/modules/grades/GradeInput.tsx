import React, { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  Search,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getFirestoreStudents,
  getDetailedGrades,
  saveDetailedGrades,
  logAuditEvent,
} from '../../services/firebase/firestoreService';
import { exportToExcel } from '../../services/export/excelExport';
import { StudentDetailedGrade } from '../../types';
import { KopSurat } from '../../components/common/KopSurat';
import { formatDateIndo } from '../../utils/formatters';

export const GradeInput: React.FC = () => {
  const { user, isAdmin, isTeacher, canAccessClass } = useAuth();
  const { schoolProfile, subjects } = useSchool();
  const { showToast } = useNotification();

  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && user && user.assignedClasses.length > 0) {
      return user.assignedClasses[0];
    }
    return '1';
  });

  const [selectedSubject, setSelectedSubject] = useState<string>('Matematika');
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(schoolProfile?.activeSemester || '1');
  const [grades, setGrades] = useState<StudentDetailedGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLM, setActiveLM] = useState<'lm1' | 'lm2' | 'lm3' | 'lm4' | 'lm5'>('lm1');

  // Load Grades
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getDetailedGrades(selectedClass, selectedSubject, selectedSemester);
        setGrades(data);
      } catch (err: any) {
        showToast('error', 'Gagal Memuat Nilai', err.message);
      } finally {
        setLoading(false);
      }
    }

    if (canAccessClass(selectedClass)) {
      loadData();
    }
  }, [selectedClass, selectedSubject, selectedSemester]);

  // Update Formatif TP value
  const handleTPChange = (
    studentId: string,
    lm: 'lm1' | 'lm2' | 'lm3' | 'lm4' | 'lm5',
    tp: 'tp1' | 'tp2' | 'tp3' | 'tp4',
    val: string
  ) => {
    let numVal: number | null = null;
    if (val !== '') {
      const parsed = Number(val);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) return;
      numVal = parsed;
    }

    setGrades(prev =>
      prev.map(g => {
        if (g.studentId !== studentId) return g;
        const updatedFormatif = {
          ...g.formatif,
          [lm]: {
            ...g.formatif[lm],
            [tp]: numVal,
          },
        };

        // Recalculate average
        const allScores: number[] = [];
        (['lm1', 'lm2', 'lm3', 'lm4', 'lm5'] as const).forEach(m => {
          (['tp1', 'tp2', 'tp3', 'tp4'] as const).forEach(t => {
            const v = updatedFormatif[m][t];
            if (v !== null && v !== undefined) allScores.push(v);
          });
        });
        const finalScore = allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
          : null;

        return {
          ...g,
          formatif: updatedFormatif,
          finalScore: finalScore,
        };
      })
    );
  };

  // Update Sumatif LM value
  const handleSumatifLMChange = (
    studentId: string,
    lm: 'lm1' | 'lm2' | 'lm3' | 'lm4' | 'lm5',
    val: string
  ) => {
    let numVal: number | null = null;
    if (val !== '') {
      const parsed = Number(val);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) return;
      numVal = parsed;
    }

    setGrades(prev =>
      prev.map(g => {
        if (g.studentId !== studentId) return g;
        return {
          ...g,
          sumatifLM: {
            ...g.sumatifLM,
            [lm]: numVal,
          },
        };
      })
    );
  };

  // Update STS / SAS
  const handleSpecialAssessmentChange = (
    studentId: string,
    field: 'sts' | 'sas',
    val: string
  ) => {
    let numVal: number | null = null;
    if (val !== '') {
      const parsed = Number(val);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) return;
      numVal = parsed;
    }

    setGrades(prev =>
      prev.map(g => {
        if (g.studentId !== studentId) return g;
        return {
          ...g,
          [field]: numVal,
        };
      })
    );
  };

  // Save all grades
  const handleSaveAll = async () => {
    if (!canAccessClass(selectedClass)) {
      showToast('error', 'Akses Ditolak', 'Anda tidak berwenang mengelola kelas ini.');
      return;
    }

    setSaving(true);
    try {
      await saveDetailedGrades(selectedClass, selectedSubject, selectedSemester, grades);
      await logAuditEvent(
        user,
        'SIMPAN_NILAI_SEMESTER',
        'DetailedGrades',
        `Kelas ${selectedClass} - ${selectedSubject}`,
        `Menyimpan daftar nilai semester ${selectedSemester} untuk ${grades.length} siswa`
      );
      showToast('success', 'Nilai Tersimpan', `Daftar nilai ${selectedSubject} SDN Kesilir 02 berhasil disimpan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows = grades.map((g, idx) => ({
      'No. Urut': idx + 1,
      'No. Induk': g.nis,
      'Nama Siswa': g.studentName,
      'LM1 TP1': g.formatif.lm1.tp1 ?? '',
      'LM1 TP2': g.formatif.lm1.tp2 ?? '',
      'LM1 TP3': g.formatif.lm1.tp3 ?? '',
      'LM1 TP4': g.formatif.lm1.tp4 ?? '',
      'LM2 TP1': g.formatif.lm2.tp1 ?? '',
      'LM2 TP2': g.formatif.lm2.tp2 ?? '',
      'LM2 TP3': g.formatif.lm2.tp3 ?? '',
      'LM2 TP4': g.formatif.lm2.tp4 ?? '',
      'Sumatif LM1': g.sumatifLM.lm1 ?? '',
      'Sumatif LM2': g.sumatifLM.lm2 ?? '',
      'Sumatif LM3': g.sumatifLM.lm3 ?? '',
      'Sumatif LM4': g.sumatifLM.lm4 ?? '',
      'Sumatif LM5': g.sumatifLM.lm5 ?? '',
      'STS': g.sts ?? '',
      'SAS': g.sas ?? '',
      'Nilai Akhir': g.finalScore ?? '',
    }));
    exportToExcel(rows, `Daftar_Nilai_SDN_Kesilir_02_Kelas_${selectedClass}_${selectedSubject}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredGrades = grades.filter(g =>
    g.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.nis.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* CETAK KOP SURAT RESMI SDN KESILIR 02 (Aktif saat Print F4) */}
      {/* ============================================================== */}
      <div className="hidden print:block mb-2">
        <KopSurat />
        <div className="text-center my-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">
            DAFTAR NILAI SEMESTER {selectedSemester}
          </h2>
          <h3 className="text-xs font-bold uppercase">
            {schoolProfile?.name || 'SDN KESILIR 02'}
          </h3>
          <div className="flex justify-between items-center text-[10px] font-semibold mt-2 px-1">
            <span>KELAS : {selectedClass} ({selectedClass === '1' ? 'Satu' : selectedClass === '2' ? 'Dua' : selectedClass === '3' ? 'Tiga' : selectedClass === '4' ? 'Empat' : selectedClass === '5' ? 'Lima' : 'Enam'})</span>
            <span>MATA PELAJARAN : {selectedSubject.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Screen Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>Daftar Nilai Semester (Format Resmi SDN Kesilir 02)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Format tabel presisi sesuai Buku Nilai Asli (TP1–TP4 Formatif, LM1–LM5 Sumatif, STS, SAS)
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
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition flex items-center gap-1.5 shadow-sm"
            title="Cetak Presisi Kertas F4 (Folio) Landscape"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak F4 Landscape</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving || grades.length === 0}
            className="px-4 py-2 bg-school-navy text-white text-xs font-bold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Nilai'}</span>
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
                <option value="1">Kelas 1 (Satu)</option>
                <option value="2">Kelas 2 (Dua)</option>
                <option value="3">Kelas 3 (Tiga)</option>
                <option value="4">Kelas 4 (Empat)</option>
                <option value="5">Kelas 5 (Lima)</option>
                <option value="6">Kelas 6 (Enam)</option>
              </select>
            </div>

            {/* Mata Pelajaran */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Mata Pelajaran:</span>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
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
              placeholder="Cari siswa..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>
        </div>

        {/* View Toggle on Screen to Focus on Material Scope */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500">Fokus Layar Formatif:</span>
          {(['lm1', 'lm2', 'lm3', 'lm4', 'lm5'] as const).map(lm => (
            <button
              key={lm}
              type="button"
              onClick={() => setActiveLM(lm)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${activeLM === lm ? 'bg-school-navy text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Lingkup Materi {lm.replace('lm', '')}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABEL NILAI PERSIS GAMBAR 2 (SDN KESILIR 02) */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-black shadow-xs overflow-hidden print:border-black print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-black text-[11px] print:text-[8pt]">
            <thead>
              {/* Baris 1: Kategori Utama */}
              <tr className="bg-slate-100 font-bold border-b border-black">
                <th rowSpan={3} className="py-1 px-1 border border-black w-8">NO. URUT</th>
                <th rowSpan={3} className="py-1 px-1 border border-black w-14">NO. INDUK</th>
                <th rowSpan={3} className="py-1 px-2 border border-black text-left min-w-[170px]">NAMA</th>
                <th colSpan={20} className="py-1 px-1 border border-black bg-blue-50/60 print:bg-transparent">
                  FORMATIF
                </th>
                <th colSpan={5} className="py-1 px-1 border border-black bg-amber-50/60 print:bg-transparent">
                  SUMATIF LINGKUP MATERI
                </th>
                <th colSpan={3} className="py-1 px-1 border border-black bg-emerald-50/60 print:bg-transparent">
                  SUMATIF AKHIR SEMESTER
                </th>
              </tr>

              {/* Baris 2: Sub-Kategori Lingkup Materi */}
              <tr className="bg-slate-50 font-bold border-b border-black text-[10px] print:text-[7.5pt]">
                {/* Formatif Lingkup Materi 1-5 */}
                <th colSpan={4} className="py-0.5 border border-black">Lingkup Materi 1</th>
                <th colSpan={4} className="py-0.5 border border-black">Lingkup Materi 2</th>
                <th colSpan={4} className="py-0.5 border border-black">Lingkup Materi 3</th>
                <th colSpan={4} className="py-0.5 border border-black">Lingkup Materi 4</th>
                <th colSpan={4} className="py-0.5 border border-black">Lingkup Materi 5</th>

                {/* Sumatif LM */}
                <th rowSpan={2} className="py-0.5 border border-black w-7">LM1</th>
                <th rowSpan={2} className="py-0.5 border border-black w-7">LM2</th>
                <th rowSpan={2} className="py-0.5 border border-black w-7">LM3</th>
                <th rowSpan={2} className="py-0.5 border border-black w-7">LM4</th>
                <th rowSpan={2} className="py-0.5 border border-black w-7">LM5</th>

                {/* Sumatif Akhir */}
                <th rowSpan={2} className="py-0.5 border border-black w-8">STS</th>
                <th rowSpan={2} className="py-0.5 border border-black w-8">SAS</th>
                <th rowSpan={2} className="py-0.5 border border-black w-9 bg-slate-200 print:bg-transparent">NA</th>
              </tr>

              {/* Baris 3: TP1 - TP4 per Lingkup Materi */}
              <tr className="bg-slate-50 font-bold border-b border-black text-[9px] print:text-[7pt]">
                {/* LM 1 */}
                <th className="border border-black w-6">TP1</th>
                <th className="border border-black w-6">TP2</th>
                <th className="border border-black w-6">TP3</th>
                <th className="border border-black w-6">TP4</th>
                {/* LM 2 */}
                <th className="border border-black w-6">TP1</th>
                <th className="border border-black w-6">TP2</th>
                <th className="border border-black w-6">TP3</th>
                <th className="border border-black w-6">TP4</th>
                {/* LM 3 */}
                <th className="border border-black w-6">TP1</th>
                <th className="border border-black w-6">TP2</th>
                <th className="border border-black w-6">TP3</th>
                <th className="border border-black w-6">TP4</th>
                {/* LM 4 */}
                <th className="border border-black w-6">TP1</th>
                <th className="border border-black w-6">TP2</th>
                <th className="border border-black w-6">TP3</th>
                <th className="border border-black w-6">TP4</th>
                {/* LM 5 */}
                <th className="border border-black w-6">TP1</th>
                <th className="border border-black w-6">TP2</th>
                <th className="border border-black w-6">TP3</th>
                <th className="border border-black w-6">TP4</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={31} className="py-8 text-center text-slate-500">
                    Memuat data nilai...
                  </td>
                </tr>
              ) : filteredGrades.length === 0 ? (
                <tr>
                  <td colSpan={31} className="py-8 text-center text-slate-500">
                    Tidak ada siswa pada rombel ini.
                  </td>
                </tr>
              ) : (
                filteredGrades.map((g, idx) => (
                  <tr key={g.studentId} className="hover:bg-slate-50">
                    {/* No. Urut */}
                    <td className="border border-black py-1 font-medium">{idx + 1}</td>
                    {/* No. Induk */}
                    <td className="border border-black py-1 font-mono">{g.nis}</td>
                    {/* Nama Siswa */}
                    <td className="border border-black py-1 px-2 text-left font-bold uppercase truncate max-w-[190px]">
                      {g.studentName}
                    </td>

                    {/* LM1 TP1-4 */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm1.tp1 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm1', 'tp1', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] font-semibold focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm1.tp2 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm1', 'tp2', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] font-semibold focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm1.tp3 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm1', 'tp3', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm1.tp4 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm1', 'tp4', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>

                    {/* LM2 TP1-4 */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm2.tp1 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm2', 'tp1', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm2.tp2 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm2', 'tp2', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm2.tp3 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm2', 'tp3', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm2.tp4 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm2', 'tp4', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>

                    {/* LM3 TP1-4 */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm3.tp1 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm3', 'tp1', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm3.tp2 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm3', 'tp2', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm3.tp3 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm3', 'tp3', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm3.tp4 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm3', 'tp4', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>

                    {/* LM4 TP1-4 */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm4.tp1 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm4', 'tp1', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm4.tp2 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm4', 'tp2', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm4.tp3 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm4', 'tp3', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm4.tp4 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm4', 'tp4', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>

                    {/* LM5 TP1-4 */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm5.tp1 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm5', 'tp1', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm5.tp2 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm5', 'tp2', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm5.tp3 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm5', 'tp3', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.formatif.lm5.tp4 ?? ''}
                        onChange={e => handleTPChange(g.studentId, 'lm5', 'tp4', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>

                    {/* Sumatif LM 1-5 */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sumatifLM.lm1 ?? ''}
                        onChange={e => handleSumatifLMChange(g.studentId, 'lm1', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] font-semibold focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sumatifLM.lm2 ?? ''}
                        onChange={e => handleSumatifLMChange(g.studentId, 'lm2', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] font-semibold focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sumatifLM.lm3 ?? ''}
                        onChange={e => handleSumatifLMChange(g.studentId, 'lm3', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sumatifLM.lm4 ?? ''}
                        onChange={e => handleSumatifLMChange(g.studentId, 'lm4', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sumatifLM.lm5 ?? ''}
                        onChange={e => handleSumatifLMChange(g.studentId, 'lm5', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] focus:outline-hidden"
                      />
                    </td>

                    {/* STS */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sts ?? ''}
                        onChange={e => handleSpecialAssessmentChange(g.studentId, 'sts', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] font-semibold focus:outline-hidden"
                      />
                    </td>

                    {/* SAS */}
                    <td className="border border-black p-0">
                      <input
                        type="number"
                        value={g.sas ?? ''}
                        onChange={e => handleSpecialAssessmentChange(g.studentId, 'sas', e.target.value)}
                        className="w-full text-center p-0.5 bg-transparent border-none text-[11px] print:text-[8pt] font-semibold focus:outline-hidden"
                      />
                    </td>

                    {/* Nilai Akhir (NA) */}
                    <td className="border border-black py-1 font-extrabold text-[11px] print:text-[8pt] bg-slate-100 print:bg-transparent">
                      {g.finalScore !== null ? g.finalScore : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Keterangan & Tanda Tangan Resmi Sesuai Gambar 2 */}
      <div className="pt-2 text-[10px] print:text-[8pt] text-black">
        <div className="mb-4">
          <p className="font-bold">Keterangan :</p>
          <p className="italic">TP = Tujuan Pembelajaran</p>
          <p className="italic">LM = Lingkup Materi</p>
        </div>

        {/* Kolom Tanda Tangan Sesuai Gambar 2 */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs print:text-[9pt] pt-4">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold underline">
              {schoolProfile?.principalName || 'Abdullah Mahsar, S.Pd'}
            </p>
            <p>NIP. {schoolProfile?.principalNip || '198306012014121000'}</p>
          </div>

          <div>
            <p>Jember, {formatDateIndo(new Date())}</p>
            <p className="font-bold">Wali Kelas,</p>
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
