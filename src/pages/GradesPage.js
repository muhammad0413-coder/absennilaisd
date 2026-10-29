/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * MODUL PENILAIAN SISWA (src/pages/GradesPage.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin } from '../permissions.js';
import { getStudents, getGrades, saveGrade, publishGrades } from '../services.js';
import { toast } from '../components/Toast.js';
import { triggerPrintReport, exportToCSV } from '../components/ReportPrint.js';

export async function renderGradesPage() {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);
  const defaultClass = userIsAdmin ? 'kelas_1' : user.kelas_id;

  return `
    <div class="page-content">
      <!-- Header Modul Penilaian -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">📝 Modul Penilaian & Asesmen Siswa</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Pengelolaan nilai formatif dan sumatif Kurikulum Merdeka untuk Kelas 1 dan Kelas 6.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" class="no-print">
            <button class="btn btn-outline btn-sm" id="btn-export-grades-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-outline btn-sm" id="btn-print-grades">
              🖨️ Cetak Rekap Nilai
            </button>
            <button class="btn btn-primary btn-sm" id="btn-open-add-grade">
              ➕ Input Nilai Siswa
            </button>
          </div>
        </div>

        <!-- Filter Kelas & Mata Pelajaran -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; padding-top: 0.5rem;" class="no-print">
          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Kelas</label>
            <select id="select-grade-class" class="form-select" ${!userIsAdmin ? 'disabled' : ''}>
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 200px;">
            <label class="form-label">Mata Pelajaran</label>
            <select id="select-grade-subject" class="form-select">
              <option value="semua">Semua Mata Pelajaran</option>
              <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
              <option value="Bahasa Indonesia">Bahasa Indonesia</option>
              <option value="Matematika">Matematika</option>
              <option value="Ilmu Pengetahuan Alam (IPA)">Ilmu Pengetahuan Alam (IPA)</option>
              <option value="Pendidikan Jasmani & Olahraga (PJOK)">PJOK</option>
              <option value="Seni Budaya">Seni Budaya</option>
              <option value="Bahasa Inggris">Bahasa Inggris</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Jenis Penilaian</label>
            <select id="select-grade-type" class="form-select">
              <option value="semua">Semua Jenis Asesmen</option>
              <option value="Formatif">Formatif (Tugas & Kuis)</option>
              <option value="Sumatif Lingkup Materi">Sumatif Lingkup Materi</option>
              <option value="Sumatif Akhir Semester">Sumatif Akhir Semester (SAS)</option>
            </select>
          </div>

          <button class="btn btn-primary" id="btn-filter-grades" style="height: 42px;">
            Terapkan Filter
          </button>
        </div>
      </div>

      <!-- Tabel Daftar Nilai -->
      <div class="card">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <h3 class="card-title">
            <span>Daftar Nilai Siswa</span>
            <span class="badge badge-info" id="badge-grades-count">0 Data</span>
          </h3>
          <div class="no-print" style="display: flex; gap: 0.5rem;">
            <button class="btn btn-success btn-sm" id="btn-batch-publish">
              📢 Publikasikan Nilai Terpilih
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-grades">
            <thead>
              <tr>
                <th style="width: 40px;"><input type="checkbox" id="check-all-grades"></th>
                <th>NIS</th>
                <th>Nama Siswa</th>
                <th>Mata Pelajaran</th>
                <th>Jenis Asesmen</th>
                <th>Nama Tugas / Ulangan</th>
                <th style="text-align: center;">Nilai</th>
                <th>Status</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="grades-table-body">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Input / Edit Nilai -->
    <div id="grade-modal-slot"></div>
  `;
}

