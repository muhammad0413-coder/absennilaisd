/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * MODAL EDIT PROFIL GURU & STAF (src/components/ProfileModal.js)
 * ==============================================================================
 */

import { getCurrentUser, updateCurrentUserProfile } from '../auth.js';
import { toast } from './Toast.js';

export function openProfileModal() {
  const user = getCurrentUser();
  if (!user) {
    toast.warning("Silakan login terlebih dahulu.");
    return;
  }

  let slot = document.getElementById('global-profile-modal-slot');
  if (!slot) {
    slot = document.createElement('div');
    slot.id = 'global-profile-modal-slot';
    document.body.appendChild(slot);
  }

  slot.innerHTML = `
    <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div class="modal-content" style="background: white; border-radius: 16px; max-width: 480px; width: 100%; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.4rem;">👨‍🏫</span>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;">Edit Profil Guru &amp; Staf</h3>
          </div>
          <button id="btn-close-profile-modal" style="background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <form id="form-edit-teacher-profile" onsubmit="return false;">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Nama Lengkap &amp; Gelar *
            </label>
            <input type="text" id="prof-name" class="form-input" required placeholder="Contoh: Siti Rahmawati, S.Pd." value="${user.displayName || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Alamat Email Akun (Bisa Diedit) *
            </label>
            <input type="email" id="prof-email" class="form-input" required placeholder="guru5@sekolah.id" value="${user.email || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 2px;">Email ini digunakan untuk masuk langsung ke dashboard Anda.</span>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              NIP / NUPTK
            </label>
            <input type="text" id="prof-nip" class="form-input" placeholder="Contoh: 198503152010012001 (atau -)" value="${user.nip || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 2px;">NIP otomatis tercetak pada lembar rekap absen dan nilai kelas.</span>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Penugasan Kelas
            </label>
            <select id="prof-class" class="form-select" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
              <option value="kelas_1" ${user.kelas_id === 'kelas_1' ? 'selected' : ''}>Kelas 1</option>
              <option value="kelas_2" ${user.kelas_id === 'kelas_2' ? 'selected' : ''}>Kelas 2</option>
              <option value="kelas_3" ${user.kelas_id === 'kelas_3' ? 'selected' : ''}>Kelas 3</option>
              <option value="kelas_4" ${user.kelas_id === 'kelas_4' ? 'selected' : ''}>Kelas 4</option>
              <option value="kelas_5" ${user.kelas_id === 'kelas_5' ? 'selected' : ''}>Kelas 5</option>
              <option value="kelas_6" ${user.kelas_id === 'kelas_6' ? 'selected' : ''}>Kelas 6</option>
              <option value="semua" ${user.kelas_id === 'semua' ? 'selected' : ''}>Semua Kelas (Admin / Kepala Sekolah)</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Foto Profil Guru (Tautan / URL Gambar)
            </label>
            <input type="text" id="prof-photo" class="form-input" placeholder="Contoh: https://... (atau kosongkan untuk foto standar)" value="${user.Foto || user.foto || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 2px;">Foto ini akan muncul di kartu kelas Anda pada Portal Siswa.</span>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Nomor WhatsApp / HP
            </label>
            <input type="text" id="prof-phone" class="form-input" placeholder="Contoh: 081234567890" value="${user.phone || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
            <button type="button" class="btn btn-outline" id="btn-cancel-profile">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-save-profile">💾 Simpan Perubahan Profil</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { slot.innerHTML = ''; };
  document.getElementById('btn-close-profile-modal').onclick = closeModal;
  document.getElementById('btn-cancel-profile').onclick = closeModal;

  document.getElementById('form-edit-teacher-profile').onsubmit = async () => {
    const nameVal = document.getElementById('prof-name').value.trim();
    const emailVal = document.getElementById('prof-email').value.trim();
    const nipVal = document.getElementById('prof-nip').value.trim();
    const classVal = document.getElementById('prof-class').value;
    const phoneVal = document.getElementById('prof-phone').value.trim();
    const photoVal = document.getElementById('prof-photo').value.trim();

    if (!nameVal || !emailVal) {
      toast.warning("Nama dan email wajib diisi.");
      return;
    }

    try {
      await updateCurrentUserProfile({
        displayName: nameVal,
        email: emailVal,
        nip: nipVal,
        phone: phoneVal,
        foto: photoVal,
        kelas_id: classVal
      });
      toast.success("Profil Anda berhasil diperbarui!");
      closeModal();
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan profil.");
    }
  };
}
