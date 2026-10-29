/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PENGATURAN KURIKULUM & KOP SURAT RESMI (src/pages/SettingsPage.js)
 * ==============================================================================
 * Fitur:
 * 1. Admin dapat mengedit seluruh identitas resmi Kop Surat Sekolah
 * 2. Upload file Logo Kiri (Pemkab/Dinas) & Logo Kanan (Sekolah) dari komputer/HP
 * 3. Live Preview Kop Surat Otentik yang langsung merespons setiap perubahan
 * 4. Pengaturan kalender akademik, semester aktif, KKM, dan daftar mapel
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { getSettings, updateSettings } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderSettingsPage() {
  const settings = await getSettings();
  const logoKiri = settings.logo_kiri || '/logo-kiri.png';
  const logoKanan = settings.logo_kanan || '/logo-kanan.png';
  const schoolName = settings.nama_sekolah || 'SDN KESILIR 02';
  const kabupaten = settings.kabupaten || 'KABUPATEN JEMBER';
  const dinas = settings.dinas || 'DINAS PENDIDIKAN';
  const alamat = settings.alamat_sekolah || 'Dsn. Tegal Baru, Ds. Kesilir, Kec. Wuluhan, Kab. Jember';
  const npsn = settings.npsn || '20523456';

  return `
    <div class="page-content">
      <div style="max-width: 900px; margin: 0 auto;">
        <!-- Header -->
        <div class="card" style="margin-bottom: 1.5rem;">
          <div class="card-header">
            <div>
              <h2 class="card-title">⚙️ Pengaturan Kop Surat &amp; Konfigurasi Sekolah</h2>
              <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
                Kelola kop surat resmi sekolah, unggah logo instansi, atur identitas kepala sekolah, serta konfigurasi kurikulum.
              </p>
            </div>
          </div>

          <!-- KOTAK LIVE PREVIEW KOP SURAT RESMI -->
          <div style="margin-top: 1rem; padding: 1.25rem; background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px;">
                👁️ Live Preview Kop Surat Resmi (Tercetak di Lembar Rapor, Absen &amp; Roster)
              </span>
              <span class="badge badge-success" style="font-size: 0.72rem;">Otomatis Sinkron</span>
            </div>

            <!-- Preview Render -->
            <div id="live-kop-preview" style="background: white; padding: 1.25rem 1.5rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); font-family: 'Times New Roman', serif;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 8px;">
                <div style="width: 75px; text-align: left;">
                  <img id="prev-img-logol" src="${logoKiri}" alt="Logo Kiri" style="height: 65px; object-fit: contain;" onerror="this.src='/logo-kiri.png'">
                </div>
                <div style="flex: 1; text-align: center; padding: 0 10px;">
                  <h4 id="prev-text-kab" style="font-size: 10pt; font-weight: bold; margin: 0; text-transform: uppercase;">PEMERINTAH ${kabupaten}</h4>
                  <h4 id="prev-text-dinas" style="font-size: 9.5pt; font-weight: bold; margin: 1px 0; text-transform: uppercase;">${dinas}</h4>
                  <h3 id="prev-text-sch" style="font-size: 13pt; font-weight: bold; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px; color: #000;">${schoolName}</h3>
                  <p id="prev-text-addr" style="font-size: 8pt; margin: 1px 0;">${alamat} | NPSN: ${npsn}</p>
                </div>
                <div style="width: 75px; text-align: right;">
                  <img id="prev-img-logor" src="${logoKanan}" alt="Logo Kanan" style="height: 65px; object-fit: contain;" onerror="this.src='/logo-kanan.png'">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulir Pengaturan -->
        <div class="card">
          <form id="form-save-system-settings" onsubmit="return false;">
            <!-- SEKSI 1: KOP SURAT & LOGO -->
            <div class="sidebar-nav-label" style="padding-left: 0; font-size: 0.9rem; font-weight: 800; color: #1e3a8a; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
              🏛️ 1. Pengaturan Identitas &amp; Logo Kop Surat
            </div>

            <!-- Upload Logo Kiri & Kanan -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <!-- Logo Kiri -->
              <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Logo Kiri (Pemkab / Dinas Pendidikan)
                </label>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <img id="thumb-logol" src="${logoKiri}" alt="Thumb Kiri" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 6px; background: white; padding: 2px;" onerror="this.src='/logo-kiri.png'">
                  <label class="btn btn-outline btn-sm" style="cursor: pointer; font-size: 0.78rem; font-weight: 700;">
                    📁 Unggah Logo Kiri
                    <input type="file" id="file-sch-logol" accept="image/*" style="display: none;">
                  </label>
                </div>
                <input type="text" id="set-sch-logol" class="form-input" style="font-size: 0.75rem;" placeholder="/logo-kiri.png atau data:image/..." value="${logoKiri}">
              </div>

              <!-- Logo Kanan -->
              <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">
                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                  Logo Kanan (Logo Resmi Sekolah)
                </label>
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <img id="thumb-logor" src="${logoKanan}" alt="Thumb Kanan" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 6px; background: white; padding: 2px;" onerror="this.src='/logo-kanan.png'">
                  <label class="btn btn-outline btn-sm" style="cursor: pointer; font-size: 0.78rem; font-weight: 700;">
                    📁 Unggah Logo Kanan
                    <input type="file" id="file-sch-logor" accept="image/*" style="display: none;">
                  </label>
                </div>
                <input type="text" id="set-sch-logor" class="form-input" style="font-size: 0.75rem;" placeholder="/logo-kanan.png atau data:image/..." value="${logoKanan}">
              </div>
            </div>

            <!-- Teks Kop Surat -->
            <div class="form-group">
              <label class="form-label">Nama Resmi Sekolah Dasar (Baris Utama Kop) *</label>
              <input type="text" id="set-sch-name" class="form-input" required value="${schoolName}" style="font-weight: 700; font-size: 1rem;">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Pemerintah Kabupaten / Kota *</label>
                <input type="text" id="set-sch-kab" class="form-input" required value="${kabupaten}">
              </div>
              <div class="form-group">
                <label class="form-label">Dinas Terkait *</label>
                <input type="text" id="set-sch-dinas" class="form-input" required value="${dinas}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">NPSN Sekolah *</label>
                <input type="text" id="set-sch-npsn" class="form-input" required value="${npsn}">
              </div>
              <div class="form-group">
                <label class="form-label">Alamat Lengkap Sekolah *</label>
                <input type="text" id="set-sch-addr" class="form-input" required value="${alamat}">
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

            <!-- SEKSI 2: KALENDER AKADEMIK & ASESMEN -->
            <div class="sidebar-nav-label" style="padding-left: 0; font-size: 0.9rem; font-weight: 800; color: #1e3a8a; margin: 1.5rem 0 1rem 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
              📅 2. Kalender Akademik &amp; Asesmen
            </div>

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
                <label class="form-label">Kriteria Ketuntasan Minimal (KKM) *</label>
                <input type="number" id="set-sch-kkm" class="form-input" required min="50" max="100" value="${settings.kkm_default || 75}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Daftar Mata Pelajaran (Pisahkan dengan koma) *</label>
              <textarea id="set-sch-mapel" class="form-textarea" rows="3" required>${settings.daftar_mata_pelajaran || 'Pendidikan Pancasila,Bahasa Indonesia,Matematika,PJOK,PAI,Ilmu Pengetahuan Alam dan Sosial (IPAS),Seni Rupa,Bahasa Inggris'}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
              <button type="submit" class="btn btn-primary btn-lg" id="btn-save-settings" style="font-weight: 700; padding: 0.75rem 1.5rem;">
                💾 Simpan Kop Surat &amp; Konfigurasi Sekolah
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

  // Input Teks
  const inputSch = document.getElementById('set-sch-name');
  const inputKab = document.getElementById('set-sch-kab');
  const inputDinas = document.getElementById('set-sch-dinas');
  const inputAddr = document.getElementById('set-sch-addr');
  const inputNpsn = document.getElementById('set-sch-npsn');
  const inputLogoL = document.getElementById('set-sch-logol');
  const inputLogoR = document.getElementById('set-sch-logor');

  // Preview Elemen
  const prevSch = document.getElementById('prev-text-sch');
  const prevKab = document.getElementById('prev-text-kab');
  const prevDinas = document.getElementById('prev-text-dinas');
  const prevAddr = document.getElementById('prev-text-addr');
  const prevImgL = document.getElementById('prev-img-logol');
  const prevImgR = document.getElementById('prev-img-logor');
  const thumbL = document.getElementById('thumb-logol');
  const thumbR = document.getElementById('thumb-logor');

  // Live typing listeners
  const updatePreview = () => {
    if (prevSch && inputSch) prevSch.textContent = inputSch.value.trim() || 'SDN KESILIR 02';
    if (prevKab && inputKab) prevKab.textContent = `PEMERINTAH ${inputKab.value.trim() || 'KABUPATEN JEMBER'}`;
    if (prevDinas && inputDinas) prevDinas.textContent = inputDinas.value.trim() || 'DINAS PENDIDIKAN';
    if (prevAddr && inputAddr && inputNpsn) {
      prevAddr.textContent = `${inputAddr.value.trim()} | NPSN: ${inputNpsn.value.trim()}`;
    }
  };

  [inputSch, inputKab, inputDinas, inputAddr, inputNpsn].forEach(el => {
    if (el) el.addEventListener('input', updatePreview);
  });

  const compressLogo = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Gagal mengurai gambar logo."));
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          const maxDim = 250;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/png', 0.85));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload Logo Kiri
  const fileL = document.getElementById('file-sch-logol');
  if (fileL) {
    fileL.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const base64 = await compressLogo(file);
        if (inputLogoL) inputLogoL.value = base64;
        if (prevImgL) prevImgL.src = base64;
        if (thumbL) thumbL.src = base64;
        toast.info("Logo kiri berhasil dimuat.");
      } catch (err) {
        toast.error("Gagal memproses logo kiri: " + err.message);
      }
    };
  }

  // Upload Logo Kanan
  const fileR = document.getElementById('file-sch-logor');
  if (fileR) {
    fileR.onchange = async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const base64 = await compressLogo(file);
        if (inputLogoR) inputLogoR.value = base64;
        if (prevImgR) prevImgR.src = base64;
        if (thumbR) thumbR.src = base64;
        toast.info("Logo kanan berhasil dimuat.");
      } catch (err) {
        toast.error("Gagal memproses logo kanan: " + err.message);
      }
    };
  }

  // Jika input teks logo diketik manual
  if (inputLogoL) {
    inputLogoL.oninput = () => {
      const val = inputLogoL.value.trim();
      if (prevImgL) prevImgL.src = val || '/logo-kiri.png';
      if (thumbL) thumbL.src = val || '/logo-kiri.png';
    };
  }

  if (inputLogoR) {
    inputLogoR.oninput = () => {
      const val = inputLogoR.value.trim();
      if (prevImgR) prevImgR.src = val || '/logo-kanan.png';
      if (thumbR) thumbR.src = val || '/logo-kanan.png';
    };
  }

  if (form) {
    form.onsubmit = async () => {
      const payload = {
        nama_sekolah: inputSch ? inputSch.value.trim() : '',
        npsn: inputNpsn ? inputNpsn.value.trim() : '',
        alamat_sekolah: inputAddr ? inputAddr.value.trim() : '',
        kabupaten: inputKab ? inputKab.value.trim() : '',
        dinas: inputDinas ? inputDinas.value.trim() : '',
        logo_kiri: inputLogoL ? inputLogoL.value.trim() : '',
        logo_kanan: inputLogoR ? inputLogoR.value.trim() : '',
        nama_kepala_sekolah: document.getElementById('set-sch-head').value.trim(),
        nip_kepala_sekolah: document.getElementById('set-sch-nip').value.trim(),
        tahun_pelajaran_aktif: document.getElementById('set-sch-year').value.trim(),
        semester_aktif: document.getElementById('set-sch-sem').value,
        kkm_default: document.getElementById('set-sch-kkm').value,
        daftar_mata_pelajaran: document.getElementById('set-sch-mapel').value.trim()
      };

      const btn = document.getElementById('btn-save-settings');
      btn.disabled = true;
      btn.textContent = "Menyimpan Perubahan...";

      try {
        await updateSettings(user, payload);
        toast.success("Kop surat dan konfigurasi sekolah berhasil diperbarui!");
      } catch (e) {
        toast.error("Gagal menyimpan: " + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "💾 Simpan Kop Surat & Konfigurasi Sekolah";
      }
    };
  }
}
