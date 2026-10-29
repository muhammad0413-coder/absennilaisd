/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * PENGATURAN IDENTITAS SEKOLAH & SISTEM (src/pages/SettingsPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { getSettings, updateSettings } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderSettingsPage() {
  const settings = await getSettings();

  return `
    <div class="page-content">
      <div style="max-width: 760px; margin: 0 auto;">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">⚙️ Pengaturan Identitas Sekolah & Sistem</h2>
              <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
                Data ini akan otomatis tercantum pada kop surat laporan resmi cetak (A4/F4).
              </p>
            </div>
          </div>

          <form id="form-save-settings" onsubmit="return false;">
            <div class="form-group">
              <label class="form-label">Nama Resmi Sekolah Dasar *</label>
              <input type="text" id="set-nama-sekolah" class="form-input" required value="${settings.nama_sekolah || 'SD NEGERI HARAPAN BANGSA'}">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">NPSN (Nomor Pokok Sekolah Nasional) *</label>
                <input type="text" id="set-npsn" class="form-input" required value="${settings.npsn || '20109988'}">
              </div>
              <div class="form-group">
                <label class="form-label">Tahun Ajaran Aktif *</label>
                <input type="text" id="set-tahun-ajaran" class="form-input" required value="${settings.tahun_ajaran_aktif || '2026/2027'}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Alamat Lengkap Sekolah *</label>
              <textarea id="set-alamat" class="form-textarea" rows="2" required>${settings.alamat_sekolah || 'Jl. Merdeka Belajar No. 45, Jakarta'}</textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nama Kepala Sekolah *</label>
                <input type="text" id="set-kepala-sekolah" class="form-input" required value="${settings.nama_kepala_sekolah || 'Drs. H. Mulyadi, M.Pd.'}">
              </div>
              <div class="form-group">
                <label class="form-label">NIP Kepala Sekolah *</label>
                <input type="text" id="set-nip-kepsek" class="form-input" required value="${settings.nip_kepala_sekolah || '197203151998031004'}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Semester Aktif *</label>
                <select id="set-semester" class="form-select">
                  <option value="1 (Ganjil)" ${settings.semester_aktif === '1 (Ganjil)' ? 'selected' : ''}>1 (Ganjil)</option>
                  <option value="2 (Genap)" ${settings.semester_aktif === '2 (Genap)' ? 'selected' : ''}>2 (Genap)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Izinkan Rekap Absensi Terbuka untuk Siswa</label>
                <select id="set-izinkan-rekap" class="form-select">
                  <option value="true" ${settings.izinkan_rekap_absensi_siswa !== 'false' ? 'selected' : ''}>Ya (Hanya Jumlah Hadir/Sakit/Izin/Alpa tanpa data pribadi)</option>
                  <option value="false" ${settings.izinkan_rekap_absensi_siswa === 'false' ? 'selected' : ''}>Tidak (Sembunyikan dari halaman umum siswa)</option>
                </select>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary" id="btn-save-settings-submit">
                💾 Simpan Pengaturan Sekolah →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function attachSettingsEvents() {
  const user = getCurrentUser();
  const form = document.getElementById('form-save-settings');

  if (form) {
    form.onsubmit = async () => {
      const payload = {
        nama_sekolah: document.getElementById('set-nama-sekolah').value.trim(),
        npsn: document.getElementById('set-npsn').value.trim(),
        tahun_ajaran_aktif: document.getElementById('set-tahun-ajaran').value.trim(),
        alamat_sekolah: document.getElementById('set-alamat').value.trim(),
        nama_kepala_sekolah: document.getElementById('set-kepala-sekolah').value.trim(),
        nip_kepala_sekolah: document.getElementById('set-nip-kepsek').value.trim(),
        semester_aktif: document.getElementById('set-semester').value,
        izinkan_rekap_absensi_siswa: document.getElementById('set-izinkan-rekap').value
      };

      const btnSubmit = document.getElementById('btn-save-settings-submit');
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Menyimpan...";

      try {
        await updateSettings(user, payload);
        toast.success("Pengaturan sekolah berhasil diperbarui!");
      } catch (e) {
        toast.error("Gagal menyimpan pengaturan: " + e.message);
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "💾 Simpan Pengaturan Sekolah →";
      }
    };
  }
}
