/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * INPUT NILAI SISWA MASSAL & PER SISWA (src/pages/GradesInputPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, getGrades, saveGradesBatch, getSettings } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderGradesInputPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'kelas_1';
  const settings = await getSettings();

  const mapelList = (settings.daftar_mata_pelajaran || "Pendidikan Pancasila,Bahasa Indonesia,Matematika,IPAS,PJOK,Seni Budaya,Bahasa Inggris").split(',');

  return `
    <div class="page-content">
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">✏️ Input Nilai Siswa (Kurikulum Merdeka)</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Input nilai asesmen formatif dan sumatif secara massal dalam satu tabel atau per siswa.
            </p>
          </div>

          <a href="#grades-recap" class="btn btn-outline btn-sm no-print">
            📝 Buka Rekap Nilai Siswa
          </a>
        </div>

        <!-- Filter Kelas, Mapel, & Asesmen -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; align-items: flex-end;" class="no-print">
          <div>
            <label class="form-label">Tingkat Kelas</label>
            <select id="select-grade-in-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
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
            <select id="select-grade-in-subject" class="form-select">
              ${mapelList.map(m => `<option value="${m.trim()}">${m.trim()}</option>`).join('')}
            </select>
          </div>

          <div>
            <label class="form-label">Jenis Asesmen</label>
            <select id="select-grade-in-type" class="form-select">
              <option value="Formatif">Formatif (Tugas / Kuis)</option>
              <option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option>
              <option value="Sumatif Tengah Semester">Sumatif Tengah Semester</option>
              <option value="Sumatif Akhir Semester">Sumatif Akhir Semester (SAS)</option>
            </select>
          </div>

          <div>
            <label class="form-label">Semester</label>
            <select id="select-grade-in-sem" class="form-select">
              <option value="1 (Ganjil)">1 (Ganjil)</option>
              <option value="2 (Genap)">2 (Genap)</option>
            </select>
          </div>

          <div>
            <label class="form-label">Tahun Pelajaran</label>
            <input type="text" id="input-grade-in-year" class="form-input" value="${settings.tahun_pelajaran_aktif || '2026/2027'}">
          </div>
        </div>

        <div style="margin-top: 1rem; display: flex; gap: 1rem; align-items: flex-end;" class="no-print">
          <div style="flex: 1;">
            <label class="form-label">Nama Penilaian / Lingkup Materi *</label>
            <input type="text" id="input-grade-in-topic" class="form-input" placeholder="Contoh: Bab 1 Operasi Hitung Campuran">
          </div>
          <button class="btn btn-primary" id="btn-load-grade-in" style="height: 42px;">
            Muat Formulir Nilai
          </button>
        </div>
      </div>

      <!-- Tabel Input Nilai Massal -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <h3 class="card-title">
            <span>Tabel Lembar Penilaian Siswa</span>
            <span class="badge badge-info" id="badge-grade-in-class">Kelas 1</span>
          </h3>

          <button class="btn btn-success btn-sm no-print" id="btn-save-grades-top">
            🚀 Simpan &amp; Kirim ke Google Sheets
          </button>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-grades-input">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th style="width: 90px;">NIS</th>
                <th>Nama Siswa</th>
                <th style="width: 140px; text-align: center;">Nilai (0 - 100) *</th>
                <th>Deskripsi Capaian Pembelajaran</th>
              </tr>
            </thead>
            <tbody id="grades-input-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;" class="no-print">
          <button class="btn btn-success btn-lg" id="btn-save-grades-bottom">
            🚀 Simpan Nilai &amp; Kirim Langsung ke Google Sheets
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachGradesInputEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('select-grade-in-class');
  const selectSubject = document.getElementById('select-grade-in-subject');
  const selectType = document.getElementById('select-grade-in-type');
  const selectSem = document.getElementById('select-grade-in-sem');
  const inputYear = document.getElementById('input-grade-in-year');
  const inputTopic = document.getElementById('input-grade-in-topic');
  const btnLoad = document.getElementById('btn-load-grade-in');
  const btnSaveTop = document.getElementById('btn-save-grades-top');
  const btnSaveBottom = document.getElementById('btn-save-grades-bottom');

  let activeClass = userIsGuru ? user.kelas_id : selectClass.value;
  let studentsList = [];
  let existingGrades = [];

  const loadForm = async () => {
    activeClass = userIsGuru ? user.kelas_id : selectClass.value;
    const subject = selectSubject.value;
    const type = selectType.value;
    const sem = selectSem.value;
    const year = inputYear.value.trim();

    document.getElementById('badge-grade-in-class').textContent = CLASS_LABELS[activeClass] || 'Kelas';

    studentsList = await getStudents(activeClass, 'Aktif');
    existingGrades = await getGrades(activeClass, subject, type, sem);

    renderRows();
  };

  const renderRows = () => {
    const tbody = document.getElementById('grades-input-tbody');
    if (!tbody) return;

    if (studentsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
            Tidak ada siswa aktif terdaftar di kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = studentsList.map((s, idx) => {
      const recorded = existingGrades.find(g => g.ID_Siswa === s.ID_Siswa);
      const scoreVal = recorded ? recorded.Nilai : '';
      const descVal = recorded ? recorded.Deskripsi : '';

      return `
        <tr data-student-id="${s.ID_Siswa}" data-nis="${s.NIS}" data-nisn="${s.NISN || ''}" data-name="${s.Nama_Lengkap}">
          <td>${idx + 1}</td>
          <td><strong>${s.NIS}</strong></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${s.Nama_Lengkap}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${s.Jenis_Kelamin}</div>
          </td>
          <td style="text-align: center;">
            <input type="number" class="form-input grade-score-input" min="0" max="100" placeholder="0 - 100" value="${scoreVal}" style="text-align: center; font-size: 1.05rem; font-weight: bold; width: 110px; margin: 0 auto;">
          </td>
          <td>
            <input type="text" class="form-input grade-desc-input" placeholder="Deskripsi capaian..." value="${descVal}">
          </td>
        </tr>
      `;
    }).join('');
  };

  const saveGrades = async () => {
    const rows = document.querySelectorAll('#grades-input-tbody tr');
    if (rows.length === 0) return;

    const topicName = inputTopic.value.trim();
    if (!topicName) {
      toast.warning("Silakan isi nama penilaian / lingkup materi terlebih dahulu!");
      inputTopic.focus();
      return;
    }

    const subject = selectSubject.value;
    const type = selectType.value;
    const sem = selectSem.value;
    const year = inputYear.value.trim();

    const payload = [];

    for (const tr of rows) {
      const studentId = tr.getAttribute('data-student-id');
      const nis = tr.getAttribute('data-nis');
      const nisn = tr.getAttribute('data-nisn');
      const nama = tr.getAttribute('data-name');
      const scoreInput = tr.querySelector('.grade-score-input');
      const scoreRaw = scoreInput.value.trim();
      const desc = tr.querySelector('.grade-desc-input').value.trim();

      // Lewati baris yang belum diisi nilainya (jangan anggap 0)
      if (scoreRaw === '') continue;

      const scoreNum = Number(scoreRaw);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        toast.error(`Nilai ${nama} (${scoreRaw}) tidak valid! Rentang harus 0-100.`);
        scoreInput.focus();
        return;
      }

      payload.push({
        ID_Siswa: studentId,
        NIS: nis,
        NISN: nisn,
        Nama_Siswa: nama,
        Kelas: activeClass,
        Mata_Pelajaran: subject,
        Jenis_Asesmen: type,
        Semester: sem,
        Tahun_Pelajaran: year,
        Lingkup_Materi: topicName,
        Nilai: scoreNum,
        Deskripsi: desc
      });
    }

    if (payload.length === 0) {
      toast.warning("Belum ada nilai yang diinputkan pada tabel.");
      return;
    }

    const originalTopText = btnSaveTop ? btnSaveTop.innerHTML : '';
    const originalBottomText = btnSaveBottom ? btnSaveBottom.innerHTML : '';
    if (btnSaveTop) btnSaveTop.innerHTML = '⏳ Menyimpan &amp; Mengirim...';
    if (btnSaveBottom) btnSaveBottom.innerHTML = '⏳ Mengirim ke Database &amp; Google Sheets...';

    try {
      const res = await saveGradesBatch(user, payload);
      toast.success(`${res.message} Data langsung terkirim ke Google Sheets (Data_Nilai)!`);
      loadForm();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan nilai.');
    } finally {
      if (btnSaveTop) btnSaveTop.innerHTML = originalTopText;
      if (btnSaveBottom) btnSaveBottom.innerHTML = originalBottomText;
    }
  };

  if (btnLoad) btnLoad.onclick = loadForm;
  if (btnSaveTop) btnSaveTop.onclick = saveGrades;
  if (btnSaveBottom) btnSaveBottom.onclick = saveGrades;
  if (selectClass) selectClass.onchange = loadForm;

  loadForm();
}
