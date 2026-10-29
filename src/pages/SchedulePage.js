/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * JADWAL PELAJARAN (src/pages/SchedulePage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin } from '../permissions.js';
import { getSchedules, saveSchedule } from '../services.js';
import { toast } from '../components/Toast.js';
import { triggerPrintReport } from '../components/ReportPrint.js';

export async function renderSchedulePage() {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const defaultClass = userIsAdmin ? 'kelas_1' : user.kelas_id;

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">⏱️ Jadwal Pelajaran Sekolah</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Jadwal kegiatan belajar mengajar mingguan untuk Kelas 1 dan Kelas 6.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-print-schedule">
              🖨️ Cetak Jadwal
            </button>
            ${userIsAdmin ? `
              <button class="btn btn-primary btn-sm" id="btn-open-add-schedule">
                ➕ Tambah Jadwal
              </button>
            ` : ''}
          </div>
        </div>

        <div style="display: flex; gap: 1rem; align-items: flex-end;" class="no-print">
          <div style="width: 220px;">
            <label class="form-label">Pilih Kelas</label>
            <select id="select-schedule-class" class="form-select" ${!userIsAdmin ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table" id="table-schedule">
            <thead>
              <tr>
                <th style="width: 100px;">Hari</th>
                <th style="width: 130px;">Jam</th>
                <th>Mata Pelajaran</th>
                <th>Guru Pengampu</th>
                <th>Keterangan / Ruang</th>
              </tr>
            </thead>
            <tbody id="schedule-table-body">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Jadwal (Admin) -->
    <div id="schedule-modal-slot"></div>
  `;
}

export function attachScheduleEvents() {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const selectClass = document.getElementById('select-schedule-class');
  const btnPrint = document.getElementById('btn-print-schedule');
  const btnOpenAdd = document.getElementById('btn-open-add-schedule');

  let activeClass = userIsAdmin ? selectClass.value : user.kelas_id;
  let schedules = [];

  const loadData = async () => {
    activeClass = userIsAdmin ? selectClass.value : user.kelas_id;
    schedules = await getSchedules(activeClass);
    renderTable();
  };

  const renderTable = () => {
    const tbody = document.getElementById('schedule-table-body');
    if (!tbody) return;

    if (schedules.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            Belum ada jadwal yang dimasukkan untuk kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = schedules.map(s => `
      <tr>
        <td><strong>${s.hari}</strong></td>
        <td><span class="badge badge-info">${s.jam_mulai} - ${s.jam_selesai}</span></td>
        <td><strong style="color: #1e3a8a;">${s.mata_pelajaran}</strong></td>
        <td>${s.nama_guru}</td>
        <td style="color: #64748b;">${s.keterangan || '-'}</td>
      </tr>
    `).join('');
  };

  if (selectClass) selectClass.onchange = loadData;

  // Print
  if (btnPrint) {
    btnPrint.onclick = async () => {
      const classLabel = activeClass === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';
      const rowsHtml = schedules.map(s => `
        <tr>
          <td><strong>${s.hari}</strong></td>
          <td>${s.jam_mulai} - ${s.jam_selesai}</td>
          <td>${s.mata_pelajaran}</td>
          <td>${s.nama_guru}</td>
          <td>${s.keterangan || '-'}</td>
        </tr>
      `).join('');

      const content = `
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Hari</th>
              <th>Jam</th>
              <th>Mata Pelajaran</th>
              <th>Guru Pengampu</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      await triggerPrintReport("Jadwal Pelajaran Mingguan", classLabel, content);
    };
  }

  // Admin Add Schedule
  if (btnOpenAdd) {
    btnOpenAdd.onclick = () => {
      const slot = document.getElementById('schedule-modal-slot');
      slot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 480px;">
            <div class="modal-header">
              <h3 class="card-title" style="margin: 0;">➕ Tambah Jadwal Pelajaran</h3>
              <button class="btn btn-outline btn-sm" id="btn-close-sch-modal">✕</button>
            </div>
            <form id="form-save-sch" onsubmit="return false;">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Hari *</label>
                  <select id="sch-hari" class="form-select">
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Jam Mulai *</label>
                    <input type="time" id="sch-mulai" class="form-input" required value="07:30">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Jam Selesai *</label>
                    <input type="time" id="sch-selesai" class="form-input" required value="09:00">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Mata Pelajaran *</label>
                  <input type="text" id="sch-mapel" class="form-input" required placeholder="Contoh: Matematika">
                </div>

                <div class="form-group">
                  <label class="form-label">Nama Guru Pengampu *</label>
                  <input type="text" id="sch-guru" class="form-input" required placeholder="Nama guru">
                </div>

                <div class="form-group">
                  <label class="form-label">Keterangan / Ruang</label>
                  <input type="text" id="sch-ket" class="form-input" placeholder="Contoh: Ruang Kelas 1A">
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-sch">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Jadwal →</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => { slot.innerHTML = ''; };
      document.getElementById('btn-close-sch-modal').onclick = closeModal;
      document.getElementById('btn-cancel-sch').onclick = closeModal;

      document.getElementById('form-save-sch').onsubmit = async () => {
        const payload = {
          kelas_id: activeClass,
          hari: document.getElementById('sch-hari').value,
          jam_mulai: document.getElementById('sch-mulai').value,
          jam_selesai: document.getElementById('sch-selesai').value,
          mata_pelajaran: document.getElementById('sch-mapel').value.trim(),
          nama_guru: document.getElementById('sch-guru').value.trim(),
          keterangan: document.getElementById('sch-ket').value.trim()
        };

        await saveSchedule(user, payload);
        toast.success("Jadwal pelajaran berhasil disimpan!");
        closeModal();
        loadData();
      };
    };
  }

  loadData();
}
