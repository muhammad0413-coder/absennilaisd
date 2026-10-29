/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * MODAL EDIT PROFIL GURU, ADMIN & KEPSEK (src/components/ProfileModal.js)
 * ==============================================================================
 * Fitur:
 * 1. Upload Foto Profil langsung dari komputer/HP (Base64 Data URL)
 * 2. Preview foto seketika sebelum disimpan
 * 3. Edit Nama, Email, NIP, Nomor HP, dan Penugasan Kelas
 * 4. Sinkronisasi otomatis ke profil aktif dan master akun pengguna
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

  const currentPhoto = user.Foto || user.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1e3a8a&color=fff&size=200`;
  const roleLabel = (user.role || 'guru').toUpperCase();

  slot.innerHTML = `
    <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;">
      <div class="modal-content" style="background: white; border-radius: 16px; max-width: 500px; width: 100%; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); max-height: 92vh; overflow-y: auto;">
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.4rem;">👤</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;">Edit Profil ${roleLabel}</h3>
              <span style="font-size: 0.75rem; color: #64748b;">Pengaturan data akun &amp; foto profil resmi</span>
            </div>
          </div>
          <button id="btn-close-profile-modal" style="background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <form id="form-edit-teacher-profile" onsubmit="return false;">
          <!-- UPLOAD FOTO PROFIL LANGSUNG -->
          <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="position: relative; width: 75px; height: 75px; flex-shrink: 0;">
              <img id="prof-photo-preview" src="${currentPhoto}" alt="Foto Profil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #1e3a8a; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" onerror="this.src='https://ui-avatars.com/api/?name=User&background=1e3a8a&color=fff&size=200'">
            </div>

            <div style="flex: 1;">
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.35rem;">
                Foto Profil Guru / Admin / Kepsek
              </label>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <label class="btn btn-primary btn-sm" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; font-weight: 700; padding: 0.4rem 0.75rem;">
                  📷 <span>Pilih &amp; Unggah Foto</span>
                  <input type="file" id="prof-photo-file" accept="image/*" style="display: none;">
                </label>
                <button type="button" class="btn btn-outline btn-sm" id="btn-reset-photo" style="font-size: 0.75rem;">
                  Reset
                </button>
              </div>
              <span style="font-size: 0.72rem; color: #64748b; display: block; margin-top: 4px;">
                Mendukung file JPG, PNG, atau WEBP (Maksimal 2MB).
              </span>
            </div>
          </div>

          <!-- URL / Base64 Hidden Input -->
          <input type="hidden" id="prof-photo-data" value="${currentPhoto}">

          <!-- Nama Lengkap & Gelar -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Nama Lengkap &amp; Gelar Resmi *
            </label>
            <input type="text" id="prof-name" class="form-input" required placeholder="Contoh: Dra. Ratna Suminar" value="${user.displayName || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>

          <!-- Alamat Email Akun -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Alamat Email Akun (Bisa Diedit Bebas) *
            </label>
            <input type="email" id="prof-email" class="form-input" required placeholder="guru5@sekolah.id" value="${user.email || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.72rem; color: #64748b; display: block; margin-top: 2px;">Email ini digunakan untuk masuk ke sistem tanpa password.</span>
          </div>

          <!-- NIP -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              NIP / NUPTK
            </label>
            <input type="text" id="prof-nip" class="form-input" placeholder="Contoh: 195701201992032001 (atau -)" value="${user.nip || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.72rem; color: #64748b; display: block; margin-top: 2px;">NIP otomatis tercantum pada lembar rekap absen dan nilai resmi.</span>
          </div>

          <!-- Penugasan Kelas -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Penugasan Kelas
            </label>
            <select id="prof-class" class="form-select" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
              <option value="kelas_1" ${user.kelas_id === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_2" ${user.kelas_id === 'kelas_2' ? 'selected' : ''}>Kelas 2 (Fase A)</option>
              <option value="kelas_3" ${user.kelas_id === 'kelas_3' ? 'selected' : ''}>Kelas 3 (Fase B)</option>
              <option value="kelas_4" ${user.kelas_id === 'kelas_4' ? 'selected' : ''}>Kelas 4 (Fase B)</option>
              <option value="kelas_5" ${user.kelas_id === 'kelas_5' ? 'selected' : ''}>Kelas 5 (Fase C)</option>
              <option value="kelas_6" ${user.kelas_id === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
              <option value="semua" ${user.kelas_id === 'semua' || !user.kelas_id ? 'selected' : ''}>Semua Kelas (Kepala Sekolah / Admin)</option>
            </select>
          </div>

          <!-- Nomor WhatsApp / HP -->
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Nomor WhatsApp / HP
            </label>
            <input type="text" id="prof-phone" class="form-input" placeholder="Contoh: 081234567890" value="${user.phone || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
            <button type="button" class="btn btn-outline" id="btn-cancel-profile">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-save-profile" style="font-weight: 700;">💾 Simpan Profil &amp; Foto</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const closeModal = () => { slot.innerHTML = ''; };
  document.getElementById('btn-close-profile-modal').onclick = closeModal;
  document.getElementById('btn-cancel-profile').onclick = closeModal;

  // File Upload Listener & Instant Preview
  const photoInput = document.getElementById('prof-photo-file');
  const photoPreview = document.getElementById('prof-photo-preview');
  const photoData = document.getElementById('prof-photo-data');
  const btnResetPhoto = document.getElementById('btn-reset-photo');

  if (photoInput) {
    photoInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.warning("Berkas yang dipilih harus berupa gambar (JPG, PNG, WEBP).");
        return;
      }

      if (file.size > 3 * 1024 * 1024) {
        toast.warning("Ukuran foto maksimal 3MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target.result;
        if (photoPreview) photoPreview.src = base64Url;
        if (photoData) photoData.value = base64Url;
        toast.info("Foto profil berhasil dimuat. Klik 'Simpan Profil' untuk menerapkan.");
      };
      reader.readAsDataURL(file);
    };
  }

  if (btnResetPhoto) {
    btnResetPhoto.onclick = () => {
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=1e3a8a&color=fff&size=200`;
      if (photoPreview) photoPreview.src = defaultAvatar;
      if (photoData) photoData.value = defaultAvatar;
      if (photoInput) photoInput.value = '';
      toast.info("Foto profil direset ke avatar standar.");
    };
  }

  // Submit Handler
  document.getElementById('form-edit-teacher-profile').onsubmit = async () => {
    const nameVal = document.getElementById('prof-name').value.trim();
    const emailVal = document.getElementById('prof-email').value.trim();
    const nipVal = document.getElementById('prof-nip').value.trim();
    const classVal = document.getElementById('prof-class').value;
    const phoneVal = document.getElementById('prof-phone').value.trim();
    const photoVal = (photoData ? photoData.value.trim() : '') || currentPhoto;

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
        Foto: photoVal,
        kelas_id: classVal
      });
      toast.success("Profil dan foto Anda berhasil diperbarui!");
      closeModal();
      window.location.reload();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan profil.");
    }
  };
}
