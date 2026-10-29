/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * PENGUMUMAN SEKOLAH & KELAS (src/pages/AnnouncementsPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin } from '../permissions.js';
import { getAnnouncements, saveAnnouncement } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderAnnouncementsPage() {
  const user = getCurrentUser();

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📢 Pengumuman Sekolah & Kelas</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Publikasikan informasi penting untuk seluruh sekolah, Kelas 1, atau Kelas 6.
            </p>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-open-add-announcement">
            ➕ Buat Pengumuman Baru
          </button>
        </div>

        <div style="display: flex; gap: 1rem;">
          <div style="width: 220px;">
            <label class="form-label">Target Kelas</label>
            <select id="select-ann-target" class="form-select">
              <option value="semua">Semua Sasaran</option>
              <option value="kelas_1">Khusus Kelas 1</option>
              <option value="kelas_6">Khusus Kelas 6</option>
            </select>
          </div>
        </div>
      </div>

      <div id="announcements-list-container" style="display: flex; flex-direction: column; gap: 1rem;">
        <!-- Rendered via JS -->
      </div>
    </div>

    <!-- Modal Buat Pengumuman -->
    <div id="announcement-modal-slot"></div>
  `;
}

export function attachAnnouncementsEvents() {
  const user = getCurrentUser();
  const selectTarget = document.getElementById('select-ann-target');
  const btnOpenAdd = document.getElementById('btn-open-add-announcement');

  let announcements = [];

  const loadData = async () => {
    const target = selectTarget.value;
    announcements = await getAnnouncements(target);
    renderList();
  };

  const renderList = () => {
    const container = document.getElementById('announcements-list-container');
    if (!container) return;

    if (announcements.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem; color: #64748b;">
          Belum ada pengumuman untuk target ini.
        </div>
      `;
      return;
    }

    container.innerHTML = announcements.map(a => `
      <div class="card" style="margin-bottom: 0; border-left: 5px solid ${a.target_kelas === 'semua' ? '#1e3a8a' : (a.target_kelas === 'kelas_1' ? '#0284c7' : '#f59e0b')};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <span class="badge ${a.target_kelas === 'semua' ? 'badge-primary' : (a.target_kelas === 'kelas_1' ? 'badge-info' : 'badge-warning')}" style="margin-bottom: 0.35rem;">
              Target: ${a.target_kelas === 'semua' ? 'Seluruh Siswa (K1 & K6)' : (a.target_kelas === 'kelas_1' ? 'Kelas 1' : 'Kelas 6')}
            </span>
            <h3 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0;">${a.judul}</h3>
          </div>
          <span style="font-size: 0.8rem; color: #64748b;">📅 ${a.tanggal_publikasi}</span>
        </div>
        <p style="font-size: 0.9rem; color: #334155; line-height: 1.5; margin: 0;">${a.isi}</p>
      </div>
    `).join('');
  };

  if (selectTarget) selectTarget.onchange = loadData;

  if (btnOpenAdd) {
    btnOpenAdd.onclick = () => {
      const slot = document.getElementById('announcement-modal-slot');
      slot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 520px;">
            <div class="modal-header">
              <h3 class="card-title" style="margin: 0;">➕ Buat Pengumuman Baru</h3>
              <button class="btn btn-outline btn-sm" id="btn-close-ann-modal">✕</button>
            </div>
            <form id="form-save-ann" onsubmit="return false;">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Judul Pengumuman *</label>
                  <input type="text" id="ann-judul" class="form-input" required placeholder="Contoh: Jadwal Upacara Bendera">
                </div>

                <div class="form-group">
                  <label class="form-label">Target Pengumuman *</label>
                  <select id="ann-target-select" class="form-select">
                    <option value="semua">Semua Siswa (Kelas 1 & Kelas 6)</option>
                    <option value="kelas_1">Khusus Kelas 1</option>
                    <option value="kelas_6">Khusus Kelas 6</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tanggal Publikasi *</label>
                  <input type="date" id="ann-tanggal" class="form-input" required value="${new Date().toISOString().substring(0, 10)}">
                </div>

                <div class="form-group">
                  <label class="form-label">Isi Pengumuman *</label>
                  <textarea id="ann-isi" class="form-textarea" rows="4" required placeholder="Tuliskan isi pengumuman secara rinci..."></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-ann">Batal</button>
                <button type="submit" class="btn btn-primary">Publikasikan Pengumuman →</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const closeModal = () => { slot.innerHTML = ''; };
      document.getElementById('btn-close-ann-modal').onclick = closeModal;
      document.getElementById('btn-cancel-ann').onclick = closeModal;

      document.getElementById('form-save-ann').onsubmit = async () => {
        const payload = {
          judul: document.getElementById('ann-judul').value.trim(),
          target_kelas: document.getElementById('ann-target-select').value,
          tanggal_publikasi: document.getElementById('ann-tanggal').value,
          isi: document.getElementById('ann-isi').value.trim(),
          status_publikasi: 'dipublikasikan'
        };

        await saveAnnouncement(user, payload);
        toast.success("Pengumuman berhasil dipublikasikan!");
        closeModal();
        loadData();
      };
    };
  }

  loadData();
}
