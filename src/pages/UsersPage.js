/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PENGGUNA DAN HAK AKSES (src/pages/UsersPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { getUsers, saveUser } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderUsersPage() {
  const users = await getUsers();

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">🔐 Pengguna dan Hak Akses Sistem</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Pengelolaan akun Administrator, Kepala Sekolah, dan Guru Kelas (Kelas 1–6).
            </p>
          </div>

          <button class="btn btn-primary btn-sm" id="btn-open-add-user">
            ➕ Tambah Pengguna Baru
          </button>
        </div>

        <div style="padding: 0.75rem 1rem; border-radius: 8px; background: #fef2f2; border: 1px solid #fee2e2; font-size: 0.82rem; color: #991b1b;">
          🔒 <strong>Standar Keamanan:</strong> Kata sandi dikelola secara terenkripsi melalui Firebase Authentication dan tidak pernah disimpan dalam bentuk teks biasa di Google Sheets atau log aktivitas.
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table" id="table-users-list">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>Nama Lengkap</th>
                <th>Email Akun</th>
                <th>Peran (Role)</th>
                <th>Penugasan Kelas</th>
                <th>Status</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${users.map((u, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${u.Nama}</strong></td>
                  <td><code>${u.Email}</code></td>
                  <td>
                    <span class="badge ${u.Role === 'admin' ? 'badge-danger' : (u.Role === 'kepala_sekolah' ? 'badge-warning' : 'badge-info')}">
                      ${u.Role === 'admin' ? 'Administrator' : (u.Role === 'kepala_sekolah' ? 'Kepala Sekolah' : 'Guru Kelas')}
                    </span>
                  </td>
                  <td><span class="badge badge-neutral">${u.Kelas_Ditugaskan === 'semua' ? 'Semua Kelas (1–6)' : u.Kelas_Ditugaskan.replace('_', ' ').toUpperCase()}</span></td>
                  <td>
                    <span class="badge ${u.Status === 'Aktif' ? 'badge-success' : 'badge-danger'}">
                      ${u.Status}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <button class="btn btn-outline btn-sm btn-edit-user" data-id="${u.User_ID}" data-email="${u.Email}">
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Tambah / Edit Pengguna -->
    <div id="user-modal-slot"></div>
  `;
}

export function attachUsersEvents() {
  const adminUser = getCurrentUser();
  const btnOpenAdd = document.getElementById('btn-open-add-user');

  if (btnOpenAdd) {
    btnOpenAdd.onclick = () => showUserModal(null);
  }

  document.querySelectorAll('.btn-edit-user').forEach(btn => {
    btn.onclick = async () => {
      const email = btn.getAttribute('data-email');
      const users = await getUsers();
      const u = users.find(usr => usr.Email === email);
      if (u) showUserModal(u);
    };
  });

  function showUserModal(userToEdit = null) {
    const slot = document.getElementById('user-modal-slot');
    const isEdit = Boolean(userToEdit);

    slot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header">
            <h3 class="card-title" style="margin: 0;">
              ${isEdit ? '✏️ Edit Pengguna' : '➕ Tambah Pengguna Baru'}
            </h3>
            <button class="btn btn-outline btn-sm" id="btn-close-u-modal">✕</button>
          </div>
          <form id="form-save-user" onsubmit="return false;">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nama Lengkap &amp; Gelar *</label>
                <input type="text" id="u-name" class="form-input" required placeholder="Contoh: Siti Rahmawati, S.Pd." value="${userToEdit ? userToEdit.Nama : ''}">
              </div>

              <div class="form-group">
                <label class="form-label">Email Akun (Login) *</label>
                <input type="email" id="u-email" class="form-input" required placeholder="nama@sekolah.id" value="${userToEdit ? userToEdit.Email : ''}">
                <span class="form-hint">Email akun dapat diubah sewaktu-waktu sesuai penugasan guru.</span>
              </div>

              <div class="form-group">
                <label class="form-label">NIP / NUPTK</label>
                <input type="text" id="u-nip" class="form-input" placeholder="Contoh: 198503152010012001 (atau -)" value="${userToEdit ? (userToEdit.NIP || '') : ''}">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Peran (Role) *</label>
                  <select id="u-role" class="form-select">
                    <option value="guru" ${userToEdit && userToEdit.Role === 'guru' ? 'selected' : ''}>Guru Kelas</option>
                    <option value="kepala_sekolah" ${userToEdit && userToEdit.Role === 'kepala_sekolah' ? 'selected' : ''}>Kepala Sekolah</option>
                    <option value="admin" ${userToEdit && userToEdit.Role === 'admin' ? 'selected' : ''}>Administrator</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Penugasan Kelas</label>
                  <select id="u-class" class="form-select">
                    <option value="kelas_1" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'kelas_1' ? 'selected' : ''}>Kelas 1</option>
                    <option value="kelas_2" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'kelas_2' ? 'selected' : ''}>Kelas 2</option>
                    <option value="kelas_3" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'kelas_3' ? 'selected' : ''}>Kelas 3</option>
                    <option value="kelas_4" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'kelas_4' ? 'selected' : ''}>Kelas 4</option>
                    <option value="kelas_5" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'kelas_5' ? 'selected' : ''}>Kelas 5</option>
                    <option value="kelas_6" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'kelas_6' ? 'selected' : ''}>Kelas 6</option>
                    <option value="semua" ${userToEdit && userToEdit.Kelas_Ditugaskan === 'semua' ? 'selected' : ''}>Semua Kelas (Admin/Kepsek)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="btn-cancel-u">Batal</button>
              <button type="submit" class="btn btn-primary">${isEdit ? 'Simpan Perubahan' : 'Daftarkan Akun →'}</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { slot.innerHTML = ''; };
    document.getElementById('btn-close-u-modal').onclick = closeModal;
    document.getElementById('btn-cancel-u').onclick = closeModal;

    document.getElementById('form-save-user').onsubmit = async () => {
      const payload = {
        User_ID: userToEdit ? userToEdit.User_ID : null,
        Nama: document.getElementById('u-name').value.trim(),
        Email: document.getElementById('u-email').value.trim().toLowerCase(),
        NIP: document.getElementById('u-nip').value.trim(),
        Role: document.getElementById('u-role').value,
        Kelas_Ditugaskan: document.getElementById('u-class').value,
        Status: "Aktif"
      };

      const res = await saveUser(adminUser, payload);
      toast.success(res.message);
      closeModal();
      window.location.reload();
    };
  }
}
