/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * ABSENSI HARIAN (src/pages/AttendanceDailyPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, getAttendance, saveAttendanceBatch } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderAttendanceDailyPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'kelas_1';
  const todayStr = new Date().toISOString().substring(0, 10);

  return `
    <div class="page-content">
      <!-- Header Absensi Harian -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📅 Presensi &amp; Absensi Harian Siswa</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Pencatatan presensi siswa harian (Hadir, Sakit, Izin, Alpa) ke Cloud Firestore &amp; salinan ke Google Sheets.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <a href="#attendance-recap" class="btn btn-outline btn-sm">
              📈 Lihat Rekap Kehadiran
            </a>
          </div>
        </div>

        <!-- Filter Kelas & Tanggal -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;" class="no-print">
          <div style="flex: 1; min-width: 180px;">
            <label class="form-label">Tingkat Kelas</label>
            <select id="select-daily-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 180px;">
            <label class="form-label">Tanggal Presensi</label>
            <input type="date" id="input-daily-date" class="form-input" value="${todayStr}">
          </div>

          <button class="btn btn-primary" id="btn-load-daily" style="height: 42px;">
            Muat Data Siswa
          </button>
        </div>
      </div>

      <!-- Ringkasan Kehadiran Sesi -->
      <div class="stats-grid" id="daily-attendance-stats">
        <!-- Rendered via JS -->
      </div>

      <!-- Tabel Input Presensi -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <h3 class="card-title">
            <span>Daftar Siswa &amp; Status Presensi</span>
            <span class="badge badge-info" id="badge-daily-class-label">Kelas 1</span>
          </h3>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-set-all-present">
              ✓ Hadir Semua
            </button>
            <button class="btn btn-success btn-sm" id="btn-save-daily-top">
              🚀 Simpan &amp; Kirim ke Google Sheets
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-daily-attendance">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 90px;">NIS</th>
                <th>Nama Siswa</th>
                <th style="text-align: center; width: 300px;">Status Kehadiran</th>
                <th>Keterangan (Opsional)</th>
              </tr>
            </thead>
            <tbody id="daily-attendance-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;" class="no-print">
          <button class="btn btn-success btn-lg" id="btn-save-daily-bottom">
            🚀 Simpan Presensi &amp; Kirim Langsung ke Google Sheets
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachAttendanceDailyEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('select-daily-class');
  const inputDate = document.getElementById('input-daily-date');
  const btnLoad = document.getElementById('btn-load-daily');
  const btnSetAll = document.getElementById('btn-set-all-present');
  const btnSaveTop = document.getElementById('btn-save-daily-top');
  const btnSaveBottom = document.getElementById('btn-save-daily-bottom');

  let activeClass = userIsGuru ? user.kelas_id : selectClass.value;
  let activeDate = inputDate.value;
  let studentsList = [];
  let existingRecords = [];

  const loadData = async () => {
    activeClass = userIsGuru ? user.kelas_id : selectClass.value;
    activeDate = inputDate.value;

    const classLabel = CLASS_LABELS[activeClass] || 'Kelas';
    document.getElementById('badge-daily-class-label').textContent = classLabel;

    studentsList = await getStudents(activeClass, 'Aktif');
    existingRecords = await getAttendance(activeClass, activeDate);

    renderRows();
    updateStats();
  };

  const renderRows = () => {
    const tbody = document.getElementById('daily-attendance-tbody');
    if (!tbody) return;

    if (studentsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            Tidak ada siswa aktif terdaftar di kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = studentsList.map((s, idx) => {
      const recorded = existingRecords.find(a => a.ID_Siswa === s.ID_Siswa);
      const currentStatus = recorded ? recorded.Status_Absensi : 'Hadir';
      const currentNote = recorded ? recorded.Keterangan : '';

      return `
        <tr data-student-id="${s.ID_Siswa}" data-nis="${s.NIS}" data-nisn="${s.NISN || ''}" data-name="${s.Nama_Lengkap}">
          <td>${idx + 1}</td>
          <td><strong>${s.NIS}</strong></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${s.Nama_Lengkap}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${s.Jenis_Kelamin}</div>
          </td>
          <td style="text-align: center;">
            <div style="display: inline-flex; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1;">
              <button type="button" class="btn-stat-opt ${currentStatus === 'Hadir' ? 'active' : ''}" data-status="Hadir" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; ${currentStatus === 'Hadir' ? 'background: #10b981; color: white;' : 'background: white; color: #475569;'}">
                Hadir
              </button>
              <button type="button" class="btn-stat-opt ${currentStatus === 'Sakit' ? 'active' : ''}" data-status="Sakit" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 1px solid #cbd5e1; ${currentStatus === 'Sakit' ? 'background: #0284c7; color: white;' : 'background: white; color: #475569;'}">
                Sakit
              </button>
              <button type="button" class="btn-stat-opt ${currentStatus === 'Izin' ? 'active' : ''}" data-status="Izin" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 1px solid #cbd5e1; ${currentStatus === 'Izin' ? 'background: #f59e0b; color: white;' : 'background: white; color: #475569;'}">
                Izin
              </button>
              <button type="button" class="btn-stat-opt ${currentStatus === 'Alpa' ? 'active' : ''}" data-status="Alpa" style="padding: 6px 12px; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; border-left: 1px solid #cbd5e1; ${currentStatus === 'Alpa' ? 'background: #ef4444; color: white;' : 'background: white; color: #475569;'}">
                Alpa
              </button>
            </div>
            <input type="hidden" class="hidden-status-input" value="${currentStatus}">
          </td>
          <td>
            <input type="text" class="form-input note-input" placeholder="Keterangan..." value="${currentNote}" style="font-size: 0.85rem; padding: 4px 8px;">
          </td>
        </tr>
      `;
    }).join('');

    attachStatusButtonEvents();
  };

  const attachStatusButtonEvents = () => {
    document.querySelectorAll('#daily-attendance-tbody tr').forEach(tr => {
      const buttons = tr.querySelectorAll('.btn-stat-opt');
      const hiddenInput = tr.querySelector('.hidden-status-input');

      buttons.forEach(btn => {
        btn.onclick = () => {
          const status = btn.getAttribute('data-status');
          hiddenInput.value = status;

          buttons.forEach(b => {
            const bStatus = b.getAttribute('data-status');
            if (b === btn) {
              if (bStatus === 'Hadir') { b.style.background = '#10b981'; b.style.color = '#fff'; }
              if (bStatus === 'Sakit') { b.style.background = '#0284c7'; b.style.color = '#fff'; }
              if (bStatus === 'Izin')  { b.style.background = '#f59e0b'; b.style.color = '#fff'; }
              if (bStatus === 'Alpa')  { b.style.background = '#ef4444'; b.style.color = '#fff'; }
            } else {
              b.style.background = '#ffffff';
              b.style.color = '#475569';
            }
          });
          updateStats();
        };
      });
    });
  };

  const updateStats = () => {
    const statsContainer = document.getElementById('daily-attendance-stats');
    if (!statsContainer) return;

    let hadir = 0, sakit = 0, izin = 0, alpa = 0;
    document.querySelectorAll('.hidden-status-input').forEach(inp => {
      if (inp.value === 'Hadir') hadir++;
      else if (inp.value === 'Sakit') sakit++;
      else if (inp.value === 'Izin') izin++;
      else if (inp.value === 'Alpa') alpa++;
    });

    const total = hadir + sakit + izin + alpa;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div>
          <div class="stat-val">${hadir} (${persentase}%)</div>
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

  const saveAttendance = async () => {
    const rows = document.querySelectorAll('#daily-attendance-tbody tr');
    if (rows.length === 0) return;

    const payload = [];
    rows.forEach(tr => {
      const studentId = tr.getAttribute('data-student-id');
      const nis = tr.getAttribute('data-nis');
      const nisn = tr.getAttribute('data-nisn');
      const nama = tr.getAttribute('data-name');
      const status = tr.querySelector('.hidden-status-input').value;
      const note = tr.querySelector('.note-input').value.trim();

      if (studentId) {
        payload.push({
          ID_Siswa: studentId,
          NIS: nis,
          NISN: nisn,
          Nama_Siswa: nama,
          Kelas: activeClass,
          Tanggal: activeDate,
          Status_Absensi: status,
          Keterangan: note
        });
      }
    });

    const originalTopText = btnSaveTop ? btnSaveTop.innerHTML : '';
    const originalBottomText = btnSaveBottom ? btnSaveBottom.innerHTML : '';
    if (btnSaveTop) btnSaveTop.innerHTML = '⏳ Menyimpan &amp; Mengirim...';
    if (btnSaveBottom) btnSaveBottom.innerHTML = '⏳ Mengirim ke Database &amp; Google Sheets...';

    try {
      const res = await saveAttendanceBatch(user, payload);
      toast.success(`${res.message} Data langsung terkirim ke Google Sheets (Data_Absensi)!`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan absensi.');
    } finally {
      if (btnSaveTop) btnSaveTop.innerHTML = originalTopText;
      if (btnSaveBottom) btnSaveBottom.innerHTML = originalBottomText;
    }
  };

  if (btnLoad) btnLoad.onclick = loadData;
  if (btnSaveTop) btnSaveTop.onclick = saveAttendance;
  if (btnSaveBottom) btnSaveBottom.onclick = saveAttendance;

  if (btnSetAll) {
    btnSetAll.onclick = () => {
      document.querySelectorAll('#daily-attendance-tbody tr').forEach(tr => {
        tr.querySelector('.hidden-status-input').value = 'Hadir';
        const buttons = tr.querySelectorAll('.btn-stat-opt');
        buttons.forEach(b => {
          if (b.getAttribute('data-status') === 'Hadir') {
            b.style.background = '#10b981';
            b.style.color = '#fff';
          } else {
            b.style.background = '#ffffff';
            b.style.color = '#475569';
          }
        });
      });
      updateStats();
      toast.info("Seluruh siswa diatur menjadi 'Hadir'. Klik Simpan untuk memperbarui.");
    };
  }

  loadData();
}
