/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PENGATURAN KURIKULUM & SEKOLAH (src/pages/SettingsPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { getSettings, updateSettings } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderSettingsPage() {
  const settings = await getSettings();

  return `
    <div class="page-content">
      <div style="max-width: 800px; margin: 0 auto;">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">⚙️ Pengaturan Kurikulum &amp; Identitas Sekolah</h2>
              <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
                Konfigurasi tahun ajaran, semester, daftar mata pelajaran dinamis, batas KKM, dan data resmi kop surat.
              </p>
            </div>
          </div>

          <form id="form-save-system-settings" onsubmit="return false;">
            <div class="sidebar-nav-label" style="padding-left: 0;">Identitas Resmi Sekolah (Kop Surat)</div>
            
            <div class="form-group">
              <label class="form-label">Nama Resmi Sekolah Dasar *</label>
              <input type="text" id="set-sch-name" class="form-input" required value="${settings.nama_sekolah || 'SD NEGERI HARAPAN BANGSA'}">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">NPSN *</label>
                <input type="text" id="set-sch-npsn" class="form-input" required value="${settings.npsn || '20109988'}">
              </div>
              <div class="form-group">
                <label class="form-label">Alamat Lengkap Sekolah *</label>
                <input type="text" id="set-sch-addr" class="form-input" required value="${settings.alamat_sekolah || 'Jl. Merdeka Belajar No. 45, Jakarta'}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Pemerintah Kabupaten / Kota *</label>
                <input type="text" id="set-sch-kab" class="form-input" required value="${settings.kabupaten || 'KABUPATEN JEMBER'}">
              </div>
              <div class="form-group">
                <label class="form-label">Dinas Terkait *</label>
                <input type="text" id="set-sch-dinas" class="form-input" required value="${settings.dinas || 'DINAS PENDIDIKAN'}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">URL / Berkas Logo Kiri Kop Surat</label>
                <input type="text" id="set-sch-logol" class="form-input" value="${settings.logo_kiri || '/logo-kiri.png'}">
              </div>
              <div class="form-group">
                <label class="form-label">URL / Berkas Logo Kanan Kop Surat (Logo Sekolah)</label>
                <input type="text" id="set-sch-logor" class="form-input" value="${settings.logo_kanan || '/logo-kanan.png'}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nama Kepala Sekolah *</label>
                <input type="text" id="set-sch-head" class="form-input" required value="${settings.nama_kepala_sekolah || 'Abdullah Mahsar, S.Pd.'}">
              </div>
              <div class="form-group">
                <label class="form-label">NIP Kepala Sekolah *</label>
                <input type="text" id="set-sch-nip" class="form-input" required value="${settings.nip_kepala_sekolah || '198306012014121000'}">
              </div>
            </div>

            <div class="sidebar-nav-label" style="padding-left: 0; margin-top: 1rem;">Kalender Akademik &amp; Asesmen</div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tahun Pelajaran Aktif *</label>
                <input type="text" id="set-sch-year" class="form-input" required value="${settings.tahun_pelajaran_aktif || '2026/2027'}">
              </div>

              <div class="form-group">
                <label class="form-label">Semester Aktif *</label>
                <select id="set-sch-sem" class="form-select">
                  <option value="1 (Ganjil)" ${settings.semester_aktif === '1 (Ganjil)' ? 'selected' : ''}>1 (Ganjil)</option>
                  <option value="2 (Genap)" ${settings.semester_aktif === '2 (Genap)' ? 'selected' : ''}>2 (Genap)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Kriteria Ketuntasan Minimal (KKM Default) *</label>
                <input type="number" id="set-sch-kkm" class="form-input" required min="50" max="100" value="${settings.kkm_default || 75}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Daftar Mata Pelajaran Dinamis (Pisahkan dengan tanda koma) *</label>
              <textarea id="set-sch-mapel" class="form-textarea" rows="3" required>${settings.daftar_mata_pelajaran || 'Pendidikan Pancasila,Bahasa Indonesia,Matematika,Ilmu Pengetahuan Alam dan Sosial (IPAS),Pendidikan Jasmani Olahraga dan Kesehatan (PJOK),Seni Budaya,Bahasa Inggris'}</textarea>
              <span class="form-hint">Mata pelajaran ini akan otomatis muncul pada formulir input nilai dan rekap rapor seluruh jenjang kelas 1–6.</span>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary" id="btn-save-settings">
                💾 Simpan Konfigurasi Sekolah →
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
  const form = document.getElementById('form-save-system-settings');

  if (form) {
    form.onsubmit = async () => {
      const payload = {
        nama_sekolah: document.getElementById('set-sch-name').value.trim(),
        npsn: document.getElementById('set-sch-npsn').value.trim(),
        alamat_sekolah: document.getElementById('set-sch-addr').value.trim(),
        kabupaten: document.getElementById('set-sch-kab').value.trim(),
        dinas: document.getElementById('set-sch-dinas').value.trim(),
        logo_kiri: document.getElementById('set-sch-logol').value.trim(),
        logo_kanan: document.getElementById('set-sch-logor').value.trim(),
        nama_kepala_sekolah: document.getElementById('set-sch-head').value.trim(),
        nip_kepala_sekolah: document.getElementById('set-sch-nip').value.trim(),
        tahun_pelajaran_aktif: document.getElementById('set-sch-year').value.trim(),
        semester_aktif: document.getElementById('set-sch-sem').value,
        kkm_default: document.getElementById('set-sch-kkm').value,
        daftar_mata_pelajaran: document.getElementById('set-sch-mapel').value.trim()
      };

      const btn = document.getElementById('btn-save-settings');
      btn.disabled = true;
      btn.textContent = "Menyimpan...";

      try {
        await updateSettings(user, payload);
        toast.success("Konfigurasi sekolah berhasil diperbarui!");
      } catch (e) {
        toast.error("Gagal menyimpan: " + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "💾 Simpan Konfigurasi Sekolah →";
      }
    };
  }
}
