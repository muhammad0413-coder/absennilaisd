/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * REKAPITULASI NILAI SISWA (src/pages/GradesRecapPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { calculateGradesRecap, getSettings } from '../services.js';
import { triggerPrintReport, exportToCSV } from '../components/ReportPrint.js';
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

      <!-- Tabel Rekap Nilai -->
      <div class="card">
        <div class="table-responsive">
          <table class="table" id="table-grades-recap">
            <thead>
              <tr>
                <th style="width: 45px;">No</th>
                <th style="width: 85px;">NIS</th>
                <th>Nama Siswa</th>
                <th style="text-align: center;">Jumlah Asesmen</th>
                <th style="text-align: center;">Nilai Rata-Rata</th>
                <th style="text-align: center;">Status Ketuntasan</th>
                <th>Catatan Capaian Belajar</th>
              </tr>
            </thead>
            <tbody id="grades-recap-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
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

  let recapRows = [];

  const loadData = async () => {
    const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
    const subject = selectSubject.value;
    const sem = selectSem.value;

    recapRows = await calculateGradesRecap(activeClass, subject, sem);

    const tbody = document.getElementById('grades-recap-tbody');
    if (!tbody) return;

    if (recapRows.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">
            Tidak ada siswa aktif terdaftar di kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recapRows.map((r, idx) => {
      const avgNum = parseFloat(r.rataRata);
      const isComplete = !isNaN(avgNum);
      const isPassed = isComplete && avgNum >= 75;

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${r.student.NIS}</strong></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${r.student.Nama_Lengkap}</div>
          </td>
          <td style="text-align: center;">${r.totalAsesmen} Asesmen</td>
          <td style="text-align: center;">
            <strong style="font-size: 1.15rem; color: ${isComplete ? (isPassed ? '#10b981' : '#ef4444') : '#94a3b8'};">
              ${r.rataRata}
            </strong>
          </td>
          <td style="text-align: center;">
            <span class="badge ${isComplete ? (isPassed ? 'badge-success' : 'badge-danger') : 'badge-warning'}">
              ${isComplete ? (isPassed ? 'Tuntas' : 'Perlu Bimbingan') : 'Belum Ada Nilai'}
            </span>
          </td>
          <td style="font-size: 0.82rem; color: #475569;">
            ${r.grades.length > 0 ? r.grades[0].Deskripsi || '-' : 'Belum ada penilaian tercatat'}
          </td>
        </tr>
      `;
    }).join('');
  };

  if (btnApply) btnApply.onclick = loadData;
  if (selectClass) selectClass.onchange = loadData;
  if (selectSubject) selectSubject.onchange = loadData;

  // Cetak Rekap Nilai Resmi
  if (btnPrint) {
    btnPrint.onclick = async () => {
      if (recapRows.length === 0) {
        toast.warning("Tidak ada data nilai untuk dicetak.");
        return;
      }

      const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
      const classLabel = CLASS_LABELS[activeClass] || 'Kelas';
      const mapelName = selectSubject.value;

      const rowsHtml = recapRows.map((r, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${r.student.NIS}</td>
          <td>${r.student.Nama_Lengkap}</td>
          <td style="text-align: center;">${r.totalAsesmen}</td>
          <td style="text-align: center; font-weight: bold;">${r.rataRata}</td>
          <td style="text-align: center;">${r.rataRata !== "Belum Ada Nilai" && parseFloat(r.rataRata) >= 75 ? 'Tuntas' : 'Belum'}</td>
          <td>${r.grades.length > 0 ? r.grades[0].Deskripsi || '-' : '-'}</td>
        </tr>
      `).join('');

      const html = `
        <div style="margin-bottom: 12px; font-size: 9.5pt;">
          <strong>Mata Pelajaran:</strong> ${mapelName} | <strong>Semester:</strong> ${selectSem.value}
        </div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 75px;">NIS</th>
              <th>Nama Siswa</th>
              <th style="width: 70px;">Jml Asesmen</th>
              <th style="width: 75px;">Rata-Rata</th>
              <th style="width: 70px;">Status</th>
              <th>Catatan Capaian</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      await triggerPrintReport(`Rekapitulasi Nilai Capaian Siswa`, classLabel, html);
    };
  }

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
