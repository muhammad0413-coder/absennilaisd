/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * REKAPITULASI NILAI SISWA (src/pages/GradesRecapPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { calculateGradesRecap, getStudents, getGrades, getSettings } from '../services.js';
import { triggerPrintReport, triggerPrintAuthenticLandscape, generateGradesSemesterSheetHtml, exportToCSV } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderGradesRecapPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'kelas_1';
  const settings = await getSettings();

  const mapelList = (settings.daftar_mata_pelajaran || "Pendidikan Pancasila,Bahasa Indonesia,Matematika,IPAS,PJOK,Seni Budaya,Bahasa Inggris").split(',');

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📝 Rekapitulasi Capaian Nilai Siswa</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Laporan rata-rata capaian belajar per mata pelajaran untuk pelaporan rapor Kurikulum Merdeka.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-export-grades-recap-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-primary btn-sm" id="btn-print-grades-recap">
              🖨️ Cetak Lembar Nilai
            </button>
          </div>
        </div>

        <!-- Filter Rekap Nilai -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;" class="no-print">
          <div style="flex: 1; min-width: 170px;">
            <label class="form-label">Tingkat Kelas</label>
            <select id="select-recap-g-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6</option>
            </select>
          </div>

          <div style="flex: 2; min-width: 220px;">
            <label class="form-label">Mata Pelajaran</label>
            <select id="select-recap-g-subject" class="form-select">
              ${mapelList.map(m => `<option value="${m.trim()}">${m.trim()}</option>`).join('')}
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Semester</label>
            <select id="select-recap-g-sem" class="form-select">
              <option value="1 (Ganjil)">1 (Ganjil)</option>
              <option value="2 (Genap)">2 (Genap)</option>
            </select>
          </div>

          <button class="btn btn-primary" id="btn-apply-grades-recap" style="height: 42px;">
            Tampilkan Rekap
          </button>
        </div>
      </div>

      <!-- Lembar Daftar Nilai Semester Autentik (Format Resmi Gambar 2: Kurikulum Merdeka) -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 class="card-title">📋 Format Resmi Daftar Nilai Semester (Gambar 2)</h3>
            <span style="font-size: 0.78rem; color: #64748b;">Kurikulum Merdeka: Formatif (LM 1-5, TP 1-4), Sumatif LM 1-5, SAS, &amp; NA Semester</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-print-authentic-grades">
            🖨️ Cetak Lembar Nilai Kurikulum Merdeka (PDF)
          </button>
        </div>

        <div class="table-responsive" id="container-authentic-grades-sheet" style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto;">
          <!-- Rendered via JS -->
        </div>
      </div>
    </div>
  `;
}

export function attachGradesRecapEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('select-recap-g-class');
  const selectSubject = document.getElementById('select-recap-g-subject');
  const selectSem = document.getElementById('select-recap-g-sem');
  const btnApply = document.getElementById('btn-apply-grades-recap');
  const btnPrint = document.getElementById('btn-print-grades-recap');
  const btnExport = document.getElementById('btn-export-grades-recap-csv');

  let currentAuthenticGradesHtml = "";

  const loadData = async () => {
    const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
    const subject = selectSubject.value;
    const sem = selectSem.value;

    const students = await getStudents(activeClass, 'Aktif');
    const allGrades = await getGrades(activeClass, subject, null, sem);
    const settings = await getSettings();
    const classLabel = CLASS_LABELS[activeClass] || 'Kelas';

    currentAuthenticGradesHtml = generateGradesSemesterSheetHtml(
      students, 
      allGrades, 
      subject, 
      sem, 
      settings, 
      classLabel, 
      user.displayName || user.email
    );

    const containerAuthentic = document.getElementById('container-authentic-grades-sheet');
    if (containerAuthentic) {
      containerAuthentic.innerHTML = currentAuthenticGradesHtml;
    }
  };

  if (btnApply) btnApply.onclick = loadData;
  if (selectClass) selectClass.onchange = loadData;
  if (selectSubject) selectSubject.onchange = loadData;
  if (selectSem) selectSem.onchange = loadData;

  // Cetak Format Resmi Gambar 2
  const doPrintGrades = () => {
    if (!currentAuthenticGradesHtml) {
      toast.warning("Menyiapkan lembar nilai...");
      loadData().then(() => triggerPrintAuthenticLandscape(currentAuthenticGradesHtml));
      return;
    }
    triggerPrintAuthenticLandscape(currentAuthenticGradesHtml);
  };

  if (btnPrint) btnPrint.onclick = doPrintGrades;
  const btnPrintAuthentic = document.getElementById('btn-print-authentic-grades');
  if (btnPrintAuthentic) btnPrintAuthentic.onclick = doPrintGrades;

  // Ekspor CSV
  if (btnExport) {
    btnExport.onclick = () => {
      if (recapRows.length === 0) {
        toast.warning("Tidak ada data untuk diekspor.");
        return;
      }

      const exportRows = recapRows.map(r => ({
        NIS: r.student.NIS,
        Nama_Siswa: r.student.Nama_Lengkap,
        Kelas: r.student.Kelas,
        Mata_Pelajaran: selectSubject.value,
        Total_Asesmen: r.totalAsesmen,
        Rata_Rata: r.rataRata,
        Keterangan: r.grades.length > 0 ? r.grades[0].Deskripsi || '' : ''
      }));

      exportToCSV(`Rekap_Nilai_${selectSubject.value}`, exportRows);
      toast.success("Rekap nilai berhasil diekspor ke CSV!");
    };
  }

  loadData();
}
