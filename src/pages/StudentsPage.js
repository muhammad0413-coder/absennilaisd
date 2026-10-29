/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * DATA SISWA (READ-ONLY DI WEBSITE) (src/pages/StudentsPage.js)
 * ==============================================================================
 * Catatan Arsitektur Resmi:
 * Sesuai aturan sistem, data induk siswa diinput & diperbarui manual di Google Sheets
 * oleh Administrator. Website hanya menampilkan data hasil sinkronisasi.
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, searchStudents, syncStudentsFromGoogleSheets } from '../services.js';
import { exportToCSV, triggerPrintReport } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderStudentsPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'semua';

  return `
    <div class="page-content">
      <!-- Header Data Siswa -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">👥 Data Induk Siswa (Kelas 1–6)</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Data induk siswa bersumber dari <strong>Google Sheets (Data_Siswa)</strong> dan disinkronkan ke Cloud Firestore.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-sync-students-now" title="Ambil pembaruan langsung dari Google Sheets (Data_Siswa)">
              🔄 Ambil Langsung dari Google Sheets
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-students-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-primary btn-sm" id="btn-print-students-list">
              🖨️ Cetak Daftar Siswa
            </button>
          </div>
        </div>

        <!-- Notifikasi Arsitektur Master Data -->
        <div style="padding: 0.75rem 1rem; border-radius: 8px; background: #eff6ff; border: 1px solid #bfdbfe; font-size: 0.82rem; color: #1e40af; margin-bottom: 1rem;" class="no-print">
          ℹ️ <strong>Ketentuan Master Data:</strong> Penambahan, pembaruan, dan mutasi data induk siswa dilakukan secara manual melalui spreadsheet <em>DATABASE SISWA SD</em> oleh Administrator. Website tidak menyediakan form tambah/ubah data induk untuk menjamin konsistensi satu pintu.
        </div>

        <!-- Filter Kelas, Status, & Pencarian -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;" class="no-print">
          <div style="flex: 1; min-width: 180px;">
            <label class="form-label">Tingkat Kelas</label>
            <select id="select-filter-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
              ${!userIsGuru ? '<option value="semua">Semua Kelas (1–6)</option>' : ''}
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2 (Fase A)</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3 (Fase B)</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4 (Fase B)</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5 (Fase C)</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Status Siswa</label>
            <select id="select-filter-status" class="form-select">
              <option value="Aktif">Siswa Aktif</option>
              <option value="Pindah">Siswa Pindah</option>
              <option value="Lulus">Siswa Lulus</option>
              <option value="semua">Semua Status</option>
            </select>
          </div>

          <div style="flex: 2; min-width: 220px;">
            <label class="form-label">Pencarian Nama / NIS / NISN</label>
            <input type="text" id="input-search-student-master" class="form-input" placeholder="Ketik nama atau nomor induk siswa...">
          </div>
        </div>
      </div>

      <!-- Tabel Data Siswa -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span>Daftar Siswa Terdaftar</span>
            <span class="badge badge-info" id="badge-total-students">0 Siswa</span>
          </h3>
          <span style="font-size: 0.78rem; color: #64748b;">Sumber: Google Sheets (Data_Siswa)</span>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-students-master">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Nama Lengkap</th>
                <th>Kelas</th>
                <th>L/P</th>
                <th>Tempat, Tanggal Lahir</th>
                <th>Nama Orang Tua</th>
                <th>Alamat</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="students-master-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function attachStudentsEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('select-filter-class');
  const selectStatus = document.getElementById('select-filter-status');
  const searchInput = document.getElementById('input-search-student-master');
  const btnExport = document.getElementById('btn-export-students-csv');
  const btnPrint = document.getElementById('btn-print-students-list');

  let currentList = [];

  const loadData = async () => {
    const kelas = userIsGuru ? user.kelas_id : (selectClass ? selectClass.value : 'semua');
    const status = selectStatus ? selectStatus.value : 'Aktif';
    const query = searchInput ? searchInput.value.trim() : '';

    const filterClassVal = kelas === 'semua' ? null : kelas;
    const all = await searchStudents(query, filterClassVal);

    currentList = all.filter(s => status === 'semua' || s.Status_Siswa === status);
    renderTable();
  };

  const renderTable = () => {
    const tbody = document.getElementById('students-master-tbody');
    const badgeCount = document.getElementById('badge-total-students');
    if (!tbody) return;

    badgeCount.textContent = `${currentList.length} Siswa`;

    if (currentList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 2rem; color: #64748b;">
            Tidak ditemukan siswa dengan kriteria filter tersebut.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = currentList.map((s, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.NIS}</strong></td>
        <td>${s.NISN || '-'}</td>
        <td>
          <div style="font-weight: 600; color: #0f172a;">${s.Nama_Lengkap}</div>
        </td>
        <td><span class="badge badge-info">Kelas ${s.Kelas}</span></td>
        <td>${s.Jenis_Kelamin === 'Laki-laki' || s.Jenis_Kelamin === 'L' ? 'L' : 'P'}</td>
        <td style="font-size: 0.8rem; color: #475569;">${s.Tempat_Lahir || '-'}, ${s.Tanggal_Lahir || '-'}</td>
        <td>${s.Nama_Orang_Tua || '-'}</td>
        <td style="font-size: 0.8rem; color: #64748b;">${s.Alamat || '-'}</td>
        <td>
          <span class="badge ${s.Status_Siswa === 'Aktif' ? 'badge-success' : (s.Status_Siswa === 'Pindah' ? 'badge-warning' : 'badge-neutral')}">
            ${s.Status_Siswa}
          </span>
        </td>
      </tr>
    `).join('');
  };

  if (selectClass) selectClass.onchange = loadData;
  if (selectStatus) selectStatus.onchange = loadData;
  if (searchInput) searchInput.oninput = loadData;

  // Cetak Daftar Siswa Resmi
  if (btnPrint) {
    btnPrint.onclick = async () => {
      const kelasLabel = userIsGuru ? CLASS_LABELS[user.kelas_id] : (selectClass.value === 'semua' ? 'Kelas 1–6' : CLASS_LABELS[selectClass.value]);
      const tableRowsHtml = currentList.map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${s.NIS}</td>
          <td style="text-align: center;">${s.NISN || '-'}</td>
          <td>${s.Nama_Lengkap}</td>
          <td style="text-align: center;">${s.Kelas}</td>
          <td style="text-align: center;">${s.Jenis_Kelamin === 'Laki-laki' || s.Jenis_Kelamin === 'L' ? 'L' : 'P'}</td>
          <td>${s.Tempat_Lahir || '-'}, ${s.Tanggal_Lahir || '-'}</td>
          <td>${s.Nama_Orang_Tua || '-'}</td>
          <td style="text-align: center;">${s.Status_Siswa}</td>
        </tr>
      `).join('');

      const html = `
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th style="width: 90px;">NISN</th>
              <th>Nama Lengkap Siswa</th>
              <th style="width: 50px;">Kls</th>
              <th style="width: 50px;">L/P</th>
              <th>Tempat, Tgl Lahir</th>
              <th>Nama Orang Tua</th>
              <th style="width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      `;

      await triggerPrintReport("Daftar Induk Siswa", kelasLabel, html);
    };
  }

  // Ekspor CSV
  if (btnExport) {
    btnExport.onclick = () => {
      exportToCSV("Data_Siswa_SD", currentList);
      toast.success("Data siswa berhasil diekspor ke CSV!");
    };
  }

  // Ambil Langsung dari Google Sheets
  const btnSyncNow = document.getElementById('btn-sync-students-now');
  if (btnSyncNow) {
    btnSyncNow.onclick = async () => {
      btnSyncNow.disabled = true;
      btnSyncNow.innerHTML = '⏳ Menghubungi Google Sheets...';
      try {
        const res = await syncStudentsFromGoogleSheets(user);
        toast.success(res.message);
        await loadData();
      } catch (e) {
        toast.error('Gagal mengambil data dari Google Sheets: ' + (e.message || e));
      } finally {
        btnSyncNow.disabled = false;
        btnSyncNow.innerHTML = '🔄 Ambil Langsung dari Google Sheets';
      }
    };
  }

  loadData();
}
