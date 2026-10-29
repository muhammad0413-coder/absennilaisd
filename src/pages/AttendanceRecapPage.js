/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * REKAPITULASI ABSENSI (src/pages/AttendanceRecapPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { calculateAttendanceRecap } from '../services.js';
import { triggerPrintReport, exportToCSV } from '../components/ReportPrint.js';
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

      <!-- Tabel Rekapitulasi -->
      <div class="card">
        <div class="table-responsive">
          <table class="table" id="table-recap-attendance">
            <thead>
              <tr>
                <th style="width: 45px;">No</th>
                <th style="width: 85px;">NIS</th>
                <th>Nama Siswa</th>
                <th style="text-align: center; color: #10b981;">Hadir (H)</th>
                <th style="text-align: center; color: #0284c7;">Sakit (S)</th>
                <th style="text-align: center; color: #f59e0b;">Izin (I)</th>
                <th style="text-align: center; color: #ef4444;">Alpa (A)</th>
                <th style="text-align: center;">Total Hari</th>
                <th style="text-align: center;">% Kehadiran</th>
              </tr>
            </thead>
            <tbody id="recap-attendance-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
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

  const loadData = async () => {
    const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
    const bulan = inputMonth.value || null;
    const startDate = inputStart.value || null;
    const endDate = inputEnd.value || null;

    currentRecapData = await calculateAttendanceRecap(activeClass, startDate, endDate, bulan);

    document.getElementById('val-total-hari-tercatat').textContent = `${currentRecapData.totalHariTercatat} Hari`;

    const tbody = document.getElementById('recap-attendance-tbody');
    if (!tbody) return;

    if (currentRecapData.recap.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">
            Belum ada data presensi yang tercatat untuk filter ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = currentRecapData.recap.map((r, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${r.student.NIS}</strong></td>
        <td>
          <div style="font-weight: 600; color: #0f172a;">${r.student.Nama_Lengkap}</div>
        </td>
        <td style="text-align: center; font-weight: bold; color: #10b981;">${r.hadir}</td>
        <td style="text-align: center; font-weight: bold; color: #0284c7;">${r.sakit}</td>
        <td style="text-align: center; font-weight: bold; color: #f59e0b;">${r.izin}</td>
        <td style="text-align: center; font-weight: bold; color: #ef4444;">${r.alpa}</td>
        <td style="text-align: center;">${r.totalHari}</td>
        <td style="text-align: center;">
          <span class="badge ${parseInt(r.persentase) >= 80 ? 'badge-success' : 'badge-warning'}" style="font-size: 0.85rem;">
            ${r.persentase}
          </span>
        </td>
      </tr>
    `).join('');
  };

  if (btnApply) btnApply.onclick = loadData;
  if (selectClass) selectClass.onchange = loadData;

  // Cetak Rekap Resmi
  if (btnPrint) {
    btnPrint.onclick = async () => {
      if (!currentRecapData || currentRecapData.recap.length === 0) {
        toast.warning("Tidak ada data rekap untuk dicetak.");
        return;
      }

      const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
      const classLabel = CLASS_LABELS[activeClass] || 'Kelas';

      const rowsHtml = currentRecapData.recap.map((r, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${r.student.NIS}</td>
          <td>${r.student.Nama_Lengkap}</td>
          <td style="text-align: center;">${r.hadir}</td>
          <td style="text-align: center;">${r.sakit}</td>
          <td style="text-align: center;">${r.izin}</td>
          <td style="text-align: center;">${r.alpa}</td>
          <td style="text-align: center;">${r.totalHari}</td>
          <td style="text-align: center; font-weight: bold;">${r.persentase}</td>
        </tr>
      `).join('');

      const html = `
        <div style="margin-bottom: 12px; font-size: 9pt;">
          <strong>Total Hari Pertemuan Efektif:</strong> ${currentRecapData.totalHariTercatat} Hari
        </div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 75px;">NIS</th>
              <th>Nama Siswa</th>
              <th style="width: 45px;">H</th>
              <th style="width: 45px;">S</th>
              <th style="width: 45px;">I</th>
              <th style="width: 45px;">A</th>
              <th style="width: 65px;">Total Hari</th>
              <th style="width: 75px;">% Hadir</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      await triggerPrintReport("Rekapitulasi Kehadiran Siswa", classLabel, html);
    };
  }

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