export function attachGradesEvents() {
  const user = getCurrentUser();
  const userIsAdmin = isAdmin(user);

  const selectClass = document.getElementById('select-grade-class');
  const selectSubject = document.getElementById('select-grade-subject');
  const selectType = document.getElementById('select-grade-type');
  const btnFilter = document.getElementById('btn-filter-grades');
  const btnOpenAdd = document.getElementById('btn-open-add-grade');
  const btnBatchPublish = document.getElementById('btn-batch-publish');
  const btnPrint = document.getElementById('btn-print-grades');
  const btnExport = document.getElementById('btn-export-grades-csv');
  const checkAll = document.getElementById('check-all-grades');

  let activeClass = userIsAdmin ? selectClass.value : user.kelas_id;
  let allGrades = [];
  let currentStudents = [];

  const loadData = async () => {
    activeClass = userIsAdmin ? selectClass.value : user.kelas_id;
    currentStudents = await getStudents(activeClass);
    allGrades = await getGrades(activeClass);
    renderGradeRows();
  };

  const renderGradeRows = () => {
    const tbody = document.getElementById('grades-table-body');
    if (!tbody) return;

    const subjectFilter = selectSubject.value;
    const typeFilter = selectType.value;

    const filtered = allGrades.filter(g => {
      if (subjectFilter !== 'semua' && g.mata_pelajaran !== subjectFilter) return false;
      if (typeFilter !== 'semua' && g.jenis_penilaian !== typeFilter) return false;
      return true;
    });

    document.getElementById('badge-grades-count').textContent = `${filtered.length} Data`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2rem; color: #64748b;">
            Belum ada nilai yang tercatat untuk filter ini. Klik <strong>+ Input Nilai Siswa</strong> untuk menambah nilai baru.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(g => {
      const student = currentStudents.find(s => s.student_id === g.student_id) || {
        nis: '-',
        nama_siswa: 'Siswa Tidak Ditemukan'
      };

      return `
        <tr data-grade-id="${g.grade_id}">
          <td><input type="checkbox" class="check-single-grade" value="${g.grade_id}"></td>
          <td><strong>${student.nis}</strong></td>
          <td>
            <div style="font-weight: 600; color: #0f172a;">${student.nama_siswa}</div>
          </td>
          <td><span style="font-weight: 600; color: #1e3a8a;">${g.mata_pelajaran}</span></td>
          <td><span class="badge badge-neutral">${g.jenis_penilaian}</span></td>
          <td>
            <div>${g.nama_penilaian}</div>
            <div style="font-size: 0.75rem; color: #64748b;">${g.keterangan || '-'}</div>
          </td>
          <td style="text-align: center;">
            <strong style="font-size: 1.15rem; color: ${g.nilai >= 75 ? '#15803d' : '#b91c1c'};">${g.nilai}</strong>
          </td>
          <td>
            <span class="badge ${g.status_publikasi === 'dipublikasikan' ? 'badge-success' : 'badge-warning'}">
              ${g.status_publikasi === 'dipublikasikan' ? 'Dipublikasikan' : 'Draft'}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-outline btn-sm btn-edit-grade" data-id="${g.grade_id}">
              ✏️ Edit
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    document.querySelectorAll('.btn-edit-grade').forEach(btn => {
      btn.onclick = () => {
        const gradeId = btn.getAttribute('data-id');
        const grade = allGrades.find(g => g.grade_id === gradeId);
        if (grade) showAddOrEditGradeModal(grade);
      };
    });
  };

  // Checkbox All handler
  if (checkAll) {
    checkAll.onchange = () => {
      document.querySelectorAll('.check-single-grade').forEach(cb => {
        cb.checked = checkAll.checked;
      });
    };
  }

  // Batch Publish handler
  if (btnBatchPublish) {
    btnBatchPublish.onclick = async () => {
      const selectedIds = Array.from(document.querySelectorAll('.check-single-grade:checked')).map(cb => cb.value);
      if (selectedIds.length === 0) {
        toast.warning("Pilih minimal satu nilai yang ingin dipublikasikan.");
        return;
      }

      try {
        const res = await publishGrades(user, selectedIds, 'dipublikasikan');
        toast.success(res.message);
        loadData();
      } catch (e) {
        toast.error(e.message);
      }
    };
  }

  // Filter Button
  if (btnFilter) btnFilter.onclick = renderGradeRows;
  if (selectClass) selectClass.onchange = loadData;

  // Open Add Grade Modal
  if (btnOpenAdd) {
    btnOpenAdd.onclick = () => {
      showAddOrEditGradeModal(null);
    };
  }

  // Print Grades Report
  if (btnPrint) {
    btnPrint.onclick = async () => {
      const classLabel = activeClass === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';
      const subjectName = selectSubject.value === 'semua' ? 'Semua Mata Pelajaran' : selectSubject.value;

      const printRows = allGrades.map((g, idx) => {
        const student = currentStudents.find(s => s.student_id === g.student_id) || { nis: '-', nama_siswa: '-' };
        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="text-align: center;">${student.nis}</td>
            <td>${student.nama_siswa}</td>
            <td>${g.mata_pelajaran}</td>
            <td>${g.nama_penilaian}</td>
            <td style="text-align: center; font-weight: bold;">${g.nilai}</td>
            <td>${g.keterangan || '-'}</td>
          </tr>
        `;
      }).join('');

      const html = `
        <div style="margin-bottom: 12px;">
          <strong>Fokus:</strong> ${subjectName}
        </div>
        <table class="table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 40px;">No</th>
              <th style="width: 80px;">NIS</th>
              <th>Nama Siswa</th>
              <th>Mata Pelajaran</th>
              <th>Penilaian</th>
              <th style="width: 60px;">Nilai</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${printRows}
          </tbody>
        </table>
      `;

      await triggerPrintReport(`Rekapitulasi Penilaian Siswa`, classLabel, html);
    };
  }

  // Export CSV
  if (btnExport) {
    btnExport.onclick = () => {
      const exportRows = allGrades.map(g => {
        const student = currentStudents.find(s => s.student_id === g.student_id) || { nis: '', nama_siswa: '' };
        return {
          Kelas: activeClass === 'kelas_1' ? 'Kelas 1' : 'Kelas 6',
          NIS: student.nis,
          Nama_Siswa: student.nama_siswa,
          Mata_Pelajaran: g.mata_pelajaran,
          Jenis_Asesmen: g.jenis_penilaian,
          Nama_Penilaian: g.nama_penilaian,
          Nilai: g.nilai,
          Keterangan: g.keterangan || '',
          Status_Publikasi: g.status_publikasi
        };
      });

      exportToCSV(`Nilai_${activeClass}`, exportRows);
      toast.success("File CSV nilai berhasil diunduh!");
    };
  }

  // Initial load
  loadData();

  /**
   * Modal Input / Edit Nilai
   */
  function showAddOrEditGradeModal(gradeToEdit = null) {
    const slot = document.getElementById('grade-modal-slot');
    if (!slot) return;

    const isEdit = Boolean(gradeToEdit);
    const activeStudentsOnly = currentStudents.filter(s => s.status_aktif === 'aktif');

    slot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-header">
            <h3 class="card-title" style="margin: 0;">
              ${isEdit ? '✏️ Edit Nilai Siswa' : '➕ Input Nilai Siswa Baru'}
            </h3>
            <button class="btn btn-outline btn-sm" id="btn-close-grade-modal">✕</button>
          </div>
          <form id="form-save-grade" onsubmit="return false;">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Pilih Siswa *</label>
                <select id="modal-grade-student" class="form-select" required ${isEdit ? 'disabled' : ''}>
                  ${activeStudentsOnly.map(s => `
                    <option value="${s.student_id}" ${gradeToEdit && gradeToEdit.student_id === s.student_id ? 'selected' : ''}>
                      ${s.nis} - ${s.nama_siswa}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Mata Pelajaran *</label>
                  <select id="modal-grade-subject" class="form-select">
                    <option value="Pendidikan Pancasila" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'Pendidikan Pancasila' ? 'selected' : ''}>Pendidikan Pancasila</option>
                    <option value="Bahasa Indonesia" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'Bahasa Indonesia' ? 'selected' : ''}>Bahasa Indonesia</option>
                    <option value="Matematika" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'Matematika' ? 'selected' : ''}>Matematika</option>
                    <option value="Ilmu Pengetahuan Alam (IPA)" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'Ilmu Pengetahuan Alam (IPA)' ? 'selected' : ''}>Ilmu Pengetahuan Alam (IPA)</option>
                    <option value="PJOK" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'PJOK' ? 'selected' : ''}>PJOK</option>
                    <option value="Seni Budaya" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'Seni Budaya' ? 'selected' : ''}>Seni Budaya</option>
                    <option value="Bahasa Inggris" ${gradeToEdit && gradeToEdit.mata_pelajaran === 'Bahasa Inggris' ? 'selected' : ''}>Bahasa Inggris</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Jenis Asesmen *</label>
                  <select id="modal-grade-type" class="form-select">
                    <option value="Formatif" ${gradeToEdit && gradeToEdit.jenis_penilaian === 'Formatif' ? 'selected' : ''}>Formatif (Tugas/Kuis)</option>
                    <option value="Sumatif Lingkup Materi" ${gradeToEdit && gradeToEdit.jenis_penilaian === 'Sumatif Lingkup Materi' ? 'selected' : ''}>Sumatif Lingkup Materi</option>
                    <option value="Sumatif Akhir Semester" ${gradeToEdit && gradeToEdit.jenis_penilaian === 'Sumatif Akhir Semester' ? 'selected' : ''}>Sumatif Akhir Semester (SAS)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nama Asesmen / Materi *</label>
                  <input type="text" id="modal-grade-name" class="form-input" required placeholder="Contoh: Operasi Bilangan Bulat" value="${gradeToEdit ? gradeToEdit.nama_penilaian : ''}">
                </div>

                <div class="form-group">
                  <label class="form-label">Nilai (0 - 100) *</label>
                  <input type="number" id="modal-grade-score" class="form-input" required min="0" max="100" placeholder="85" value="${gradeToEdit ? gradeToEdit.nilai : ''}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Status Publikasi</label>
                <select id="modal-grade-status" class="form-select">
                  <option value="draft" ${gradeToEdit && gradeToEdit.status_publikasi === 'draft' ? 'selected' : ''}>Draft (Hanya Guru & Admin)</option>
                  <option value="dipublikasikan" ${gradeToEdit && gradeToEdit.status_publikasi === 'dipublikasikan' ? 'selected' : ''}>Dipublikasikan (Dapat dicek Siswa/Wali)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Catatan Guru / Keterangan Capaian</label>
                <textarea id="modal-grade-notes" class="form-textarea" rows="2" placeholder="Contoh: Sangat baik dalam memahami konsep perkalian...">${gradeToEdit ? gradeToEdit.keterangan || '' : ''}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="btn-cancel-grade-modal">Batal</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-grade">
                ${isEdit ? 'Simpan Perubahan' : 'Simpan Nilai Siswa →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { slot.innerHTML = ''; };
    document.getElementById('btn-close-grade-modal').onclick = closeModal;
    document.getElementById('btn-cancel-grade-modal').onclick = closeModal;

    const form = document.getElementById('form-save-grade');
    form.onsubmit = async () => {
      const studentId = document.getElementById('modal-grade-student').value;
      const subject = document.getElementById('modal-grade-subject').value;
      const type = document.getElementById('modal-grade-type').value;
      const name = document.getElementById('modal-grade-name').value.trim();
      const score = document.getElementById('modal-grade-score').value;
      const pubStatus = document.getElementById('modal-grade-status').value;
      const notes = document.getElementById('modal-grade-notes').value.trim();

      const btnSubmit = document.getElementById('btn-submit-grade');
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Menyimpan...';

      try {
        const payload = {
          grade_id: gradeToEdit ? gradeToEdit.grade_id : null,
          student_id: studentId,
          kelas_id: activeClass,
          mata_pelajaran: subject,
          jenis_penilaian: type,
          nama_penilaian: name,
          nilai: Number(score),
          status_publikasi: pubStatus,
          keterangan: notes
        };

        const res = await saveGrade(user, payload);
        toast.success(res.message);
        closeModal();
        loadData();
      } catch (err) {
        toast.error(err.message || 'Gagal menyimpan nilai.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = isEdit ? 'Simpan Perubahan' : 'Simpan Nilai Siswa →';
      }
    };
  }
}
