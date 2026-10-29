/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PUSAT CETAK 9 LAPORAN RESMI (src/pages/ReportsPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, getAttendance, getGrades, calculateAttendanceRecap, calculateGradesRecap, getSettings, getUsers } from '../services.js';
import { triggerPrintAuthenticLandscape, renderKopSuratOfficialHtml, generateAttendanceMonthSheetHtml, generateGradesSemesterSheetHtml, exportToCSV } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderReportsPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'kelas_1';
  const settings = await getSettings();

  const mapelList = (settings.daftar_mata_pelajaran || "Pendidikan Pancasila,Bahasa Indonesia,Matematika,IPAS,PJOK,Seni Budaya,Bahasa Inggris").split(',');

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <h2 class="card-title">🖨️ Pusat Cetak Laporan Resmi Sekolah (A4 / F4)</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Pilih laporan di bawah untuk melihat pratinjau langsung di layar, mencetak ke printer/PDF, atau mengunduh data ke Excel.
            </p>
          </div>
        </div>

        <!-- Filter Kelas dan Parameter Cetak -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; align-items: flex-end;" class="no-print">
          <div>
            <label class="form-label">Pilih Kelas Laporan</label>
            <select id="report-select-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6</option>
            </select>
          </div>

          <div>
            <label class="form-label">Mata Pelajaran</label>
            <select id="report-select-mapel" class="form-select">
              ${mapelList.map(m => `<option value="${m.trim()}">${m.trim()}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="form-label">Semester</label>
            <select id="report-select-sem" class="form-select">
              <option value="1 (Ganjil)">1 (Ganjil)</option>
              <option value="2 (Genap)">2 (Genap)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Grid 9 Jenis Laporan Resmi -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
        <!-- 1. Daftar Siswa Per Kelas -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">1. Daftar Siswa per Kelas</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Daftar lengkap NIS, NISN, nama siswa, tempat tanggal lahir, dan wali murid.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="daftar-siswa" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Daftar Siswa
          </button>
        </div>

        <!-- 2. Absensi Harian -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">2. Absensi Harian Kelas</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Lembar presensi harian per tanggal dengan kolom paraf dan keterangan.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="absensi-harian" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Absensi Hari Ini
          </button>
        </div>

        <!-- 3. Rekap Absensi Bulanan (Gambar 1) -->
        <div class="card" style="margin-bottom: 0; border: 2px solid #3b82f6;">
          <div style="font-size: 0.72rem; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 2px;">Format Blangko Asli</div>
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">3. Daftar Hadir 1–31 (Gambar 1)</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Blangko resmi tanggal 1–31, S, I, A, Jumlah, &amp; Prosentase Kehadiran.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="rekap-absensi-bulanan" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Format Gambar 1
          </button>
        </div>

        <!-- 4. Rekap Absensi Semester -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">4. Rekap Absensi Semester</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Rekapitulasi presensi total untuk pengisian buku rapor semester.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="rekap-absensi-semester" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Rekap Semester
          </button>
        </div>

        <!-- 5. Nilai Kurikulum Merdeka (Gambar 2) -->
        <div class="card" style="margin-bottom: 0; border: 2px solid #10b981;">
          <div style="font-size: 0.72rem; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 2px;">Format Blangko Asli</div>
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">5. Daftar Nilai Semester (Gambar 2)</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Kurikulum Merdeka: Formatif (TP1–4 per LM1–5), Sumatif LM1–5, SAS, &amp; NA.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="nilai-per-mapel" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Format Gambar 2
          </button>
        </div>

        <!-- 6. Rekap Nilai Siswa -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">6. Rekap Nilai Siswa</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Rekapitulasi rata-rata capaian kompetensi per siswa di kelas terkait.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="rekap-nilai-siswa" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Rata-Rata Nilai
          </button>
        </div>

        <!-- 7. Rekap Nilai per Kelas -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">7. Rekap Nilai per Kelas</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Lembar rangkuman capaian seluruh siswa dalam satu kelas.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="rekap-nilai-kelas" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Nilai Kelas
          </button>
        </div>

        <!-- 8. Laporan Kepala Sekolah -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">8. Laporan Kepala Sekolah</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Ringkasan eksekutif kehadiran dan ketuntasan belajar seluruh jenjang.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="laporan-kepsek" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Laporan Kepsek
          </button>
        </div>

        <!-- 9. Laporan Berdasarkan Tahun & Semester -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">9. Laporan Tahunan / Semester</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Arsip dokumentasi capaian akhir periode akademik sekolah.</p>
          <button class="btn btn-primary btn-sm btn-print-action" data-type="laporan-tahunan" style="width: 100%; font-weight: 700;">
            👁️ Pratinjau &amp; Cetak Laporan Periode
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL PRATINJAU LANGSUNG LAPORAN RESMI (MUNCUL DI LAYAR) -->
    <div id="modal-report-preview-slot"></div>
  `;
}

export function attachReportsEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('report-select-class');
  const selectMapel = document.getElementById('report-select-mapel');
  const selectSem = document.getElementById('report-select-sem');

  document.querySelectorAll('.btn-print-action').forEach(btn => {
    btn.onclick = async () => {
      const type = btn.getAttribute('data-type');
      const activeClass = userIsGuru ? user.kelas_id : selectClass.value;
      const classLabel = CLASS_LABELS[activeClass] || 'Kelas';
      const mapel = selectMapel ? selectMapel.value : 'Matematika';
      const sem = selectSem ? selectSem.value : '1 (Ganjil)';

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.textContent = "Memuat Pratinjau...";

      try {
        await executeReportPrint(type, activeClass, classLabel, mapel, sem);
      } catch (err) {
        toast.error("Gagal menyiapkan laporan: " + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    };
  });

  async function executeReportPrint(type, activeClass, classLabel, mapel, sem) {
    const students = await getStudents(activeClass, 'Aktif');
    const settings = await getSettings();
    const users = await getUsers();
    const classNum = activeClass.replace('kelas_', '');

    // Cari guru wali kelas resmi
    const teacherAccount = users.find(u => u.Kelas_Ditugaskan === activeClass && (u.Role === 'guru' || !u.Role));
    const teacherName = teacherAccount?.Nama || (classNum === '1' ? 'Suci Ayu Ningrum, S.Pd.' : (classNum === '5' ? 'Dra. Ratna Suminar' : `Guru Kelas ${classNum}`));
    const teacherNip = teacherAccount?.NIP || (classNum === '1' ? '199410142023212000' : (classNum === '5' ? '195701201992032001' : '-'));
    const headmaster = settings.nama_kepala_sekolah || "Abdullah Mahsar, S.Pd.";
    const headmasterNip = settings.nip_kepala_sekolah || "198306012014121000";
    const city = (settings.kabupaten || "Jember").replace(/KABUPATEN\s+/i, '').trim();
    const todayStr = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());

    let docTitle = "";
    let docHtml = "";
    let csvData = [];

    if (type === 'daftar-siswa') {
      docTitle = "Daftar Siswa per Kelas";
      csvData = students.map((s, idx) => ({
        No: idx + 1,
        NIS: s.NIS,
        NISN: s.NISN || '-',
        Nama: s.Nama_Lengkap,
        JK: s.Jenis_Kelamin,
        Tempat_Lahir: s.Tempat_Lahir,
        Tanggal_Lahir: s.Tanggal_Lahir,
        Orang_Tua: s.Nama_Orang_Tua,
        Status: s.Status_Siswa
      }));

      const rows = students.map((s, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${idx + 1}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${s.NIS}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${s.NISN || '-'}</td>
          <td style="border: 1px solid #000; padding: 4px; font-weight: 600;">${s.Nama_Lengkap}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${s.Jenis_Kelamin}</td>
          <td style="border: 1px solid #000; padding: 4px;">${s.Tempat_Lahir}, ${s.Tanggal_Lahir}</td>
          <td style="border: 1px solid #000; padding: 4px;">${s.Nama_Orang_Tua}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${s.Status_Siswa}</td>
        </tr>
      `).join('');

      docHtml = `
        <div style="font-family: 'Times New Roman', serif; color: #000;">
          ${renderKopSuratOfficialHtml(settings)}
          <div style="text-align: center; margin-bottom: 12px;">
            <h3 style="font-size: 12pt; font-weight: bold; margin: 0; text-transform: uppercase;">DAFTAR SISWA KELAS ${classLabel.toUpperCase()}</h3>
            <p style="font-size: 9pt; margin: 2px 0;">Tahun Ajaran: ${settings.tahun_pelajaran_aktif || "2026/2027"}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="border: 1px solid #000; width: 35px; text-align: center;">No</th>
                <th style="border: 1px solid #000; width: 70px; text-align: center;">NIS</th>
                <th style="border: 1px solid #000; width: 85px; text-align: center;">NISN</th>
                <th style="border: 1px solid #000; text-align: left; padding: 4px;">Nama Siswa</th>
                <th style="border: 1px solid #000; width: 45px; text-align: center;">L/P</th>
                <th style="border: 1px solid #000; text-align: left; padding: 4px;">Tempat, Tanggal Lahir</th>
                <th style="border: 1px solid #000; text-align: left; padding: 4px;">Nama Orang Tua / Wali</th>
                <th style="border: 1px solid #000; width: 65px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="8" style="text-align:center; padding: 1.5rem; border: 1px solid #000;">Belum ada siswa terdaftar.</td></tr>'}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 9.5pt;">
            <div style="text-align: left;">
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 0 0 50px 0;">Kepala Sekolah</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${headmaster}</p>
              <p style="margin: 0; font-size: 8.5pt;">NIP. ${headmasterNip}</p>
            </div>
            <div style="text-align: left;">
              <p style="margin: 0;">${city}, ${todayStr}</p>
              <p style="margin: 0 0 50px 0;">Wali Kelas ${classLabel}</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${teacherName}</p>
              <p style="margin: 0; font-size: 8.5pt;">NIP. ${teacherNip}</p>
            </div>
          </div>
        </div>
      `;

    } else if (type === 'rekap-absensi-bulanan') {
      docTitle = "Daftar Hadir Siswa 1–31 (Format Gambar 1)";
      const allAttendance = await getAttendance(activeClass);
      docHtml = generateAttendanceMonthSheetHtml(students, allAttendance, "Bulan Ini", settings, classLabel, teacherName, teacherNip);

    } else if (type === 'nilai-per-mapel' || type === 'rekap-nilai-siswa') {
      docTitle = `Daftar Nilai Semester Kurikulum Merdeka (Format Gambar 2) - ${mapel}`;
      const allGrades = await getGrades(activeClass, mapel, null, sem);
      docHtml = generateGradesSemesterSheetHtml(students, allGrades, mapel, sem, settings, classLabel, teacherName, teacherNip);

    } else if (type === 'absensi-harian') {
      docTitle = "Lembar Presensi Harian Siswa";
      const today = new Date().toISOString().substring(0, 10);
      const att = await getAttendance(activeClass, today);
      const rows = students.map((s, idx) => {
        const rec = att.find(a => a.ID_Siswa === s.ID_Siswa);
        return `
          <tr>
            <td style="text-align: center; border: 1px solid #000; padding: 4px;">${idx + 1}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 4px;">${s.NIS}</td>
            <td style="border: 1px solid #000; padding: 4px; font-weight: 600;">${s.Nama_Lengkap}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 4px; font-weight: bold;">${rec ? rec.Status_Absensi : 'Hadir'}</td>
            <td style="border: 1px solid #000; padding: 4px;">${rec ? (rec.Keterangan || '-') : '-'}</td>
          </tr>
        `;
      }).join('');

      docHtml = `
        <div style="font-family: 'Times New Roman', serif; color: #000;">
          ${renderKopSuratOfficialHtml(settings)}
          <div style="text-align: center; margin-bottom: 12px;">
            <h3 style="font-size: 12pt; font-weight: bold; margin: 0; text-transform: uppercase;">LEMBAR PRESENSI HARIAN SISWA</h3>
            <p style="font-size: 9pt; margin: 2px 0;">Kelas: ${classLabel} | Tanggal: ${todayStr}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="border: 1px solid #000; width: 40px; text-align: center;">No</th>
                <th style="border: 1px solid #000; width: 80px; text-align: center;">NIS</th>
                <th style="border: 1px solid #000; text-align: left; padding: 4px;">Nama Siswa</th>
                <th style="border: 1px solid #000; width: 100px; text-align: center;">Kehadiran</th>
                <th style="border: 1px solid #000; text-align: left; padding: 4px;">Keterangan</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 9.5pt;">
            <div style="text-align: left;">
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 0 0 50px 0;">Kepala Sekolah</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${headmaster}</p>
              <p style="margin: 0; font-size: 8.5pt;">NIP. ${headmasterNip}</p>
            </div>
            <div style="text-align: left;">
              <p style="margin: 0;">${city}, ${todayStr}</p>
              <p style="margin: 0 0 50px 0;">Guru Kelas ${classLabel}</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${teacherName}</p>
              <p style="margin: 0; font-size: 8.5pt;">NIP. ${teacherNip}</p>
            </div>
          </div>
        </div>
      `;

    } else {
      // Rekap Presensi Semester & Laporan Lainnya
      docTitle = `Rekapitulasi Capaian ${classLabel}`;
      const recapData = await calculateAttendanceRecap(activeClass);
      const rows = recapData.recap.map((r, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${idx + 1}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${r.student.NIS}</td>
          <td style="border: 1px solid #000; padding: 4px; font-weight: 600;">${r.student.Nama_Lengkap}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${r.hadir}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${r.sakit}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${r.izin}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px;">${r.alpa}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 4px; font-weight: bold;">${r.persentase}</td>
        </tr>
      `).join('');

      docHtml = `
        <div style="font-family: 'Times New Roman', serif; color: #000;">
          ${renderKopSuratOfficialHtml(settings)}
          <div style="text-align: center; margin-bottom: 12px;">
            <h3 style="font-size: 12pt; font-weight: bold; margin: 0; text-transform: uppercase;">REKAPITULASI PRESENSI SEMESTER</h3>
            <p style="font-size: 9pt; margin: 2px 0;">Kelas: ${classLabel} | Semester: ${sem}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="border: 1px solid #000; width: 35px; text-align: center;">No</th>
                <th style="border: 1px solid #000; width: 75px; text-align: center;">NIS</th>
                <th style="border: 1px solid #000; text-align: left; padding: 4px;">Nama Siswa</th>
                <th style="border: 1px solid #000; width: 50px; text-align: center;">Hadir</th>
                <th style="border: 1px solid #000; width: 50px; text-align: center;">Sakit</th>
                <th style="border: 1px solid #000; width: 50px; text-align: center;">Izin</th>
                <th style="border: 1px solid #000; width: 50px; text-align: center;">Alpa</th>
                <th style="border: 1px solid #000; width: 75px; text-align: center;">% Kehadiran</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 9.5pt;">
            <div style="text-align: left;">
              <p style="margin: 0;">Mengetahui,</p>
              <p style="margin: 0 0 50px 0;">Kepala Sekolah</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${headmaster}</p>
              <p style="margin: 0; font-size: 8.5pt;">NIP. ${headmasterNip}</p>
            </div>
            <div style="text-align: left;">
              <p style="margin: 0;">${city}, ${todayStr}</p>
              <p style="margin: 0 0 50px 0;">Wali Kelas ${classLabel}</p>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${teacherName}</p>
              <p style="margin: 0; font-size: 8.5pt;">NIP. ${teacherNip}</p>
            </div>
          </div>
        </div>
      `;
    }

    // Tampilkan modal pratinjau langsung di layar
    showReportPreviewModal(docTitle, classLabel, docHtml, csvData);
  }

  function showReportPreviewModal(title, classLabel, fullHtml, csvData) {
    const slot = document.getElementById('modal-report-preview-slot');
    if (!slot) return;

    slot.innerHTML = `
      <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div style="background: white; border-radius: 14px; max-width: 1050px; width: 100%; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); overflow: hidden;">
          <!-- Topbar Modal -->
          <div style="padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;" class="no-print">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">📄</span>
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 800; color: #1e3a8a; margin: 0;">
                  ${title}
                </h3>
                <span style="font-size: 0.75rem; color: #64748b;">Pratinjau Dokumen Resmi ${classLabel}</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <button class="btn btn-primary btn-sm" id="btn-modal-print-now" style="font-weight: 700;">
                🖨️ Cetak / Download PDF
              </button>
              ${csvData && csvData.length > 0 ? `
                <button class="btn btn-outline btn-sm" id="btn-modal-export-csv" style="font-weight: 600;">
                  📥 Unduh Excel (CSV)
                </button>
              ` : ''}
              <button class="btn btn-outline btn-sm" id="btn-close-rep-preview" style="font-weight: 600;">
                ✕ Tutup
              </button>
            </div>
          </div>

          <!-- Lembar Dokumen Resmi -->
          <div style="flex: 1; overflow-y: auto; overflow-x: auto; padding: 1.5rem; background: #f1f5f9;">
            <div style="background: white; padding: 1.75rem 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; max-width: 950px; margin: 0 auto;">
              ${fullHtml}
            </div>
          </div>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('btn-close-rep-preview');
    if (closeBtn) closeBtn.onclick = () => { slot.innerHTML = ''; };

    const printBtn = document.getElementById('btn-modal-print-now');
    if (printBtn) {
      printBtn.onclick = () => {
        triggerPrintAuthenticLandscape(fullHtml);
      };
    }

    const csvBtn = document.getElementById('btn-modal-export-csv');
    if (csvBtn) {
      csvBtn.onclick = () => {
        exportToCSV(`${title.replace(/\s+/g, '_')}_${classLabel}`, csvData);
      };
    }
  }
}
