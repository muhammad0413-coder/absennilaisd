/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * MODAL EDIT PROFIL GURU, ADMIN & KEPSEK (src/components/ProfileModal.js)
 * ==============================================================================
 * Fitur:
 * 1. Upload Foto Profil langsung dari komputer/HP dengan kompresi otomatis Canvas (~15KB)
 * 2. Preview foto seketika sebelum disimpan
 * 3. Pilih akun/wali kelas mana pun yang ingin diedit fotonya secara mandiri (tidak ganda)
 * 4. Edit Nama, Email, NIP, Nomor HP, dan Penugasan Kelas
 * 5. Sinkronisasi tersimpan untuk masing-masing kelas tanpa menimpa kelas lainnya
 * ==============================================================================
 */

import { getCurrentUser, updateCurrentUserProfile, safeLocalStorageSet } from '../auth.js';
import { getUsers } from '../services.js';
import { toast } from './Toast.js';

export async function openProfileModal() {
  const user = getCurrentUser();
  if (!user) {
    toast.warning("Silakan login terlebih dahulu.");
    return;
  }

  const users = await getUsers();

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
      <div class="modal-content" style="background: white; border-radius: 16px; max-width: 520px; width: 100%; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); max-height: 92vh; overflow-y: auto;">
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.4rem;">👤</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;">Pengaturan Profil &amp; Foto Wali Kelas</h3>
              <span style="font-size: 0.75rem; color: #64748b;">Ganti foto atau data akun masing-masing kelas secara mandiri (tidak ganda)</span>
            </div>
          </div>
          <button id="btn-close-profile-modal" style="background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <form id="form-edit-teacher-profile" onsubmit="return false;">
          <!-- PILIHAN AKUN / WALI KELAS YANG INGIN DIEDIT -->
          <div class="form-group" style="margin-bottom: 1.25rem; background: #eff6ff; padding: 0.85rem 1rem; border-radius: 12px; border: 1.5px solid #93c5fd;">
            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.35rem;">
              👥 Pilih Profil / Wali Kelas yang Ingin Diedit:
            </label>
            <select id="prof-target-email" class="form-select" style="width: 100%; font-weight: 700; border-color: #3b82f6;">
              ${users.map(u => {
                const isCurrent = (u.Email || '').toLowerCase() === (user.email || '').toLowerCase();
                const roleDesc = u.Role === 'admin' 
                  ? `Administrator (${u.Nama})` 
                  : (u.Role === 'kepala_sekolah' 
                    ? `Kepala Sekolah (${u.Nama})` 
                    : `Wali Kelas ${u.Kelas_Ditugaskan.replace('kelas_', '')} (${u.Nama})`);
                return `<option value="${u.Email}" ${isCurrent ? 'selected' : ''}>${roleDesc}</option>`;
              }).join('')}
            </select>
            <span style="font-size: 0.72rem; color: #475569; display: block; margin-top: 4px;">
              Pilih kelas di atas untuk mengganti foto atau identitas wali kelas tersebut tanpa mempengaruhi kelas lain.
            </span>
          </div>

          <!-- UPLOAD FOTO PROFIL LANGSUNG -->
          <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.25rem; background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="position: relative; width: 75px; height: 75px; flex-shrink: 0;">
              <img id="prof-photo-preview" src="${currentPhoto}" alt="Foto Profil" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #1e3a8a; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" onerror="this.src='https://ui-avatars.com/api/?name=User&background=1e3a8a&color=fff&size=200'">
            </div>

            <div style="flex: 1;">
              <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.35rem;">
                Foto Profil Wali Kelas / Akun
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
                Mendukung JPG, PNG, atau WEBP. Foto otomatis dikompresi agar hemat kuota.
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
            <input type="text" id="prof-name" class="form-input" required placeholder="Contoh: Suci Ayu Ningrum, S.Pd." value="${user.displayName || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>

          <!-- Alamat Email Akun -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Alamat Email Akun *
            </label>
            <input type="email" id="prof-email" class="form-input" required placeholder="guru1@sekolah.id" value="${user.email || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.72rem; color: #64748b; display: block; margin-top: 2px;">Email ini digunakan untuk masuk ke sistem tanpa password.</span>
          </div>

          <!-- NIP -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              NIP / NUPTK
            </label>
            <input type="text" id="prof-nip" class="form-input" placeholder="Contoh: 195701201992032001 (atau -)" value="${user.nip || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
            <span style="font-size: 0.72rem; color: #64748b; display: block; margin-top: 2px;">NIP otomatis tercantum pada lembar cetak laporan resmi.</span>
          </div>

          <!-- Penugasan Kelas -->
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
              Penugasan Kelas
            </label>
            <select id="prof-class" class="form-select" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px;">
              <option value="kelas_1" ${user.kelas_id === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Wali Kelas 1)</option>
              <option value="kelas_2" ${user.kelas_id === 'kelas_2' ? 'selected' : ''}>Kelas 2 (Wali Kelas 2)</option>
              <option value="kelas_3" ${user.kelas_id === 'kelas_3' ? 'selected' : ''}>Kelas 3 (Wali Kelas 3)</option>
              <option value="kelas_4" ${user.kelas_id === 'kelas_4' ? 'selected' : ''}>Kelas 4 (Wali Kelas 4)</option>
              <option value="kelas_5" ${user.kelas_id === 'kelas_5' ? 'selected' : ''}>Kelas 5 (Wali Kelas 5)</option>
              <option value="kelas_6" ${user.kelas_id === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Wali Kelas 6)</option>
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

  // Helper Kompresi Gambar ke Canvas (~15KB - 25KB, tidak pernah melebihi kuota storage)
  const compressImage = (file, maxWidth = 260, maxHeight = 260, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Gagal membaca berkas gambar."));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Gagal mengurai gambar."));
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxWidth) {
              h = Math.round((h * maxWidth) / w);
              w = maxWidth;
            }
          } else {
            if (h > maxHeight) {
              w = Math.round((w * maxHeight) / h);
              h = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Switch Akun / Wali Kelas
  const selectTarget = document.getElementById('prof-target-email');
  const photoInput = document.getElementById('prof-photo-file');
  const photoPreview = document.getElementById('prof-photo-preview');
  const photoData = document.getElementById('prof-photo-data');
  const btnResetPhoto = document.getElementById('btn-reset-photo');

  if (selectTarget) {
    selectTarget.onchange = () => {
      const selectedEmail = selectTarget.value;
      const targetUser = users.find(u => (u.Email || '').toLowerCase() === selectedEmail.toLowerCase());
      if (targetUser) {
        document.getElementById('prof-name').value = targetUser.Nama || '';
        document.getElementById('prof-email').value = targetUser.Email || '';
        document.getElementById('prof-nip').value = targetUser.NIP || '';
        document.getElementById('prof-class').value = targetUser.Kelas_Ditugaskan || 'semua';
        document.getElementById('prof-phone').value = targetUser.Phone || '';
        const targetPhoto = targetUser.Foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.Nama || 'User')}&background=1e3a8a&color=fff&size=200`;
        if (photoPreview) photoPreview.src = targetPhoto;
        if (photoData) photoData.value = targetPhoto;
      }
    };
  }

  if (photoInput) {
    photoInput.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.warning("Berkas yang dipilih harus berupa gambar (JPG, PNG, WEBP).");
        return;
      }

      try {
        toast.info("Mengompresi dan menyiapkan foto profil...");
        const compressedBase64 = await compressImage(file, 260, 260, 0.82);
        if (photoPreview) photoPreview.src = compressedBase64;
        if (photoData) photoData.value = compressedBase64;
        toast.success("Foto profil siap disimpan! Klik 'Simpan Profil & Foto'.");
      } catch (err) {
        toast.error("Gagal memproses gambar: " + err.message);
      }
    };
  }

  if (btnResetPhoto) {
    btnResetPhoto.onclick = () => {
      const nameVal = document.getElementById('prof-name').value.trim() || 'User';
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameVal)}&background=1e3a8a&color=fff&size=200`;
      if (photoPreview) photoPreview.src = defaultAvatar;
      if (photoData) photoData.value = defaultAvatar;
      if (photoInput) photoInput.value = '';
      toast.info("Foto profil direset ke avatar standar.");
    };
  }

  // Submit Handler
  const form = document.getElementById('form-edit-teacher-profile');
  const btnSave = document.getElementById('btn-save-profile');

  if (form) {
    form.onsubmit = async () => {
      const selectedEmail = selectTarget ? selectTarget.value.trim().toLowerCase() : (user.email || '').toLowerCase();
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

      if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerHTML = "⏳ Menyimpan Profil...";
      }

      try {
        const targetIdx = users.findIndex(u => (u.Email || '').toLowerCase() === selectedEmail);
        if (targetIdx >= 0) {
          users[targetIdx] = {
            ...users[targetIdx],
            Nama: nameVal,
            Email: emailVal,
            NIP: nipVal,
            Kelas_Ditugaskan: classVal,
            Phone: phoneVal,
            Foto: photoVal,
            Updated_At: new Date().toISOString()
          };
          safeLocalStorageSet('sd_users_accounts', JSON.stringify(users));
        }

        // Jika akun yang diedit adalah akun sesi aktif
        if (selectedEmail === (user.email || '').toLowerCase()) {
          await updateCurrentUserProfile({
            displayName: nameVal,
            email: emailVal,
            nip: nipVal,
            phone: phoneVal,
            foto: photoVal,
            Foto: photoVal,
            kelas_id: classVal
          });
        }

        toast.success(`Profil & foto untuk ${nameVal} berhasil disimpan secara mandiri!`);
        closeModal();
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (err) {
        toast.error(err.message || "Gagal menyimpan profil.");
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.innerHTML = "💾 Simpan Profil &amp; Foto";
        }
      }
    };
  }
}
