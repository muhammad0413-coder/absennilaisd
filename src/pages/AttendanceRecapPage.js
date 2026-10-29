/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * REKAPITULASI ABSENSI (src/pages/AttendanceRecapPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { calculateAttendanceRecap, getStudents, getAttendance, getSettings } from '../services.js';
import { triggerPrintReport, triggerPrintAuthenticLandscape, generateAttendanceMonthSheetHtml, exportToCSV } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderAttendanceRecapPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'kelas_1';

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📈 Rekapitulasi Presensi Kehadiran Siswa</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Laporan persentase kehadiran bulanan dan semesteran sesuai rumus resmi: <em>Hadir ÷ Total Hari Tercatat × 100%</em>.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-export-recap-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-primary btn-sm" id="btn-print-recap">
              🖨️ Cetak Rekap Presensi
            </button>
          </div>
        </div>

        <!-- Filter Kelas & Periode -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;" class="no-print">
          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Tingkat Kelas</label>
            <select id="select-recap-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Pilih Bulan (Opsional)</label>
            <input type="month" id="input-recap-month" class="form-input">
          </div>

          <div style="flex: 1; min-width: 150px;">
            <label class="form-label">Tanggal Mulai</label>
            <input type="date" id="input-recap-start" class="form-input">
          </div>

          <div style="flex: 1; min-width: 150px;">
            <label class="form-label">Tanggal Selesai</label>
            <input type="date" id="input-recap-end" class="form-input">
          </div>

          <button class="btn btn-primary" id="btn-apply-recap" style="height: 42px;">
            Tampilkan Rekap
          </button>
        </div>
      </div>

      <!-- Ringkasan Periode Tercatat -->
      <div class="card" style="padding: 1rem 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Total Hari Efektif Tercatat</span>
            <div style="font-size: 1.4rem; font-weight: 800; color: #1e3a8a;" id="val-total-hari-tercatat">0 Hari</div>
          </div>
          <div style="font-size: 0.8rem; color: #64748b;">
            ℹ️ Hari tanpa catatan presensi tidak otomatis dihitung alpa.
          </div>
        </div>
      </div>

      <!-- Lembar Daftar Hadir Bulanan Autentik (Format Resmi Gambar 1: Tanggal 1-31) -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 class="card-title">📋 Format Resmi Daftar Hadir Bulanan (Gambar 1)</h3>
            <span style="font-size: 0.78rem; color: #64748b;">Layout kolom Tanggal 1–31, S, I, A, Jumlah, &amp; Tanda Tangan Resmi</span>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-print-authentic-att">
            🖨️ Cetak Lembar Hadir 1–31 (PDF)
          </button>
        </div>

        <div class="table-responsive" id="container-authentic-att-sheet" style="background: #ffffff; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto;">
          <!-- Rendered via JS -->
        </div>
      </div>
    </div>
  `;
}

export function attachAttendanceRecapEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('select-recap-class');
  const inputMonth = document.getElementById('input-recap-month');
  const inputStart = document.getElementById('input-recap-start');
  const inputEnd = document.getElementById('input-recap-end');
  const btnApply = document.getElementById('btn-apply-recap');
  const btnPrint = document.getElementById('btn-print-recap');
  const btnExport = document.getElementById('btn-export-recap-csv');

  let currentRecapData = null;
  let currentAuthenticHtml = "";

  const loadData = async () => {
    const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
    const bulan = inputMonth ? inputMonth.value : null;
    const startDate = inputStart ? inputStart.value : null;
    const endDate = inputEnd ? inputEnd.value : null;

    currentRecapData = await calculateAttendanceRecap(activeClass, startDate, endDate, bulan);

    const valEl = document.getElementById('val-total-hari-tercatat');
    if (valEl) valEl.textContent = `${currentRecapData.totalHariTercatat} Hari`;

    // Render Lembar Autentik Format Gambar 1 (Tanggal 1-31)
    const students = await getStudents(activeClass, 'Aktif');
    const allAttendance = await getAttendance(activeClass, null, bulan);
    const settings = await getSettings();
    const classLabel = CLASS_LABELS[activeClass] || 'Kelas';

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let monthLabel = "Bulan Ini";
    if (bulan) {
      const [y, m] = bulan.split('-');
      monthLabel = `${monthNames[parseInt(m, 10) - 1]} ${y}`;
    } else {
      const now = new Date();
      monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    currentAuthenticHtml = generateAttendanceMonthSheetHtml(students, allAttendance, monthLabel, settings, classLabel, user.displayName || user.email);

    const containerAuthentic = document.getElementById('container-authentic-att-sheet');
    if (containerAuthentic) {
      containerAuthentic.innerHTML = currentAuthenticHtml;
    }
  };

  if (btnApply) btnApply.onclick = loadData;
  if (selectClass) selectClass.onchange = loadData;
  if (inputMonth) inputMonth.onchange = loadData;

  // Cetak Format Resmi Gambar 1
  const doPrint = () => {
    if (!currentAuthenticHtml) {
      toast.warning("Menyiapkan dokumen...");
      loadData().then(() => triggerPrintAuthenticLandscape(currentAuthenticHtml));
      return;
    }
    triggerPrintAuthenticLandscape(currentAuthenticHtml);
  };

  if (btnPrint) btnPrint.onclick = doPrint;
  const btnPrintAuthentic = document.getElementById('btn-print-authentic-att');
  if (btnPrintAuthentic) btnPrintAuthentic.onclick = doPrint;

  // Ekspor CSV
  if (btnExport) {
    btnExport.onclick = () => {
      if (!currentRecapData || currentRecapData.recap.length === 0) {
        toast.warning("Tidak ada data rekap untuk diekspor.");
        return;
      }
      const exportRows = currentRecapData.recap.map(r => ({
        NIS: r.student.NIS,
        Nama_Siswa: r.student.Nama_Lengkap,
        Kelas: r.student.Kelas,
        Hadir: r.hadir,
        Sakit: r.sakit,
        Izin: r.izin,
        Alpa: r.alpa,
        Total_Hari_Tercatat: r.totalHari,
        Persentase_Kehadiran: r.persentase
      }));

      exportToCSV("Rekap_Presensi_Siswa", exportRows);
      toast.success("Rekap presensi berhasil diekspor ke CSV!");
    };
  }

  loadData();
}
