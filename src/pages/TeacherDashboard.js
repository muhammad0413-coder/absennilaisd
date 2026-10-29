/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * DASHBOARD GURU (KELAS 1 ATAU KELAS 6) (src/pages/TeacherDashboard.js)
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { 
  getStudents, 
  saveStudent, 
  deactivateStudent, 
  reactivateStudent, 
  getAttendance, 
  getGrades, 
  getTeacherProfile 
} from '../services.js';
import { toast } from '../components/Toast.js';
import { showConfirmModal } from '../components/Modal.js';

export async function renderTeacherDashboard() {
  const user = getCurrentUser();
  const classId = user.kelas_id;
  const classLabel = classId === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';

  const teacher = await getTeacherProfile(user.teacher_id) || {
    nama_guru: user.displayName,
    foto_url: "",
    nomor_telepon: "-"
  };

  const students = await getStudents(classId);
  const activeStudents = students.filter(s => s.status_aktif === 'aktif');
  const inactiveStudents = students.filter(s => s.status_aktif === 'nonaktif');

  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = await getAttendance(classId, todayStr);
  const grades = await getGrades(classId);

  return `
    <div class="page-content">
      <!-- Banner Guru Kelas -->
      <div class="card" style="background: linear-gradient(135deg, #1e3a8a, #0284c7); color: white; border: none; padding: 1.75rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1.25rem;">
            <div style="width: 72px; height: 72px; border-radius: 50%; overflow: hidden; background: white; border: 3px solid rgba(255,255,255,0.4); flex-shrink: 0;">
              ${teacher.foto_url 
                ? `<img src="${teacher.foto_url}" alt="${teacher.nama_guru}" style="width: 100%; height: 100%; object-fit: cover;">`
                : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">👩‍🏫</div>`
              }
            </div>
            <div>
              <span class="badge" style="background: rgba(255,255,255,0.2); color: white; margin-bottom: 0.35rem;">
                Wali ${classLabel}
              </span>
              <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; line-height: 1.2;">
                ${teacher.nama_guru}
              </h2>
              <p style="font-size: 0.85rem; opacity: 0.9; margin: 4px 0 0 0;">
                Tahun Ajaran: 2026/2027 | Semester 1 (Ganjil)
              </p>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <a href="#profile" class="btn btn-outline btn-sm" style="background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.3);">
              👤 Ganti Foto & Profil
            </a>
            <button class="btn btn-success btn-sm" id="btn-open-add-student">
              ➕ Tambah Siswa Baru
            </button>
          </div>
        </div>
      </div>

      <!-- Kartu Ringkasan -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">👥</div>
          <div>
            <div class="stat-val">${activeStudents.length}</div>
            <div class="stat-label">Siswa Aktif ${classLabel}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">📅</div>
          <div>
            <div class="stat-val">${todayAttendance.length} / ${activeStudents.length}</div>
            <div class="stat-label">Absensi Hari Ini</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">📝</div>
          <div>
            <div class="stat-val">${grades.length}</div>
            <div class="stat-label">Total Nilai Tercatat</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon amber">⚠️</div>
          <div>
            <div class="stat-val">${inactiveStudents.length}</div>
            <div class="stat-label">Siswa Nonaktif / Pindah</div>
          </div>
        </div>
      </div>

      <!-- Quick Action Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <a href="#attendance" class="card" style="padding: 1.1rem; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0;">
          <div class="stat-icon green" style="width: 42px; height: 42px; font-size: 1.3rem;">✓</div>
          <div>
            <strong style="display: block; font-size: 0.92rem; color: #0f172a;">Input Absensi</strong>
            <span style="font-size: 0.78rem; color: #64748b;">Isi presensi siswa ${classLabel}</span>
          </div>
        </a>

        <a href="#grades" class="card" style="padding: 1.1rem; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0;">
          <div class="stat-icon purple" style="width: 42px; height: 42px; font-size: 1.3rem;">📝</div>
          <div>
            <strong style="display: block; font-size: 0.92rem; color: #0f172a;">Input Nilai</strong>
            <span style="font-size: 0.78rem; color: #64748b;">Formatif & Sumatif</span>
          </div>
        </a>

        <a href="#reports" class="card" style="padding: 1.1rem; text-decoration: none; color: inherit; display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0;">
          <div class="stat-icon blue" style="width: 42px; height: 42px; font-size: 1.3rem;">🖨️</div>
          <div>
            <strong style="display: block; font-size: 0.92rem; color: #0f172a;">Cetak Laporan</strong>
            <span style="font-size: 0.78rem; color: #64748b;">Format A4/F4 resmi</span>
          </div>
        </a>
      </div>

      <!-- Tabel Daftar Siswa Kelas -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span>👥 Daftar Siswa ${classLabel}</span>
            <span class="badge badge-info" style="font-size: 0.75rem;">${students.length} Siswa</span>
          </h3>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input type="text" id="input-search-student" class="form-input" placeholder="Cari Nama / NIS..." style="width: 220px; padding: 0.4rem 0.75rem; font-size: 0.85rem;">
            <select id="select-status-filter" class="form-select" style="width: 130px; padding: 0.4rem 0.75rem; font-size: 0.85rem;">
              <option value="aktif">Siswa Aktif</option>
              <option value="nonaktif">Nonaktif / Keluar</option>
              <option value="semua">Semua Status</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-students-list">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>NIS</th>
                <th>NISN</th>
                <th>Nama Siswa</th>
                <th>L/P</th>
                <th>Nama & No. Wali</th>
                <th>Status</th>
                <th style="text-align: right;">Aksi</th>
              </tr>
            </thead>
            <tbody id="student-table-body">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Tambah / Edit Siswa -->
    <div id="add-student-modal-slot"></div>
    <!-- Modal Nonaktifkan Siswa -->
    <div id="deactivate-student-modal-slot"></div>
  `;
}

export function attachTeacherDashboardEvents() {
  const user = getCurrentUser();
  const classId = user.kelas_id;
  const classLabel = classId === 'kelas_1' ? 'Kelas 1' : 'Kelas 6';

  let currentStudents = [];

  const loadAndRenderTable = async () => {
    currentStudents = await getStudents(classId);
    renderTableRows();
  };

  const renderTableRows = () => {
    const tbody = document.getElementById('student-table-body');
    if (!tbody) return;

    const searchTerm = (document.getElementById('input-search-student')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('select-status-filter')?.value || 'aktif';

    const filtered = currentStudents.filter(s => {
      const matchSearch = s.nama_siswa.toLowerCase().includes(searchTerm) || String(s.nis).includes(searchTerm);
      const matchStatus = statusFilter === 'semua' || s.status_aktif === statusFilter;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">
            Tidak ditemukan siswa dengan kriteria pencarian tersebut.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((s, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.nis}</strong></td>
        <td>${s.nisn || '-'}</td>
        <td>
          <div style="font-weight: 600; color: #0f172a;">${s.nama_siswa}</div>
          <div style="font-size: 0.75rem; color: #64748b;">${s.alamat || '-'}</div>
        </td>
        <td><span class="badge ${s.jenis_kelamin === 'L' ? 'badge-info' : 'badge-neutral'}">${s.jenis_kelamin}</span></td>
        <td>
          <div style="font-size: 0.85rem;">${s.nama_wali || '-'}</div>
          <div style="font-size: 0.75rem; color: #64748b;">${s.nomor_wali || '-'}</div>
        </td>
        <td>
          <span class="badge ${s.status_aktif === 'aktif' ? 'badge-success' : 'badge-danger'}">
            ${s.status_aktif === 'aktif' ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          ${s.status_aktif === 'aktif' ? `
            <button class="btn btn-outline btn-sm btn-edit-student" data-id="${s.student_id}">
              ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm btn-deactivate-student" data-id="${s.student_id}" data-name="${s.nama_siswa}" title="Nonaktifkan / Keluarkan Siswa">
              🚫 Keluarkan
            </button>
          ` : `
            <button class="btn btn-success btn-sm btn-reactivate-student" data-id="${s.student_id}">
              ♻️ Aktifkan Kembali
            </button>
          `}
        </td>
      </tr>
    `).join('');

    // Attach row events
    attachRowActionEvents();
  };

  const attachRowActionEvents = () => {
    // Edit Student
    document.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.onclick = () => {
        const studentId = btn.getAttribute('data-id');
        const student = currentStudents.find(s => s.student_id === studentId);
        if (student) showAddOrEditStudentModal(student);
      };
    });

    // Deactivate Student with Reason Modal (Soft Delete)
    document.querySelectorAll('.btn-deactivate-student').forEach(btn => {
      btn.onclick = () => {
        const studentId = btn.getAttribute('data-id');
        const studentName = btn.getAttribute('data-name');
        showDeactivateModal(studentId, studentName);
      };
    });

    // Reactivate Student
    document.querySelectorAll('.btn-reactivate-student').forEach(btn => {
      btn.onclick = async () => {
        const studentId = btn.getAttribute('data-id');
        try {
          const res = await reactivateStudent(user, studentId, "Diaktifkan kembali oleh Guru");
          toast.success(res.message);
          loadAndRenderTable();
        } catch (e) {
          toast.error(e.message);
        }
      };
    });
  };

  // Search and Filter Listeners
  const searchInput = document.getElementById('input-search-student');
  const statusSelect = document.getElementById('select-status-filter');
  if (searchInput) searchInput.oninput = renderTableRows;
  if (statusSelect) statusSelect.onchange = renderTableRows;

  // Open Add Student Modal
  const btnOpenAdd = document.getElementById('btn-open-add-student');
  if (btnOpenAdd) {
    btnOpenAdd.onclick = () => {
      showAddOrEditStudentModal(null);
    };
  }

  // Initial load
  loadAndRenderTable();

  /**
   * Modal Tambah atau Edit Siswa
   * Kelas dikunci otomatis sesuai hak akses guru!
   */
  function showAddOrEditStudentModal(studentToEdit = null) {
    const slot = document.getElementById('add-student-modal-slot');
    if (!slot) return;

    const isEdit = Boolean(studentToEdit);

    slot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 550px;">
          <div class="modal-header">
            <h3 class="card-title" style="margin: 0;">
              ${isEdit ? '✏️ Edit Data Siswa' : `➕ Tambah Siswa Baru ${classLabel}`}
            </h3>
            <button class="btn btn-outline btn-sm" id="btn-close-student-modal">✕</button>
          </div>
          <form id="form-student-save" onsubmit="return false;">
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">NIS (Wajib & Unik) *</label>
                  <input type="text" id="std-nis" class="form-input" required placeholder="Contoh: 1005" value="${studentToEdit ? studentToEdit.nis : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">NISN (Opsional)</label>
                  <input type="text" id="std-nisn" class="form-input" placeholder="10 Digit NISN" value="${studentToEdit ? studentToEdit.nisn : ''}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nama Lengkap Siswa *</label>
                <input type="text" id="std-nama" class="form-input" required placeholder="Nama lengkap siswa" value="${studentToEdit ? studentToEdit.nama_siswa : ''}">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Kelas Terdaftar</label>
                  <input type="text" class="form-input" value="${classLabel} (Otomatis Dikunci)" disabled style="background: #f1f5f9; font-weight: bold; color: #1e3a8a;">
                </div>
                <div class="form-group">
                  <label class="form-label">Jenis Kelamin *</label>
                  <select id="std-jk" class="form-select">
                    <option value="L" ${studentToEdit && studentToEdit.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki (L)</option>
                    <option value="P" ${studentToEdit && studentToEdit.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tempat Lahir</label>
                  <input type="text" id="std-tempat-lahir" class="form-input" placeholder="Kota lahir" value="${studentToEdit ? studentToEdit.tempat_lahir || '' : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Tanggal Lahir</label>
                  <input type="date" id="std-tanggal-lahir" class="form-input" value="${studentToEdit ? studentToEdit.tanggal_lahir || '' : ''}">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nama Orang Tua / Wali</label>
                  <input type="text" id="std-wali-nama" class="form-input" placeholder="Nama ayah/ibu/wali" value="${studentToEdit ? studentToEdit.nama_wali || '' : ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Nomor WhatsApp / HP Wali</label>
                  <input type="tel" id="std-wali-hp" class="form-input" placeholder="08xxxxxxxxxx" value="${studentToEdit ? studentToEdit.nomor_wali || '' : ''}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Alamat Lengkap</label>
                <textarea id="std-alamat" class="form-textarea" rows="2" placeholder="Alamat tempat tinggal">${studentToEdit ? studentToEdit.alamat || '' : ''}</textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" id="btn-cancel-student">Batal</button>
              <button type="submit" class="btn btn-primary" id="btn-save-student-submit">
                ${isEdit ? 'Simpan Perubahan' : 'Daftarkan Siswa →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeModal = () => { slot.innerHTML = ''; };
    document.getElementById('btn-close-student-modal').onclick = closeModal;
    document.getElementById('btn-cancel-student').onclick = closeModal;

    const form = document.getElementById('form-student-save');
    form.onsubmit = async () => {
      const nis = document.getElementById('std-nis').value.trim();
      const nama = document.getElementById('std-nama').value.trim();
      const nisn = document.getElementById('std-nisn').value.trim();
      const jk = document.getElementById('std-jk').value;
      const tempatLahir = document.getElementById('std-tempat-lahir').value.trim();
      const tanggalLahir = document.getElementById('std-tanggal-lahir').value;
      const namaWali = document.getElementById('std-wali-nama').value.trim();
      const nomorWali = document.getElementById('std-wali-hp').value.trim();
      const alamat = document.getElementById('std-alamat').value.trim();

      const submitBtn = document.getElementById('btn-save-student-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Menyimpan...';

      try {
        const studentPayload = {
          student_id: studentToEdit ? studentToEdit.student_id : null,
          nis: nis,
          nisn: nisn,
          nama_siswa: nama,
          kelas_id: classId, // Locked to teacher's class
          jenis_kelamin: jk,
          tempat_lahir: tempatLahir,
          tanggal_lahir: tanggalLahir,
          nama_wali: namaWali,
          nomor_wali: nomorWali,
          alamat: alamat
        };

        const res = await saveStudent(user, studentPayload);
        toast.success(res.message);
        closeModal();
        loadAndRenderTable();
      } catch (err) {
        toast.error(err.message || 'Gagal menyimpan siswa.');
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? 'Simpan Perubahan' : 'Daftarkan Siswa →';
      }
    };
  }

  /**
   * Modal Nonaktifkan Siswa dengan Alasan Wajib (Soft Deletion)
   */
  function showDeactivateModal(studentId, studentName) {
    const slot = document.getElementById('deactivate-student-modal-slot');
    if (!slot) return;

    slot.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="card-title" style="margin: 0; color: #dc2626;">🚫 Keluarkan / Nonaktifkan Siswa</h3>
            <button class="btn btn-outline btn-sm" id="btn-close-deactivate">✕</button>
          </div>
          <div class="modal-body">
            <div style="padding: 0.85rem; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; margin-bottom: 1rem;">
              <p style="font-size: 0.9rem; color: #991b1b; margin: 0; font-weight: 600;">
                Anda akan menonaktifkan: <u>${studentName}</u> dari ${classLabel}.
              </p>
              <p style="font-size: 0.8rem; color: #b91c1c; margin: 4px 0 0 0;">
                ℹ️ Mekanisme Aman: Seluruh riwayat absensi dan nilai siswa TIDAK AKAN DIHAPUS dan tetap dapat dipulihkan kapan saja.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Alasan Penonaktifan (Wajib Dicatat) *</label>
              <select id="select-deactivate-reason" class="form-select" style="margin-bottom: 0.5rem;">
                <option value="Pindah Sekolah / Mutasi Keluar">Pindah Sekolah / Mutasi Keluar</option>
                <option value="Kenaikan Kelas / Mutasi Administratif">Kenaikan Kelas / Mutasi Administratif</option>
                <option value="Mengundurkan Diri">Mengundurkan Diri</option>
                <option value="Lainnya">Lainnya (Tuliskan rincian di bawah)</option>
              </select>
              <textarea id="text-deactivate-detail" class="form-textarea" rows="2" placeholder="Rincian alasan atau nomor surat mutasi (jika ada)..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="btn-cancel-deactivate">Batal</button>
            <button class="btn btn-danger" id="btn-confirm-deactivate">Konfirmasi Nonaktifkan Siswa</button>
          </div>
        </div>
      </div>
    `;

    const closeDeactivate = () => { slot.innerHTML = ''; };
    document.getElementById('btn-close-deactivate').onclick = closeDeactivate;
    document.getElementById('btn-cancel-deactivate').onclick = closeDeactivate;

    document.getElementById('btn-confirm-deactivate').onclick = async () => {
      const selectReason = document.getElementById('select-deactivate-reason').value;
      const detailReason = document.getElementById('text-deactivate-detail').value.trim();
      const finalReason = detailReason ? `${selectReason}: ${detailReason}` : selectReason;

      try {
        const res = await deactivateStudent(user, studentId, finalReason);
        toast.success(res.message);
        closeDeactivate();
        loadAndRenderTable();
      } catch (err) {
        toast.error(err.message || 'Gagal menonaktifkan siswa.');
      }
    };
  }
}
