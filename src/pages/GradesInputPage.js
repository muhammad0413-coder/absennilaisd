/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1–6
 * INPUT & LEMBAR NILAI SISWA (FORMAT RESMI GAMBAR 2: KURIKULUM MERDEKA)
 * (src/pages/GradesInputPage.js)
 * ==============================================================================
 * Format Khusus Gambar 2:
 * 1. Formatif: Lingkup Materi 1–5 x 4 Tujuan Pembelajaran (TP1–TP4) = 20 Kolom
 * 2. Sumatif Lingkup Materi: LM1, LM2, LM3, LM4, LM5 = 5 Kolom
 * 3. Sumatif Akhir Semester (SAS) = 1 Kolom
 * 4. Nilai Akhir Semester (NA SEM) = Dihitung otomatis secara langsung (Live)
 * 5. Input langsung di dalam tabel seperti lembar kerja fisik buku nilai resmi.
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, getGrades, saveGradesBatch, getSettings, getUsers } from '../services.js';
import { triggerPrintAuthenticLandscape, generateGradesSemesterSheetHtml, exportToCSV } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderGradesInputPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'kelas_1';
  const settings = await getSettings();

  const mapelList = (settings.daftar_mata_pelajaran || "Pendidikan Pancasila,Bahasa Indonesia,Matematika,PJOK,PAI,Ilmu Pengetahuan Alam dan Sosial (IPAS),Seni Rupa,Bahasa Inggris").split(',');

  return `
    <div class="page-content" style="max-width: 100%;">
      <!-- Card Filter & Kontrol Utama -->
      <div class="card" style="margin-bottom: 1.25rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title" style="display: flex; align-items: center; gap: 0.5rem; color: #1e3a8a;">
              <span>📝</span>
              <span>Input &amp; Lembar Nilai Siswa (Format Resmi Gambar 2)</span>
            </h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Format resmi buku nilai Kurikulum Merdeka: Formatif (LM 1–5, TP 1–4), Sumatif LM 1–5, SAS, &amp; NA Semester. Anda dapat mengisi nilai langsung pada tabel.
            </p>
          </div>

          <!-- Tombol Aksi Cepat Atas -->
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-export-grades-input-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-outline btn-sm" id="btn-print-grades-input">
              🖨️ Cetak Lembar Nilai (PDF)
            </button>
            <button class="btn btn-primary btn-sm" id="btn-save-grades-top" style="font-weight: 700;">
              💾 Simpan Nilai (Format Gambar 2)
            </button>
          </div>
        </div>

        <!-- Filter Kelas, Mapel, & Semester -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;" class="no-print">
          <div style="flex: 1; min-width: 160px;">
            <label class="form-label" style="font-weight: 700; color: #1e3a8a;">👥 Tingkat Kelas</label>
            <select id="select-grade-in-class" class="form-select" ${userIsGuru ? 'disabled' : ''} style="font-weight: 700; border-color: #1e3a8a;">
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2 (Fase A)</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3 (Fase B)</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4 (Fase B)</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5 (Fase C)</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
            </select>
          </div>

          <div style="flex: 2; min-width: 220px;">
            <label class="form-label" style="font-weight: 700; color: #1e3a8a;">📚 Mata Pelajaran</label>
            <select id="select-grade-in-subject" class="form-select" style="font-weight: 700;">
              ${mapelList.map(m => `<option value="${m.trim()}" ${m.trim() === 'Matematika' ? 'selected' : ''}>${m.trim()}</option>`).join('')}
            </select>
          </div>

          <div style="flex: 1; min-width: 140px;">
            <label class="form-label" style="font-weight: 700; color: #1e3a8a;">📅 Semester</label>
            <select id="select-grade-in-sem" class="form-select">
              <option value="1 (Ganjil)" selected>1 (Ganjil)</option>
              <option value="2 (Genap)">2 (Genap)</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 130px;">
            <label class="form-label" style="font-weight: 700; color: #1e3a8a;">🗓️ Tahun Pelajaran</label>
            <input type="text" id="input-grade-in-year" class="form-input" value="${settings.tahun_pelajaran_aktif || '2026/2027'}">
          </div>

          <button class="btn btn-primary" id="btn-load-grade-in" style="height: 42px; font-weight: 700;">
            🔄 Muat Data
          </button>
        </div>
      </div>

      <!-- TABEL FORMAT ASLI GAMBAR 2 (KURIKULUM MERDEKA LENGKAP & EDITABLE) -->
      <div class="card" style="border-top: 4px solid #1e3a8a;">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem; background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
          <div>
            <h3 class="card-title" style="color: #1e3a8a; font-size: 1.15rem;">
              <span>DAFTAR NILAI SEMESTER</span>
              <span class="badge badge-primary" id="badge-grade-in-sem">Semester 1</span>
              <span class="badge badge-info" id="badge-grade-in-class">Kelas 1</span>
            </h3>
            <span style="font-size: 0.8rem; color: #64748b;" id="text-school-sub">
              ${settings.nama_sekolah || 'SDN KESILIR 02'} — Ketik angka langsung pada kolom TP1–TP4, LM1–LM5, atau SAS. Nilai Akhir (NA) terhitung otomatis.
            </span>
          </div>

          <div style="display: flex; gap: 0.5rem;" class="no-print">
            <button class="btn btn-success btn-sm" id="btn-save-grades-header" style="font-weight: 700;">
              💾 Simpan Perubahan Nilai
            </button>
          </div>
        </div>

        <!-- Wadah Tabel Format Asli Gambar 2 -->
        <div class="table-responsive" style="background: #ffffff; padding: 0.75rem; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; border: 1px solid #334155;" id="table-grades-authentic">
            <thead>
              <tr style="background: #f1f5f9; color: #0f172a;">
                <th rowspan="3" style="border: 1px solid #334155; width: 30px; text-align: center; padding: 4px;">NO.<br>URUT</th>
                <th rowspan="3" style="border: 1px solid #334155; width: 65px; text-align: center; padding: 4px;">NO.<br>INDUK</th>
                <th rowspan="3" style="border: 1px solid #334155; min-width: 170px; text-align: center; padding: 4px;">NAMA SISWA</th>
                <th colspan="20" style="border: 1px solid #334155; text-align: center; padding: 5px 0; background: #e0f2fe; color: #0369a1; font-weight: 800;">FORMATIF</th>
                <th colspan="5" style="border: 1px solid #334155; text-align: center; padding: 5px 0; background: #fef3c7; color: #b45309; font-weight: 800;">SUMATIF LINGKUP MATERI</th>
                <th rowspan="3" style="border: 1px solid #334155; width: 50px; text-align: center; background: #e0e7ff; color: #3730a3; font-weight: 800;">SUMATIF<br>AKHIR<br>SEM (SAS)</th>
                <th rowspan="3" style="border: 1px solid #334155; width: 45px; text-align: center; background: #dcfce7; color: #166534; font-weight: 900;">NA<br>SEM</th>
              </tr>
              <tr style="background: #f8fafc;">
                <th colspan="4" style="border: 1px solid #334155; text-align: center; font-size: 7.5pt; background: #f0f9ff;">Lingkup Materi 1</th>
                <th colspan="4" style="border: 1px solid #334155; text-align: center; font-size: 7.5pt; background: #f0f9ff;">Lingkup Materi 2</th>
                <th colspan="4" style="border: 1px solid #334155; text-align: center; font-size: 7.5pt; background: #f0f9ff;">Lingkup Materi 3</th>
                <th colspan="4" style="border: 1px solid #334155; text-align: center; font-size: 7.5pt; background: #f0f9ff;">Lingkup Materi 4</th>
                <th colspan="4" style="border: 1px solid #334155; text-align: center; font-size: 7.5pt; background: #f0f9ff;">Lingkup Materi 5</th>
                <th rowspan="2" style="border: 1px solid #334155; width: 32px; text-align: center; font-size: 7.5pt; background: #fffbeb;">LM1</th>
                <th rowspan="2" style="border: 1px solid #334155; width: 32px; text-align: center; font-size: 7.5pt; background: #fffbeb;">LM2</th>
                <th rowspan="2" style="border: 1px solid #334155; width: 32px; text-align: center; font-size: 7.5pt; background: #fffbeb;">LM3</th>
                <th rowspan="2" style="border: 1px solid #334155; width: 32px; text-align: center; font-size: 7.5pt; background: #fffbeb;">LM4</th>
                <th rowspan="2" style="border: 1px solid #334155; width: 32px; text-align: center; font-size: 7.5pt; background: #fffbeb;">LM5</th>
              </tr>
              <tr style="background: #ffffff;">
                ${Array.from({ length: 5 }, () => `
                  <th style="border: 1px solid #334155; width: 26px; text-align: center; font-size: 7pt; padding: 2px 0;">TP1</th>
                  <th style="border: 1px solid #334155; width: 26px; text-align: center; font-size: 7pt; padding: 2px 0;">TP2</th>
                  <th style="border: 1px solid #334155; width: 26px; text-align: center; font-size: 7pt; padding: 2px 0;">TP3</th>
                  <th style="border: 1px solid #334155; width: 26px; text-align: center; font-size: 7pt; padding: 2px 0;">TP4</th>
                `).join('')}
              </tr>
            </thead>
            <tbody id="grades-authentic-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>

        <!-- Footer Keterangan & Tombol Simpan Bawah -->
        <div style="padding: 1rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="font-size: 0.8rem; color: #475569;">
            <strong>Keterangan :</strong><br>
            <span>• <em>TP = Tujuan Pembelajaran</em> (Formatif Asesmen)</span><br>
            <span>• <em>LM = Lingkup Materi</em> (Sumatif Asesmen)</span><br>
            <span>• <em>SAS = Sumatif Akhir Semester</em> | <em>NA = Nilai Akhir Semester</em></span>
          </div>

          <div class="no-print">
            <button class="btn btn-success btn-lg" id="btn-save-grades-bottom" style="font-weight: 700; padding: 0.75rem 1.5rem;">
              💾 Simpan Semua Nilai (Format Gambar 2) &amp; Kirim ke Google Sheets
            </button>
          </div>
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
  const selectSem = document.getElementById('select-grade-in-sem');
  const inputYear = document.getElementById('input-grade-in-year');
  const btnLoad = document.getElementById('btn-load-grade-in');
  const btnSaveTop = document.getElementById('btn-save-grades-top');
  const btnSaveHeader = document.getElementById('btn-save-grades-header');
  const btnSaveBottom = document.getElementById('btn-save-grades-bottom');
  const btnPrint = document.getElementById('btn-print-grades-input');
  const btnExport = document.getElementById('btn-export-grades-input-csv');

  let activeClass = userIsGuru ? user.kelas_id : (selectClass ? selectClass.value : 'kelas_1');
  let studentsList = [];
  let existingGrades = [];
  let settings = {};

  // Fungsi Menghitung NA Siswa secara Realtime (Live Calculation)
  const recalculateStudentNA = (studentId) => {
    const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
    if (!row) return;

    const inputs = row.querySelectorAll('.input-grade-cell');
    let sum = 0;
    let count = 0;

    inputs.forEach(inp => {
      const val = inp.value.trim();
      if (val !== '') {
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= 100) {
          sum += num;
          count++;
        }
      }
    });

    const naDisplay = row.querySelector('.na-val-display');
    if (naDisplay) {
      naDisplay.textContent = count > 0 ? Math.round(sum / count) : '-';
    }
  };

  // Muat Formulir Nilai Format Gambar 2
  const loadForm = async () => {
    activeClass = userIsGuru ? user.kelas_id : (selectClass ? selectClass.value : 'kelas_1');
    const classNum = activeClass.replace('kelas_', '');
    const classLabel = CLASS_LABELS[activeClass] || `Kelas ${classNum}`;
    const subject = selectSubject ? selectSubject.value : 'Matematika';
    const sem = selectSem ? selectSem.value : '1 (Ganjil)';

    const badgeClass = document.getElementById('badge-grade-in-class');
    const badgeSem = document.getElementById('badge-grade-in-sem');
    if (badgeClass) badgeClass.textContent = classLabel;
    if (badgeSem) badgeSem.textContent = `Semester ${sem.includes('1') ? '1' : '2'}`;

    const tbody = document.getElementById('grades-authentic-tbody');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="30" style="text-align: center; padding: 2rem; color: #64748b;">Memuat lembar nilai Kurikulum Merdeka...</td></tr>`;
    }

    settings = await getSettings();
    studentsList = await getStudents(activeClass, 'Aktif');
    existingGrades = await getGrades(activeClass, subject);

    renderAuthenticTable();
  };

  // Render Baris Siswa dengan Input Formatif (LM1–5, TP1–4), Sumatif LM1–5, & SAS
  const renderAuthenticTable = () => {
    const tbody = document.getElementById('grades-authentic-tbody');
    if (!tbody) return;

    if (studentsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="30" style="text-align: center; padding: 2rem; color: #64748b;">
            Belum ada siswa aktif terdaftar pada kelas ini.
          </td>
        </tr>
      `;
      return;
    }

    const subject = selectSubject ? selectSubject.value : 'Matematika';

    tbody.innerHTML = studentsList.map((s, idx) => {
      const sGrades = existingGrades.filter(g => g.ID_Siswa === s.ID_Siswa && (!subject || g.Mata_Pelajaran === subject));

      // 20 Input Formatif (LM1..LM5 x TP1..TP4)
      let formatifInputs = "";
      let totalScore = 0;
      let validCount = 0;

      for (let lm = 1; lm <= 5; lm++) {
        for (let tp = 1; tp <= 4; tp++) {
          const match = sGrades.find(g =>
            (g.Jenis_Asesmen === 'Formatif' || !g.Jenis_Asesmen) &&
            ((g.Lingkup_Materi && g.Lingkup_Materi.includes(`Materi ${lm}`)) || (g.ID_Nilai && g.ID_Nilai.includes(`LM${lm}_TP${tp}`))) &&
            (g.Deskripsi && g.Deskripsi.includes(`TP${tp}`))
          );
          const score = match ? Number(match.Nilai) : "";
          if (typeof score === 'number' && !isNaN(score)) {
            totalScore += score;
            validCount++;
          }

          formatifInputs += `
            <td style="border: 1px solid #334155; text-align: center; padding: 2px;">
              <input type="number" min="0" max="100" class="input-grade-cell" 
                data-kind="formatif" data-lm="${lm}" data-tp="${tp}" 
                value="${score !== '' ? score : ''}" 
                style="width: 28px; height: 24px; padding: 0; text-align: center; font-size: 7.5pt; border: 1px solid #cbd5e1; border-radius: 3px;">
            </td>
          `;
        }
      }

      // 5 Input Sumatif LM (LM1..LM5)
      let sumatifInputs = "";
      for (let lm = 1; lm <= 5; lm++) {
        const matchLm = sGrades.find(g =>
          (g.Jenis_Asesmen === 'Sumatif Lingkup Materi' || g.Jenis_Asesmen === 'Sumatif') &&
          ((g.Lingkup_Materi && g.Lingkup_Materi.includes(`LM${lm}`)) || (g.Lingkup_Materi && g.Lingkup_Materi.includes(`LM ${lm}`)) || (g.ID_Nilai && g.ID_Nilai.includes(`SUM_LM${lm}`)))
        );
        const lmScore = matchLm ? Number(matchLm.Nilai) : "";
        if (typeof lmScore === 'number' && !isNaN(lmScore)) {
          totalScore += lmScore;
          validCount++;
        }

        sumatifInputs += `
          <td style="border: 1px solid #334155; text-align: center; padding: 2px; background: #fffdf5;">
            <input type="number" min="0" max="100" class="input-grade-cell input-sumatif" 
              data-kind="sumatif_lm" data-lm="${lm}" 
              value="${lmScore !== '' ? lmScore : ''}" 
              style="width: 28px; height: 24px; padding: 0; text-align: center; font-size: 7.5pt; font-weight: 700; background: #fefce8; border: 1px solid #d97706; border-radius: 3px;">
          </td>
        `;
      }

      // 1 Input Sumatif Akhir Semester (SAS)
      const matchSas = sGrades.find(g => g.Jenis_Asesmen === 'Sumatif Akhir Semester' || (g.ID_Nilai && g.ID_Nilai.includes('_SAS')));
      const sasScore = matchSas ? Number(matchSas.Nilai) : "";
      if (typeof sasScore === 'number' && !isNaN(sasScore)) {
        totalScore += sasScore;
        validCount++;
      }

      // NA Semester
      const avgScore = validCount > 0 ? Math.round(totalScore / validCount) : "-";

      return `
        <tr data-student-id="${s.ID_Siswa}" data-nis="${s.NIS}" data-name="${s.Nama_Lengkap}">
          <td style="border: 1px solid #334155; text-align: center; font-weight: 600; padding: 3px;">${idx + 1}</td>
          <td style="border: 1px solid #334155; text-align: center; font-size: 8pt; padding: 3px;">${s.NIS}</td>
          <td style="border: 1px solid #334155; text-align: left; padding: 3px 6px; font-weight: 600; font-size: 8pt; white-space: nowrap;">
            ${s.Nama_Lengkap}
          </td>
          ${formatifInputs}
          ${sumatifInputs}
          <td style="border: 1px solid #334155; text-align: center; padding: 2px; background: #f5f7ff;">
            <input type="number" min="0" max="100" class="input-grade-cell input-sas" 
              data-kind="sas" 
              value="${sasScore !== '' ? sasScore : ''}" 
              style="width: 32px; height: 24px; padding: 0; text-align: center; font-size: 7.5pt; font-weight: 800; background: #e0e7ff; border: 1px solid #4f46e5; border-radius: 3px;">
          </td>
          <td style="border: 1px solid #334155; text-align: center; padding: 3px; background: #f0fdf4;">
            <span class="na-val-display" style="font-weight: 900; font-size: 8.5pt; color: #166534;">${avgScore}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Pasang listener realtime saat angka diketik
    tbody.querySelectorAll('.input-grade-cell').forEach(inp => {
      inp.oninput = (e) => {
        const val = Number(e.target.value);
        if (val < 0 || val > 100) {
          e.target.style.borderColor = '#ef4444';
          e.target.style.backgroundColor = '#fee2e2';
        } else {
          e.target.style.borderColor = '';
          e.target.style.backgroundColor = '';
        }
        const tr = e.target.closest('tr');
        if (tr) {
          const sid = tr.getAttribute('data-student-id');
          recalculateStudentNA(sid);
        }
      };
    });
  };

  // Simpan Semua Nilai Format Gambar 2 Secara Lengkap
  const saveAllGrades = async () => {
    const rows = document.querySelectorAll('#grades-authentic-tbody tr[data-student-id]');
    if (rows.length === 0) {
      toast.warning("Tidak ada data siswa untuk disimpan.");
      return;
    }

    const subject = selectSubject ? selectSubject.value : 'Matematika';
    const sem = selectSem ? selectSem.value : '1 (Ganjil)';
    const year = inputYear ? inputYear.value.trim() : '2026/2027';

    const payload = [];

    for (const tr of rows) {
      const studentId = tr.getAttribute('data-student-id');
      const nis = tr.getAttribute('data-nis');
      const nama = tr.getAttribute('data-name');

      const inputs = tr.querySelectorAll('.input-grade-cell');

      for (const inp of inputs) {
        const rawVal = inp.value.trim();
        if (rawVal === '') continue; // Abaikan cell kosong

        const numVal = Number(rawVal);
        if (isNaN(numVal) || numVal < 0 || numVal > 100) {
          toast.error(`Nilai ${nama} (${rawVal}) tidak valid! Rentang harus 0–100.`);
          inp.focus();
          return;
        }

        const kind = inp.getAttribute('data-kind');
        const lm = inp.getAttribute('data-lm');
        const tp = inp.getAttribute('data-tp');

        if (kind === 'formatif') {
          payload.push({
            ID_Nilai: `GRD_${studentId}_${subject}_LM${lm}_TP${tp}`,
            ID_Siswa: studentId,
            NIS: nis,
            Nama_Siswa: nama,
            Kelas: activeClass,
            Mata_Pelajaran: subject,
            Jenis_Asesmen: "Formatif",
            Lingkup_Materi: `Materi ${lm}`,
            Deskripsi: `Formatif LM${lm} TP${tp}`,
            Nilai: numVal,
            Semester: sem,
            Tahun_Pelajaran: year
          });
        } else if (kind === 'sumatif_lm') {
          payload.push({
            ID_Nilai: `GRD_${studentId}_${subject}_SUM_LM${lm}`,
            ID_Siswa: studentId,
            NIS: nis,
            Nama_Siswa: nama,
            Kelas: activeClass,
            Mata_Pelajaran: subject,
            Jenis_Asesmen: "Sumatif",
            Lingkup_Materi: `Sumatif LM ${lm}`,
            Deskripsi: `Sumatif LM ${lm}`,
            Nilai: numVal,
            Semester: sem,
            Tahun_Pelajaran: year
          });
        } else if (kind === 'sas') {
          payload.push({
            ID_Nilai: `GRD_${studentId}_${subject}_SAS`,
            ID_Siswa: studentId,
            NIS: nis,
            Nama_Siswa: nama,
            Kelas: activeClass,
            Mata_Pelajaran: subject,
            Jenis_Asesmen: "Sumatif Akhir Semester",
            Lingkup_Materi: "Sumatif Akhir Semester",
            Deskripsi: `SAS Semester ${sem}`,
            Nilai: numVal,
            Semester: sem,
            Tahun_Pelajaran: year
          });
        }
      }
    }

    if (payload.length === 0) {
      toast.warning("Belum ada angka nilai yang diisi pada lembar tabel.");
      return;
    }

    const buttons = [btnSaveTop, btnSaveHeader, btnSaveBottom].filter(Boolean);
    buttons.forEach(b => {
      b.disabled = true;
      b.dataset.origText = b.innerHTML;
      b.innerHTML = "⏳ Menyimpan Nilai...";
    });

    try {
      const res = await saveGradesBatch(user, payload);
      toast.success(`Berhasil menyimpan ${res.count} nilai Kurikulum Merdeka (Format Gambar 2) & sinkron ke Google Sheets!`);
      // Muat ulang data terbaru
      existingGrades = await getGrades(activeClass, subject);
      renderAuthenticTable();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan nilai.");
    } finally {
      buttons.forEach(b => {
        b.disabled = false;
        if (b.dataset.origText) b.innerHTML = b.dataset.origText;
      });
    }
  };

  // Cetak Lembar Nilai Langsung (Format Gambar 2 Resmi)
  const printGrades = async () => {
    const classNum = activeClass.replace('kelas_', '');
    const classLabel = CLASS_LABELS[activeClass] || `Kelas ${classNum}`;
    const subject = selectSubject ? selectSubject.value : 'Matematika';
    const sem = selectSem ? selectSem.value : '1 (Ganjil)';

    const users = await getUsers();
    const teacherAccount = users.find(u => u.Kelas_Ditugaskan === activeClass);
    const teacherName = teacherAccount?.Nama || `Guru Kelas ${classNum}`;
    const teacherNip = teacherAccount?.NIP || '-';

    const printHtml = generateGradesSemesterSheetHtml(
      studentsList,
      existingGrades,
      subject,
      sem,
      settings,
      classLabel,
      teacherName,
      teacherNip,
      "Semester 1"
    );

    triggerPrintAuthenticLandscape(printHtml);
  };

  // Ekspor CSV
  const exportCsv = () => {
    const subject = selectSubject ? selectSubject.value : 'Matematika';
    const rows = [];
    rows.push(["NO", "NIS", "NAMA SISWA", "MATA PELAJARAN", "KELAS", "NA SEMESTER"]);

    const tableRows = document.querySelectorAll('#grades-authentic-tbody tr[data-student-id]');
    tableRows.forEach((tr, i) => {
      const nis = tr.getAttribute('data-nis');
      const nama = tr.getAttribute('data-name');
      const na = tr.querySelector('.na-val-display')?.textContent || '';
      rows.push([i + 1, nis, nama, subject, CLASS_LABELS[activeClass], na]);
    });

    exportToCSV(`Daftar_Nilai_${activeClass}_${subject}`, rows);
    toast.success("Daftar nilai berhasil diekspor ke file CSV!");
  };

  // Event Listeners
  if (btnLoad) btnLoad.onclick = loadForm;
  if (btnSaveTop) btnSaveTop.onclick = saveAllGrades;
  if (btnSaveHeader) btnSaveHeader.onclick = saveAllGrades;
  if (btnSaveBottom) btnSaveBottom.onclick = saveAllGrades;
  if (btnPrint) btnPrint.onclick = printGrades;
  if (btnExport) btnExport.onclick = exportCsv;

  if (selectClass) selectClass.onchange = loadForm;
  if (selectSubject) selectSubject.onchange = loadForm;
  if (selectSem) selectSem.onchange = loadForm;

  loadForm();
}
