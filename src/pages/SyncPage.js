/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PANEL SINKRONISASI DATA GOOGLE SHEETS & FIREBASE (src/pages/SyncPage.js)
 * ==============================================================================
 * Fitur:
 * 1. Format kolom otomatis Google Sheets (Data_Siswa) lengkap dengan panduan
 * 2. Tombol unduh template CSV dan salin header baris 1
 * 3. Input URL Google Apps Script Web App langsung di aplikasi
 * 4. Tarik data siswa langsung dari Google Sheets ke database sistem
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { 
  getSyncStatusSummary, 
  syncStudentsFromGoogleSheets, 
  getAttendance, 
  getGrades, 
  syncAttendanceToGoogleSheets, 
  syncGradesToGoogleSheets, 
  getGasApiUrl, 
  setGasApiUrl, 
  getStudents 
} from '../services.js';
import { isFirebaseConfigured } from '../firebase.js';
import { exportToCSV } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderSyncPage() {
  const syncSummary = await getSyncStatusSummary();
  const currentGasUrl = getGasApiUrl();
  const isConnected = Boolean(currentGasUrl && currentGasUrl.startsWith('https://script.google.com'));

  return `
    <div class="page-content">
      <!-- HEADER STATUS SINKRONISASI -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">🔄 Sinkronisasi Data Google Sheets &amp; Cloud Firestore</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Integrasi sinkronisasi data master siswa (Sheets → Website) dan salinan rekap presensi/nilai (Website → Sheets).
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btn-sync-students" style="font-weight: 700;">
              📥 Tarik Data Siswa dari Google Sheets
            </button>
          </div>
        </div>

        <!-- 3 KARTU KONEKSI UTAMA -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
          <div style="padding: 1.25rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 0.95rem;">1. Master Google Sheets</strong>
              <span class="badge ${isConnected ? 'badge-success' : 'badge-warning'}">
                ${isConnected ? '✓ Terhubung' : 'Belum Ada URL'}
              </span>
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Sheet resmi <em>Data_Siswa</em> sebagai sumber data induk tunggal.</p>
          </div>

          <div style="padding: 1.25rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 0.95rem;">2. Cloud Firestore &amp; Cache</strong>
              <span class="badge ${isFirebaseConfigured ? 'badge-success' : 'badge-info'}">
                ${isFirebaseConfigured ? 'Live Firebase' : 'Cache Offline Siap'}
              </span>
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Database realtime cepat untuk absensi harian dan input nilai.</p>
          </div>

          <div style="padding: 1.25rem; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong style="font-size: 0.95rem;">3. Google Drive</strong>
              <span class="badge ${isConnected ? 'badge-success' : 'badge-neutral'}">
                ${isConnected ? 'Siap Arsip' : 'Tersedia'}
              </span>
            </div>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Folder <em>SISTEM SEKOLAH/ABSENSI</em> &amp; <em>NILAI</em>.</p>
          </div>
        </div>

        <!-- PENGATURAN TAUTAN GOOGLE APPS SCRIPT WEB APP -->
        <div style="margin-top: 1.25rem; padding: 1.25rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;">
          <h4 style="font-size: 0.95rem; font-weight: 800; color: #1e40af; margin: 0 0 0.5rem 0;">
            🔗 URL Google Apps Script Web App (Tautan Tarik Data)
          </h4>
          <p style="font-size: 0.8rem; color: #3b82f6; margin: 0 0 0.75rem 0;">
            Masukkan URL Deployment Web App dari spreadsheet Anda (awalan: <code>https://script.google.com/macros/s/.../exec</code>) untuk mengaktifkan sinkronisasi langsung satu klik.
          </p>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <input type="url" id="input-gas-url" class="form-input" placeholder="https://script.google.com/macros/s/AKfycb.../exec" value="${currentGasUrl}" style="flex: 1; min-width: 280px; font-size: 0.85rem; font-family: monospace;">
            <button class="btn btn-primary" id="btn-save-gas-url" style="font-weight: 700;">
              💾 Simpan URL
            </button>
            ${currentGasUrl ? `
              <button class="btn btn-outline" id="btn-test-gas-connection" style="font-weight: 600;">
                🔌 Tes Koneksi
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- =================================================================== -->
      <!-- PANDUAN STRUKTUR KOLOM OTOMATIS GOOGLE SHEETS (SHEET Data_Siswa)     -->
      <!-- =================================================================== -->
      <div class="card" style="margin-bottom: 1.5rem; border-top: 4px solid #16a34a;">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem; color: #166534;">
              <span>📊</span>
              <span>Struktur Kolom Otomatis Google Sheets (Sheet: Data_Siswa)</span>
            </h3>
            <span style="font-size: 0.8rem; color: #64748b;">
              Susun kolom pada lembar <strong>Data_Siswa</strong> persis seperti tabel di bawah agar data dapat ditarik otomatis:
            </span>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" id="btn-copy-sheet-headers" style="font-weight: 700;">
              📋 Salin Baris Header (Baris 1)
            </button>
            <button class="btn btn-primary btn-sm" id="btn-download-sheet-template" style="font-weight: 700; background: #16a34a; border-color: #16a34a;">
              📥 Unduh Format Template CSV
            </button>
          </div>
        </div>

        <div class="table-responsive" style="margin-top: 0.5rem;">
          <table class="table" style="font-size: 0.82rem;">
            <thead style="background: #f8fafc;">
              <tr>
                <th style="width: 60px; text-align: center;">Kolom</th>
                <th style="width: 140px;">Nama Header</th>
                <th style="width: 90px; text-align: center;">Status</th>
                <th>Keterangan &amp; Format Pengisian</th>
                <th style="width: 180px;">Contoh Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">A</td>
                <td><code>No</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Nomor urut siswa di kelas</td>
                <td>1</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">B</td>
                <td><code>ID_Siswa</code></td>
                <td style="text-align: center;"><span class="badge badge-success">Otomatis</span></td>
                <td>ID unik siswa (otomatis dibuat sistem jika dikosongkan)</td>
                <td><code>SIS_1_001</code></td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">C</td>
                <td><code>NIS</code></td>
                <td style="text-align: center;"><span class="badge badge-danger">Wajib</span></td>
                <td>Nomor Induk Siswa lokal sekolah (wajib unik per anak)</td>
                <td><strong>1001</strong></td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">D</td>
                <td><code>NISN</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Nomor Induk Siswa Nasional (10 digit angka resmi)</td>
                <td>0181234001</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">E</td>
                <td><code>Nama_Lengkap</code></td>
                <td style="text-align: center;"><span class="badge badge-danger">Wajib</span></td>
                <td>Nama lengkap siswa huruf kapital sesuai akta kelahiran</td>
                <td><strong>ADREENA FARESTA HADIONO</strong></td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">F</td>
                <td><code>Jenis_Kelamin</code></td>
                <td style="text-align: center;"><span class="badge badge-danger">Wajib</span></td>
                <td>Isi dengan <strong>L</strong> (Laki-laki) atau <strong>P</strong> (Perempuan)</td>
                <td>L</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">G</td>
                <td><code>Kelas</code></td>
                <td style="text-align: center;"><span class="badge badge-danger">Wajib</span></td>
                <td>Angka jenjang kelas saja: <strong>1, 2, 3, 4, 5, atau 6</strong></td>
                <td><strong>1</strong></td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">H</td>
                <td><code>Tempat_Lahir</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Kota atau kabupaten tempat lahir</td>
                <td>Jember</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">I</td>
                <td><code>Tanggal_Lahir</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Format tanggal lahir resmi (YYYY-MM-DD)</td>
                <td>2018-05-12</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">J</td>
                <td><code>Nama_Orang_Tua</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Nama ayah / ibu / wali murid</td>
                <td>Hadiono</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">K</td>
                <td><code>Nomor_Wali</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Nomor HP atau WhatsApp aktif orang tua</td>
                <td>081234567890</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">L</td>
                <td><code>Alamat</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Dusun, Desa, Kecamatan domisili siswa</td>
                <td>Dsn. Tegal Baru, Kesilir</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">M</td>
                <td><code>Tahun_Pelajaran</code></td>
                <td style="text-align: center;"><span class="badge badge-neutral">Opsional</span></td>
                <td>Tahun ajaran aktif yang sedang berjalan</td>
                <td>2026/2027</td>
              </tr>
              <tr>
                <td style="text-align: center; font-weight: bold; background: #f1f5f9;">N</td>
                <td><code>Status_Siswa</code></td>
                <td style="text-align: center;"><span class="badge badge-success">Otomatis</span></td>
                <td>Status: <strong>Aktif</strong> (bisa juga Mutasi / Lulus)</td>
                <td>Aktif</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- PENGIRIMAN SALINAN (WEBSITE -> SHEETS) -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h3 class="card-title">📤 Sinkronisasi Arsip (Website → Google Sheets)</h3>
            <span style="font-size: 0.8rem; color: #64748b;">Kirim salinan rekapitulasi data absensi dan nilai siswa ke Google Sheets</span>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-outline" id="btn-sync-attendance" style="font-weight: 600;">
            📤 Kirim Salinan Absensi ke Sheet Data_Absensi
          </button>
          <button class="btn btn-outline" id="btn-sync-grades" style="font-weight: 600;">
            📤 Kirim Salinan Nilai ke Sheet Data_Nilai
          </button>
        </div>
      </div>

      <!-- LOG RIWAYAT TRANSAKSI SINKRONISASI -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📜 Log Riwayat Sinkronisasi Terakhir</h3>
          <span style="font-size: 0.78rem; color: #64748b;">Mencatat waktu, jenis data, arah, dan status transaksi</span>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-sync-logs">
            <thead>
              <tr>
                <th style="width: 150px;">Waktu</th>
                <th>Jenis Data</th>
                <th>Arah Sinkronisasi</th>
                <th style="text-align: center;">Proses</th>
                <th style="text-align: center;">Berhasil</th>
                <th style="text-align: center;">Gagal</th>
                <th>Status</th>
                <th>Pesan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${syncSummary.logs.length === 0 ? `
                <tr><td colspan="8" style="text-align:center; padding: 1.5rem; color:#64748b;">Belum ada riwayat transaksi sinkronisasi.</td></tr>
              ` : syncSummary.logs.map(l => `
                <tr>
                  <td style="font-size: 0.8rem;">${new Date(l.Waktu).toLocaleString('id-ID')}</td>
                  <td><strong>${l.Jenis_Data}</strong></td>
                  <td style="font-size: 0.8rem; color: #475569;">${l.Arah_Sinkronisasi}</td>
                  <td style="text-align: center;">${l.Jumlah_Diproses}</td>
                  <td style="text-align: center; color: #16a34a; font-weight: bold;">${l.Jumlah_Berhasil}</td>
                  <td style="text-align: center; color: ${l.Jumlah_Gagal > 0 ? '#dc2626' : '#94a3b8'};">${l.Jumlah_Gagal}</td>
                  <td>
                    <span class="badge ${l.Status === 'Sukses' ? 'badge-success' : 'badge-danger'}">
                      ${l.Status}
                    </span>
                  </td>
                  <td style="font-size: 0.8rem;">${l.Pesan}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function attachSyncEvents() {
  const user = getCurrentUser();

  const btnSyncStudents = document.getElementById('btn-sync-students');
  const btnSyncAtt = document.getElementById('btn-sync-attendance');
  const btnSyncGrades = document.getElementById('btn-sync-grades');
  const btnSaveGasUrl = document.getElementById('btn-save-gas-url');
  const inputGasUrl = document.getElementById('input-gas-url');
  const btnTestGas = document.getElementById('btn-test-gas-connection');
  const btnCopyHeaders = document.getElementById('btn-copy-sheet-headers');
  const btnDownloadTemplate = document.getElementById('btn-download-sheet-template');

  // 1. Simpan URL Google Apps Script
  if (btnSaveGasUrl && inputGasUrl) {
    btnSaveGasUrl.onclick = () => {
      const val = inputGasUrl.value.trim();
      setGasApiUrl(val);
      toast.success("URL Google Apps Script berhasil disimpan!");
      window.location.reload();
    };
  }

  // 2. Tes Koneksi Google Apps Script
  if (btnTestGas && inputGasUrl) {
    btnTestGas.onclick = async () => {
      const url = inputGasUrl.value.trim();
      if (!url) {
        toast.warning("Masukkan URL Google Apps Script terlebih dahulu.");
        return;
      }
      btnTestGas.disabled = true;
      btnTestGas.textContent = "Menguji...";
      try {
        const res = await fetch(`${url}?action=getStudents`);
        if (res.ok) {
          const data = await res.json();
          toast.success(`Koneksi berhasil! Ditemukan ${data.total || (data.students && data.students.length) || 0} siswa di Google Sheets.`);
        } else {
          toast.warning("Server merespons status: " + res.status);
        }
      } catch (err) {
        toast.error("Gagal terhubung ke Google Apps Script: " + err.message);
      } finally {
        btnTestGas.disabled = false;
        btnTestGas.textContent = "🔌 Tes Koneksi";
      }
    };
  }

  // 3. Salin Baris Header ke Clipboard
  if (btnCopyHeaders) {
    btnCopyHeaders.onclick = () => {
      const headersStr = "No\tID_Siswa\tNIS\tNISN\tNama_Lengkap\tJenis_Kelamin\tKelas\tTempat_Lahir\tTanggal_Lahir\tNama_Orang_Tua\tNomor_Wali\tAlamat\tTahun_Pelajaran\tStatus_Siswa";
      navigator.clipboard.writeText(headersStr)
        .then(() => toast.success("Baris header berhasil disalin! Silakan paste di sel A1 Google Sheets Anda."))
        .catch(() => toast.info("Salin manual: No, ID_Siswa, NIS, NISN, Nama_Lengkap, Jenis_Kelamin, Kelas, Tempat_Lahir, Tanggal_Lahir, Nama_Orang_Tua, Nomor_Wali, Alamat, Tahun_Pelajaran, Status_Siswa"));
    };
  }

  // 4. Unduh Template CSV Siswa
  if (btnDownloadTemplate) {
    btnDownloadTemplate.onclick = async () => {
      const currentStudents = await getStudents(null, 'semua');
      const templateData = currentStudents.map((s, idx) => ({
        No: idx + 1,
        ID_Siswa: s.ID_Siswa || `SIS_${s.Kelas}_${s.NIS}`,
        NIS: s.NIS,
        NISN: s.NISN || '',
        Nama_Lengkap: s.Nama_Lengkap,
        Jenis_Kelamin: s.Jenis_Kelamin,
        Kelas: s.Kelas,
        Tempat_Lahir: s.Tempat_Lahir || 'Jember',
        Tanggal_Lahir: s.Tanggal_Lahir || '2018-01-01',
        Nama_Orang_Tua: s.Nama_Orang_Tua || '-',
        Nomor_Wali: s.Nomor_Wali || '081234567890',
        Alamat: s.Alamat || 'Dsn. Tegal Baru, Kesilir',
        Tahun_Pelajaran: s.Tahun_Pelajaran || '2026/2027',
        Status_Siswa: s.Status_Siswa || 'Aktif'
      }));

      exportToCSV("Template_Google_Sheets_Data_Siswa", templateData);
      toast.success("Berkas template Google Sheets berhasil diunduh!");
    };
  }

  // 5. Tarik Data Siswa dari Sheets
  if (btnSyncStudents) {
    btnSyncStudents.onclick = async () => {
      btnSyncStudents.disabled = true;
      btnSyncStudents.textContent = "Menarik Data dari Google Sheets...";

      try {
        const res = await syncStudentsFromGoogleSheets(user);
        toast.success(res.message);
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        toast.error("Gagal menarik data siswa: " + err.message);
      } finally {
        btnSyncStudents.disabled = false;
        btnSyncStudents.textContent = "📥 Tarik Data Siswa dari Google Sheets";
      }
    };
  }

  // 6. Sinkronkan Absensi ke Sheets
  if (btnSyncAtt) {
    btnSyncAtt.onclick = async () => {
      btnSyncAtt.disabled = true;
      btnSyncAtt.textContent = "Mengirim...";

      try {
        const attList = await getAttendance();
        await syncAttendanceToGoogleSheets(attList, user.displayName);
        toast.success("Salinan data absensi berhasil dikirim ke Google Sheets (Data_Absensi)!");
      } catch (err) {
        toast.error("Gagal mengirim absensi: " + err.message);
      } finally {
        btnSyncAtt.disabled = false;
        btnSyncAtt.textContent = "📤 Kirim Salinan Absensi ke Sheet Data_Absensi";
      }
    };
  }

  // 7. Sinkronkan Nilai ke Sheets
  if (btnSyncGrades) {
    btnSyncGrades.onclick = async () => {
      btnSyncGrades.disabled = true;
      btnSyncGrades.textContent = "Mengirim...";

      try {
        const gradesList = await getGrades();
        await syncGradesToGoogleSheets(gradesList, user.displayName);
        toast.success("Salinan data nilai berhasil dikirim ke Google Sheets (Data_Nilai)!");
      } catch (err) {
        toast.error("Gagal mengirim nilai: " + err.message);
      } finally {
        btnSyncGrades.disabled = false;
        btnSyncGrades.textContent = "📤 Kirim Salinan Nilai ke Sheet Data_Nilai";
      }
    };
  }
}
