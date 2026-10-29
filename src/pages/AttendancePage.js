/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * MODUL ABSENSI SISWA (src/pages/AttendancePage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin } from '../permissions.js';
import { getStudents, getAttendance, saveAttendanceBatch } from '../services.js';
import { toast } from '../components/Toast.js';
import { triggerPrintReport, exportToCSV } from '../components/ReportPrint.js';

export async function renderAttendancePage() {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const defaultClass = userIsAdmin ? 'kelas_1' : user.kelas_id;
  const todayStr = new Date().toISOString().substring(0, 10);

  return `
    <div class="page-content">
      <!-- Header Modul Absensi -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📅 Modul Presensi & Kehadiran Siswa</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Pencatatan presensi harian siswa (Hadir, Sakit, Izin, Alpa) dan cetak laporan resmi.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-export-attendance-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-primary btn-sm" id="btn-print-attendance">
              🖨️ Cetak Lembar Absensi
            </button>
          </div>
        </div>

        <!-- Filter Kelas & Tanggal -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; padding-top: 0.5rem;" class="no-print">
          <div style="flex: 1; min-width: 180px;">
            <label class="form-label">Pilih Kelas</label>
            <select id="select-att-class" class="form-select" ${!userIsAdmin ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 180px;">
            <label class="form-label">Tanggal Presensi</label>
            <input type="date" id="input-att-date" class="form-input" value="${todayStr}">
          </div>

          <button class="btn btn-primary" id="btn-load-attendance" style="height: 42px;">
            Tampilkan Data
          </button>
        </div>
      </div>

      <!-- Ringkasan Kehadiran Hari Ini -->
      <div class="stats-grid" id="attendance-summary-cards">
        <!-- Rendered via JS -->
      </div>

      <!-- Tabel Input Presensi -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span>Daftar Siswa & Status Kehadiran</span>
            <span class="badge badge-info" id="badge-class-label">Kelas 1</span>
          </h3>
          <div class="no-print" style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-sm" id="btn-mark-all-present">
              ✓ Set Semua Hadir
            </button>
            <button class="btn btn-success btn-sm" id="btn-save-attendance-top">
              💾 Simpan Presensi
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-attendance">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>NIS</th>
                <th>Nama Siswa</th>
                <th style="text-align: center; width: 280px;">Status Kehadiran</th>
                <th>Keterangan (Opsional)</th>
              </tr>
            </thead>
            <tbody id="attendance-table-body">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 1.25rem;" class="no-print">
          <button class="btn btn-success btn-lg" id="btn-save-attendance-bottom">
            💾 Simpan Data Presensi Sekarang
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachAttendanceEvents() {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);

  const selectClass = document.getElementById('select-att-class');
  const inputDate = document.getElementById('input-att-date');
  const btnLoad = document.getElementById('btn-load-attendance');
  const btnMarkAll = document.getElementById('btn-mark-all-present');
  const btnSaveTop = document.getElementById('btn-save-attendance-top');
  const btnSaveBottom = document.getElementById('btn-save-attendance-bottom');
  const btnPrint = document.getElementById('btn-print-attendance');
  const btnExport = document.getElementById('btn-export-attendance-csv');

  let activeClass = userIsAdmin ? selectClass.value : user.kelas_id;
  let activeDate = inputDate.value;
  let currentStudents = [];
  let existingAttendance = [];

  const loadData = async () => {
    activeClass = userIsAdmin ? selectClass.value : user.kelas_id;
    activeDate = inputDate.value;

    const classLabel = activeClass === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';
    document.getElementById('badge-class-label').textContent = classLabel;

    // Load active students of the class
    const allStudents = await getStudents(activeClass);
    currentStudents = allStudents.filter(s => s.status_aktif === 'aktif');

    // Load attendance recorded for this date
    existingAttendance = await getAttendance(activeClass, activeDate);

    renderAttendanceRows();
    updateSummaryCards();
  };

  const renderAttendanceRows = () => {
    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    if (currentStudents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            Tidak ada siswa aktif di kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = currentStudents.map((s, idx) => {
      const recorded = existingAttendance.find(a => a.student_id === s.student_id);
      const currentStatus = recorded ? recorded.status_absensi : 'Hadir'; // Default Hadir
      const currentNote = recorded ? recorded.keterangan : '';

      return `
        <tr data-student-id="${s.student_id}">
          <td>${idx + 1}</td>
          <td><strong>${s.nis}</strong></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${s.nama_siswa}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${s.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
          </td>
          <td style="text-align: center;">
            <div style="display: inline-flex; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;" class="status-btn-group">
              <button type="button" class="btn-att-status ${currentStatus === 'Hadir' ? 'active-hadir' : ''}" data-status="Hadir" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                Hadir
              </button>
              <button type="button" class="btn-att-status ${currentStatus === 'Sakit' ? 'active-sakit' : ''}" data-status="Sakit" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 1px solid #cbd5e1;">
                Sakit
              </button>
              <button type="button" class="btn-att-status ${currentStatus === 'Izin' ? 'active-izin' : ''}" data-status="Izin" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 1px solid #cbd5e1;">
                Izin
              </button>
              <button type="button" class="btn-att-status ${currentStatus === 'Alpa' ? 'active-alpa' : ''}" data-status="Alpa" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 1px solid #cbd5e1;">
                Alpa
              </button>
            </div>
            <input type="hidden" class="input-row-status" value="${currentStatus}">
          </td>
          <td>
            <input type="text" class="form-input input-row-note" placeholder="Keterangan (contoh: demam, acara)" value="${currentNote}" style="font-size: 0.85rem; padding: 4px 8px;">
          </td>
        </tr>
      `;
    }).join('');

    // Style the status buttons
    applyStatusButtonStyles();
  };

  const applyStatusButtonStyles = () => {
    document.querySelectorAll('#attendance-table-body tr').forEach(tr => {
      const buttons = tr.querySelectorAll('.btn-att-status');
      const hiddenInput = tr.querySelector('.input-row-status');

      buttons.forEach(btn => {
        const status = btn.getAttribute('data-status');
        updateSingleButtonStyle(btn, status, status === hiddenInput.value);

        btn.onclick = () => {
          hiddenInput.value = status;
          buttons.forEach(b => updateSingleButtonStyle(b, b.getAttribute('data-status'), b === btn));
          updateSummaryCards();
        };
      });
    });
  };

  const updateSingleButtonStyle = (btn, status, isActive) => {
    if (isActive) {
      if (status === 'Hadir') { btn.style.background = '#10b981'; btn.style.color = '#fff'; }
      if (status === 'Sakit') { btn.style.background = '#0284c7'; btn.style.color = '#fff'; }
      if (status === 'Izin')  { btn.style.background = '#f59e0b'; btn.style.color = '#fff'; }
      if (status === 'Alpa')  { btn.style.background = '#ef4444'; btn.style.color = '#fff'; }
    } else {
      btn.style.background = '#ffffff';
      btn.style.color = '#475569';
    }
  };

  const updateSummaryCards = () => {
    const summaryContainer = document.getElementById('attendance-summary-cards');
    if (!summaryContainer) return;

    let hadir = 0, sakit = 0, izin = 0, alpa = 0;
    document.querySelectorAll('.input-row-status').forEach(inp => {
      if (inp.value === 'Hadir') hadir++;
      else if (inp.value === 'Sakit') sakit++;
      else if (inp.value === 'Izin') izin++;
      else if (inp.value === 'Alpa') alpa++;
    });

    summaryContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div>
          <div class="stat-val">${hadir}</div>
          <div class="stat-label">Hadir</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">🏥</div>
        <div>
          <div class="stat-val">${sakit}</div>
          <div class="stat-label">Sakit</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber">✉️</div>
        <div>
          <div class="stat-val">${izin}</div>
          <div class="stat-label">Izin</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rose">⚠️</div>
        <div>
          <div class="stat-val">${alpa}</div>
          <div class="stat-label">Alpa</div>
        </div>
      </div>
    `;
  };

  const saveAttendanceData = async () => {
    const rows = document.querySelectorAll('#attendance-table-body tr');
    if (rows.length === 0) return;

    const payload = [];
    rows.forEach(tr => {
      const studentId = tr.getAttribute('data-student-id');
      const status = tr.querySelector('.input-row-status').value;
      const note = tr.querySelector('.input-row-note').value.trim();

      if (studentId) {
        payload.push({
          student_id: studentId,
          kelas_id: activeClass,
          tanggal: activeDate,
          status_absensi: status,
          keterangan: note
        });
      }
    });

    try {
      const res = await saveAttendanceBatch(user, payload);
      toast.success(res.message);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan absensi.');
    }
  };

  // Event Listeners
  if (btnLoad) btnLoad.onclick = loadData;
  if (btnSaveTop) btnSaveTop.onclick = saveAttendanceData;
  if (btnSaveBottom) btnSaveBottom.onclick = saveAttendanceData;

  if (btnMarkAll) {
    btnMarkAll.onclick = () => {
      document.querySelectorAll('#attendance-table-body tr').forEach(tr => {
        tr.querySelector('.input-row-status').value = 'Hadir';
        const buttons = tr.querySelectorAll('.btn-att-status');
        buttons.forEach(b => updateSingleButtonStyle(b, b.getAttribute('data-status'), b.getAttribute('data-status') === 'Hadir'));
      });
      updateSummaryCards();
      toast.info("Seluruh siswa diatur menjadi 'Hadir'. Klik Simpan untuk memperbarui database.");
    };
  }

  // Print Report
  if (btnPrint) {
    btnPrint.onclick = async () => {
      const classLabel = activeClass === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';
      const formattedDate = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(activeDate));

      const tableRows = currentStudents.map((s, idx) => {
        const row = document.querySelector(`tr[data-student-id="${s.student_id}"]`);
        const status = row ? row.querySelector('.input-row-status').value : 'Hadir';
        const note = row ? row.querySelector('.input-row-note').value : '-';

        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="text-align: center;">${s.nis}</td>
            <td>${s.nama_siswa}</td>
            <td style="text-align: center;">${s.jenis_kelamin}</td>
            <td style="text-align: center; font-weight: bold;">${status}</td>
            <td>${note || '-'}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <div style="margin-bottom: 15px;">
          <strong>Hari / Tanggal:</strong> ${formattedDate}
        </div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th style="width: 60px;">L/P</th>
              <th style="width: 90px;">Status</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;

      await triggerPrintReport(`Laporan Presensi Harian Siswa`, classLabel, htmlContent);
    };
  }

  // Export CSV
  if (btnExport) {
    btnExport.onclick = () => {
      const exportRows = currentStudents.map(s => {
        const row = document.querySelector(`tr[data-student-id="${s.student_id}"]`);
        return {
          Tanggal: activeDate,
          Kelas: activeClass === 'kelas_1' ? 'Kelas 1' : 'Kelas 6',
          NIS: s.nis,
          Nama_Siswa: s.nama_siswa,
          Jenis_Kelamin: s.jenis_kelamin,
          Status_Kehadiran: row ? row.querySelector('.input-row-status').value : 'Hadir',
          Keterangan: row ? row.querySelector('.input-row-note').value : ''
        };
      });

      exportToCSV(`Presensi_${activeClass}_${activeDate}`, exportRows);
      toast.success("File CSV presensi berhasil diunduh!");
    };
  }

  // Initial load
  loadData();
}
