/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * HALAMAN PROFIL GURU & GANTI FOTO GOOGLE DRIVE (src/pages/TeacherProfile.js)
 * ==============================================================================
 */

import { getCurrentUser, changePassword } from '../auth.js';
import { getTeacherProfile, updateTeacherProfile, uploadTeacherPhoto } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderTeacherProfile() {
  const user = getCurrentUser();
  const classLabel = user.kelas_id === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';

  const teacher = await getTeacherProfile(user.teacher_id) || {
    nama_guru: user.displayName,
    nip: "198504122010012015",
    nomor_telepon: "081234567891",
    email: user.email,
    foto_url: "",
    status_aktif: "aktif"
  };

  return `
    <div class="page-content">
      <div style="max-width: 800px; margin: 0 auto;">
        <!-- Header Profil -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div class="card-header">
            <h2 class="card-title">👤 Profil Saya & Foto</h2>
            <span class="badge badge-success">Akun Aktif</span>
          </div>

          <div style="display: grid; grid-template-columns: 240px 1fr; gap: 2rem; align-items: start; @media(max-width: 640px){grid-template-columns: 1fr;}">
            <!-- Kolom Foto Profil & Upload Google Drive -->
            <div style="text-align: center; border-right: 1px solid #e2e8f0; padding-right: 1.5rem; @media(max-width: 640px){border-right: none; padding-right: 0;}">
              <div style="width: 160px; height: 160px; border-radius: 50%; overflow: hidden; margin: 0 auto 1rem; border: 4px solid #0284c7; background: #f1f5f9; position: relative;">
                <img id="img-profile-preview" src="${teacher.foto_url || ''}" alt="Foto Profil Guru" style="width: 100%; height: 100%; object-fit: cover; ${teacher.foto_url ? '' : 'display: none;'}">
                <div id="img-placeholder" style="width: 100%; height: 100%; display: ${teacher.foto_url ? 'none' : 'flex'}; align-items: center; justify-content: center; font-size: 4rem; color: #94a3b8;">
                  👩‍🏫
                </div>
              </div>

              <!-- Input File Tersembunyi -->
              <input type="file" id="input-photo-file" accept="image/jpeg,image/png,image/webp" style="display: none;">
              
              <button type="button" class="btn btn-outline btn-sm" id="btn-browse-photo" style="width: 100%; margin-bottom: 0.5rem;">
                📷 Pilih Foto Baru
              </button>
              
              <div id="photo-action-buttons" style="display: none; flex-direction: column; gap: 0.4rem;">
                <button type="button" class="btn btn-primary btn-sm" id="btn-save-photo">
                  ☁️ Simpan ke Google Drive
                </button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-cancel-photo">
                  Batal
                </button>
              </div>

              <p style="font-size: 0.72rem; color: #64748b; margin-top: 0.75rem;">
                Format: JPG, PNG, atau WebP.<br>Maksimal ukuran: 2 MB.
              </p>
            </div>

            <!-- Kolom Informasi Guru -->
            <div>
              <div class="form-group">
                <label class="form-label">Nama Lengkap Guru (Data Resmi)</label>
                <input type="text" class="form-input" value="${teacher.nama_guru}" disabled style="background: #f8fafc; font-weight: 600; color: #0f172a;">
                <span class="form-hint">Nama dan NIP resmi dikelola oleh Administrator.</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">NIP</label>
                  <input type="text" class="form-input" value="${teacher.nip || '-'}" disabled style="background: #f8fafc;">
                </div>
                <div class="form-group">
                  <label class="form-label">Penugasan Kelas</label>
                  <input type="text" class="form-input" value="${classLabel}" disabled style="background: #eff6ff; color: #1e3a8a; font-weight: 700;">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Email Akun (Login)</label>
                <input type="email" class="form-input" value="${user.email}" disabled style="background: #f8fafc;">
              </div>

              <!-- Form Ubah Nomor Telepon -->
              <form id="form-update-phone" onsubmit="return false;">
                <div class="form-group">
                  <label class="form-label">Nomor WhatsApp / Telepon *</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <input type="tel" id="input-teacher-phone" class="form-input" value="${teacher.nomor_telepon || ''}" required placeholder="08xxxxxxxxxx">
                    <button type="submit" class="btn btn-primary" id="btn-save-phone" style="flex-shrink: 0;">
                      Simpan Kontak
                    </button>
                  </div>
                  <span class="form-hint">Nomor ini dapat dilihat oleh siswa/wali kelas Anda.</span>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Kartu Ubah Kata Sandi (Firebase Authentication) -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🔐 Ganti Kata Sandi Akun</h3>
          </div>
          <form id="form-change-password" onsubmit="return false;">
            <div class="form-group">
              <label class="form-label">Kata Sandi Baru *</label>
              <input type="password" id="input-new-pass" class="form-input" required minlength="6" placeholder="Minimal 6 karakter" autocomplete="new-password">
            </div>
            <div class="form-group">
              <label class="form-label">Konfirmasi Kata Sandi Baru *</label>
              <input type="password" id="input-confirm-pass" class="form-input" required minlength="6" placeholder="Ulangi kata sandi baru" autocomplete="new-password">
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary" id="btn-submit-change-pass">
                Perbarui Kata Sandi →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function attachTeacherProfileEvents() {
  const user = getCurrentUser();

  // Photo Upload Handling
  const btnBrowse = document.getElementById('btn-browse-photo');
  const inputFile = document.getElementById('input-photo-file');
  const imgPreview = document.getElementById('img-profile-preview');
  const imgPlaceholder = document.getElementById('img-placeholder');
  const photoActionButtons = document.getElementById('photo-action-buttons');
  const btnSavePhoto = document.getElementById('btn-save-photo');
  const btnCancelPhoto = document.getElementById('btn-cancel-photo');

  let selectedFileBase64 = null;
  let selectedFileMime = null;
  const originalSrc = imgPreview.src;

  if (btnBrowse && inputFile) {
    btnBrowse.onclick = () => inputFile.click();

    inputFile.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validasi MIME
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Format gambar tidak didukung! Gunakan JPG, PNG, atau WebP.");
        return;
      }

      // Validasi Ukuran (Max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran foto melebihi 2MB! Silakan kompres gambar terlebih dahulu.");
        return;
      }

      selectedFileMime = file.type;
      const reader = new FileReader();
      reader.onload = (event) => {
        selectedFileBase64 = event.target.result;
        imgPreview.src = selectedFileBase64;
        imgPreview.style.display = 'block';
        imgPlaceholder.style.display = 'none';
        photoActionButtons.style.display = 'flex';
        btnBrowse.style.display = 'none';
      };
      reader.readAsDataURL(file);
    };

    btnCancelPhoto.onclick = () => {
      selectedFileBase64 = null;
      selectedFileMime = null;
      imgPreview.src = originalSrc;
      if (!originalSrc) {
        imgPreview.style.display = 'none';
        imgPlaceholder.style.display = 'flex';
      }
      photoActionButtons.style.display = 'none';
      btnBrowse.style.display = 'block';
      inputFile.value = '';
    };

    btnSavePhoto.onclick = async () => {
      if (!selectedFileBase64) return;

      btnSavePhoto.disabled = true;
      btnSavePhoto.textContent = "Mengunggah ke Drive...";

      try {
        const res = await uploadTeacherPhoto(user, selectedFileBase64, selectedFileMime);
        toast.success(res.message);
        photoActionButtons.style.display = 'none';
        btnBrowse.style.display = 'block';
      } catch (err) {
        toast.error("Gagal menyimpan foto: " + err.message);
        // Pertahankan foto lama jika gagal
        imgPreview.src = originalSrc;
      } finally {
        btnSavePhoto.disabled = false;
        btnSavePhoto.textContent = "☁️ Simpan ke Google Drive";
      }
    };
  }

  // Update Phone Form
  const formPhone = document.getElementById('form-update-phone');
  if (formPhone) {
    formPhone.onsubmit = async () => {
      const phoneVal = document.getElementById('input-teacher-phone').value.trim();
      if (!phoneVal) {
        toast.warning("Nomor telepon tidak boleh kosong.");
        return;
      }

      const btnSavePhone = document.getElementById('btn-save-phone');
      btnSavePhone.disabled = true;
      btnSavePhone.textContent = "Menyimpan...";

      try {
        const res = await updateTeacherProfile(user, { nomor_telepon: phoneVal });
        toast.success(res.message);
      } catch (err) {
        toast.error(err.message || "Gagal memperbarui profil.");
      } finally {
        btnSavePhone.disabled = false;
        btnSavePhone.textContent = "Simpan Kontak";
      }
    };
  }

  // Change Password Form
  const formPass = document.getElementById('form-change-password');
  if (formPass) {
    formPass.onsubmit = async () => {
      const newPass = document.getElementById('input-new-pass').value;
      const confirmPass = document.getElementById('input-confirm-pass').value;
      const submitBtn = document.getElementById('btn-submit-change-pass');

      if (newPass !== confirmPass) {
        toast.error("Konfirmasi kata sandi tidak cocok!");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";

      try {
        const res = await changePassword(newPass);
        toast.success(res.message);
        formPass.reset();
      } catch (err) {
        toast.error(err.message || "Gagal mengganti kata sandi.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Perbarui Kata Sandi →";
      }
    };
  }
}
