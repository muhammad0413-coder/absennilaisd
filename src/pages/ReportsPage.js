/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PUSAT CETAK 9 LAPORAN RESMI (src/pages/ReportsPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, getAttendance, getGrades, calculateAttendanceRecap, calculateGradesRecap, getSettings } from '../services.js';
import { triggerPrintReport, exportToCSV } from '../components/ReportPrint.js';
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
              Laporan terformat rapi sesuai standar dinas pendidikan lengkap dengan kop surat sekolah dan kolom tanda tangan resmi.
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
          <button class="btn btn-outline btn-sm btn-print-action" data-type="daftar-siswa" style="width: 100%;">
            🖨️ Cetak Daftar Siswa
          </button>
        </div>

        <!-- 2. Absensi Harian -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">2. Absensi Harian Kelas</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Lembar presensi harian per tanggal dengan kolom paraf dan keterangan.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="absensi-harian" style="width: 100%;">
            🖨️ Cetak Absensi Hari Ini
          </button>
        </div>

        <!-- 3. Rekap Absensi Bulanan -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">3. Rekap Absensi Bulanan</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Rekapitulasi persentase kehadiran bulanan (Hadir, Sakit, Izin, Alpa).</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="rekap-absensi-bulanan" style="width: 100%;">
            🖨️ Cetak Rekap Bulanan
          </button>
        </div>

        <!-- 4. Rekap Absensi Semester -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">4. Rekap Absensi Semester</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Rekapitulasi presensi total untuk pengisian buku rapor semester.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="rekap-absensi-semester" style="width: 100%;">
            🖨️ Cetak Rekap Semester
          </button>
        </div>

        <!-- 5. Daftar Nilai per Mata Pelajaran -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">5. Nilai per Mata Pelajaran</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Daftar asesmen formatif dan sumatif untuk satu mata pelajaran pilihan.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="nilai-per-mapel" style="width: 100%;">
            🖨️ Cetak Nilai Mapel
          </button>
        </div>

        <!-- 6. Rekap Nilai Siswa -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">6. Rekap Nilai Siswa</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Rekapitulasi rata-rata capaian kompetensi per siswa di kelas terkait.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="rekap-nilai-siswa" style="width: 100%;">
            🖨️ Cetak Rata-Rata Nilai
          </button>
        </div>

        <!-- 7. Rekap Nilai per Kelas -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">7. Rekap Nilai per Kelas</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Lembar rangkuman capaian seluruh siswa dalam satu kelas.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="rekap-nilai-kelas" style="width: 100%;">
            🖨️ Cetak Nilai Kelas
          </button>
        </div>

        <!-- 8. Laporan Kepala Sekolah -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">8. Laporan Kepala Sekolah</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Ringkasan eksekutif kehadiran dan ketuntasan belajar seluruh jenjang.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="laporan-kepsek" style="width: 100%;">
            🖨️ Cetak Laporan Kepsek
          </button>
        </div>

        <!-- 9. Laporan Berdasarkan Tahun & Semester -->
        <div class="card" style="margin-bottom: 0;">
          <h4 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">9. Laporan Tahunan / Semester</h4>
          <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 1rem;">Arsip dokumentasi capaian akhir periode akademik sekolah.</p>
          <button class="btn btn-outline btn-sm btn-print-action" data-type="laporan-tahunan" style="width: 100%;">
            🖨️ Cetak Laporan Periode
          </button>
        </div>
      </div>
    </div>
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
      const mapel = selectMapel.value;
      const sem = selectSem.value;

      btn.disabled = true;
      btn.textContent = "Menyiapkan...";

      try {
        await executeReportPrint(type, activeClass, classLabel, mapel, sem);
      } catch (err) {
        toast.error("Gagal mencetak laporan: " + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = `🖨️ Cetak ${type.replace(/-/g, ' ')}`;
      }
    };
  });

  async function executeReportPrint(type, activeClass, classLabel, mapel, sem) {
    const students = await getStudents(activeClass, 'Aktif');

    if (type === 'daftar-siswa') {
      const rows = students.map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${s.NIS}</td>
          <td style="text-align: center;">${s.NISN || '-'}</td>
          <td>${s.Nama_Lengkap}</td>
          <td style="text-align: center;">${s.Jenis_Kelamin}</td>
          <td>${s.Tempat_Lahir}, ${s.Tanggal_Lahir}</td>
          <td>${s.Nama_Orang_Tua}</td>
          <td style="text-align: center;">${s.Status_Siswa}</td>
        </tr>
      `).join('');

      const html = `
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th style="width: 90px;">NISN</th>
              <th>Nama Siswa</th>
              <th style="width: 50px;">L/P</th>
              <th>Tempat, Tanggal Lahir</th>
              <th>Orang Tua / Wali</th>
              <th style="width: 70px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      await triggerPrintReport("Daftar Siswa per Kelas", classLabel, html);
    } else if (type === 'absensi-harian') {
      const today = new Date().toISOString().substring(0, 10);
      const att = await getAttendance(activeClass, today);
      const rows = students.map((s, idx) => {
        const rec = att.find(a => a.ID_Siswa === s.ID_Siswa);
        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="text-align: center;">${s.NIS}</td>
            <td>${s.Nama_Lengkap}</td>
            <td style="text-align: center; font-weight: bold;">${rec ? rec.Status_Absensi : 'Hadir'}</td>
            <td>${rec ? rec.Keterangan : '-'}</td>
          </tr>
        `;
      }).join('');

      const html = `
        <div style="margin-bottom: 10px;"><strong>Tanggal:</strong> ${today}</div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th style="width: 100px;">Kehadiran</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      await triggerPrintReport("Lembar Presensi Harian", classLabel, html);
    } else if (type === 'rekap-absensi-bulanan' || type === 'rekap-absensi-semester') {
      const recapData = await calculateAttendanceRecap(activeClass);
      const rows = recapData.recap.map((r, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${r.student.NIS}</td>
          <td>${r.student.Nama_Lengkap}</td>
          <td style="text-align: center;">${r.hadir}</td>
          <td style="text-align: center;">${r.sakit}</td>
          <td style="text-align: center;">${r.izin}</td>
          <td style="text-align: center;">${r.alpa}</td>
          <td style="text-align: center;">${r.totalHari}</td>
          <td style="text-align: center; font-weight: bold;">${r.persentase}</td>
        </tr>
      `).join('');

      const html = `
        <div style="margin-bottom: 10px;"><strong>Total Hari Tercatat:</strong> ${recapData.totalHariTercatat} Hari</div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th style="width: 45px;">H</th>
              <th style="width: 45px;">S</th>
              <th style="width: 45px;">I</th>
              <th style="width: 45px;">A</th>
              <th style="width: 65px;">Total Hari</th>
              <th style="width: 75px;">% Hadir</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      await triggerPrintReport(type === 'rekap-absensi-bulanan' ? "Rekapitulasi Presensi Bulanan" : "Rekapitulasi Presensi Semester", classLabel, html);
    } else {
      // Rekap Nilai Mapel / Nilai Siswa / Laporan Kepsek
      const recapScores = await calculateGradesRecap(activeClass, mapel, sem);
      const rows = recapScores.map((r, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${r.student.NIS}</td>
          <td>${r.student.Nama_Lengkap}</td>
          <td style="text-align: center;">${r.totalAsesmen}</td>
          <td style="text-align: center; font-weight: bold;">${r.rataRata}</td>
          <td>${r.grades.length > 0 ? r.grades[0].Deskripsi || '-' : '-'}</td>
        </tr>
      `).join('');

      const html = `
        <div style="margin-bottom: 10px;"><strong>Mata Pelajaran:</strong> ${mapel} | <strong>Semester:</strong> ${sem}</div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th style="width: 70px;">Asesmen</th>
              <th style="width: 80px;">Rata-Rata</th>
              <th>Deskripsi Capaian</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
      await triggerPrintReport("Laporan Nilai Capaian Belajar", classLabel, html);
    }
  }
}
