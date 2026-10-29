/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * DATA INDUK SISWA (src/pages/StudentsPage.js)
 * ==============================================================================
 * Fitur:
 * 1. Guru Kelas dan Admin dapat MENAMBAH siswa baru secara langsung di website
 * 2. Guru Kelas dan Admin dapat MENGEDIT identitas siswa (Nama, NIS, NISN, Orang Tua, dll.)
 * 3. Filter per tingkat kelas (1–6) dan status siswa (Aktif / Pindah / Lulus)
 * 4. Sinkronisasi dengan Google Sheets, ekspor CSV, dan cetak dokumen resmi
 * ==============================================================================
 */

import { getCurrentUser } from '../auth.js';
import { isAdmin, isHeadmaster, isTeacher, CLASS_LABELS } from '../permissions.js';
import { getStudents, searchStudents, saveStudent, deactivateStudent, syncStudentsFromGoogleSheets } from '../services.js';
import { exportToCSV, triggerPrintReport } from '../components/ReportPrint.js';
import { toast } from '../components/Toast.js';

export async function renderStudentsPage() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);
  const defaultClass = userIsGuru ? user.kelas_id : 'semua';
  const classLabel = userIsGuru ? CLASS_LABELS[user.kelas_id] : 'Seluruh Jenjang Kelas (1–6)';

  return `
    <div class="page-content">
      <!-- Header Data Siswa -->
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="card-title">👥 Data Induk Siswa (${classLabel})</h2>
            <p style="font-size: 0.85rem; color: #64748b; margin: 4px 0 0 0;">
              Kelola data peserta didik kelas. Anda dapat menambahkan siswa baru, mengubah data, mengekspor ke spreadsheet, atau mencetak lembar roster resmi.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;" class="no-print">
            <button class="btn btn-primary" id="btn-open-add-student" style="font-weight: 700;">
              ➕ Tambah Siswa Baru
            </button>
            <button class="btn btn-outline btn-sm" id="btn-sync-students-now" title="Tarik pembaruan dari Google Sheets (Data_Siswa)">
              🔄 Tarik dari Google Sheets
            </button>
            <button class="btn btn-outline btn-sm" id="btn-export-students-csv">
              📥 Ekspor CSV
            </button>
            <button class="btn btn-primary btn-sm" id="btn-print-students-list">
              🖨️ Cetak Roster
            </button>
          </div>
        </div>

        <!-- Filter Kelas, Status, & Pencarian -->
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; margin-top: 1rem;" class="no-print">
          <div style="flex: 1; min-width: 180px;">
            <label class="form-label">Tingkat Kelas</label>
            <select id="select-filter-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
              ${!userIsGuru ? '<option value="semua">Semua Kelas (1–6)</option>' : ''}
              <option value="kelas_1" ${defaultClass === 'kelas_1' ? 'selected' : ''}>Kelas 1 (Fase A)</option>
              <option value="kelas_2" ${defaultClass === 'kelas_2' ? 'selected' : ''}>Kelas 2 (Fase A)</option>
              <option value="kelas_3" ${defaultClass === 'kelas_3' ? 'selected' : ''}>Kelas 3 (Fase B)</option>
              <option value="kelas_4" ${defaultClass === 'kelas_4' ? 'selected' : ''}>Kelas 4 (Fase B)</option>
              <option value="kelas_5" ${defaultClass === 'kelas_5' ? 'selected' : ''}>Kelas 5 (Fase C)</option>
              <option value="kelas_6" ${defaultClass === 'kelas_6' ? 'selected' : ''}>Kelas 6 (Fase C)</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <label class="form-label">Status Siswa</label>
            <select id="select-filter-status" class="form-select">
              <option value="Aktif" selected>Siswa Aktif</option>
              <option value="Pindah">Siswa Pindah / Mutasi</option>
              <option value="Lulus">Siswa Lulus</option>
              <option value="semua">Semua Status</option>
            </select>
          </div>

          <div style="flex: 2; min-width: 220px;">
            <label class="form-label">Pencarian Nama / NIS / NISN</label>
            <input type="text" id="input-search-student-master" class="form-input" placeholder="Ketik nama atau nomor induk siswa...">
          </div>
        </div>
      </div>

      <!-- Tabel Data Siswa -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <span>Daftar Siswa Terdaftar</span>
            <span class="badge badge-info" id="badge-total-students">0 Siswa</span>
          </h3>
          <span style="font-size: 0.78rem; color: #64748b;">Database Siswa SDN Kesilir 02</span>
        </div>

        <div class="table-responsive">
          <table class="table" id="table-students-master" style="font-size: 0.85rem;">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th style="width: 75px;">NIS</th>
                <th style="width: 95px;">NISN</th>
                <th>Nama Lengkap Siswa</th>
                <th style="width: 60px; text-align: center;">Kls</th>
                <th style="width: 50px; text-align: center;">L/P</th>
                <th>Tempat, Tgl Lahir</th>
                <th>Nama Orang Tua / Wali</th>
                <th>Alamat</th>
                <th style="width: 80px; text-align: center;">Status</th>
                <th style="width: 120px; text-align: center;" class="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody id="students-master-tbody">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- SLOT MODAL TAMBAH / EDIT SISWA -->
      <div id="modal-student-form-slot"></div>
    </div>
  `;
}

export function attachStudentsEvents() {
  const user = getCurrentUser();
  const userIsGuru = isTeacher(user);

  const selectClass = document.getElementById('select-filter-class');
  const selectStatus = document.getElementById('select-filter-status');
  const searchInput = document.getElementById('input-search-student-master');
  const btnExport = document.getElementById('btn-export-students-csv');
  const btnPrint = document.getElementById('btn-print-students-list');
  const btnAdd = document.getElementById('btn-open-add-student');
  const modalSlot = document.getElementById('modal-student-form-slot');

  let currentList = [];

  const loadData = async () => {
    const kelas = userIsGuru ? user.kelas_id : (selectClass ? selectClass.value : 'semua');
    const status = selectStatus ? selectStatus.value : 'Aktif';
    const query = searchInput ? searchInput.value.trim() : '';

    const filterClassVal = kelas === 'semua' ? null : kelas;
    const all = await searchStudents(query, filterClassVal);

    currentList = all.filter(s => status === 'semua' || s.Status_Siswa === status);
    renderTable();
  };

  const renderTable = () => {
    const tbody = document.getElementById('students-master-tbody');
    const badgeCount = document.getElementById('badge-total-students');
    if (!tbody) return;

    badgeCount.textContent = `${currentList.length} Siswa`;

    if (currentList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍🎓</div>
            <strong>Belum ada siswa terdaftar pada kelas ini.</strong>
            <p style="font-size: 0.8rem; margin: 4px 0 0 0;">Tekan tombol "➕ Tambah Siswa Baru" di atas untuk menambahkan siswa langsung.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = currentList.map((s, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${s.NIS}</strong></td>
        <td>${s.NISN || '-'}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${s.Nama_Lengkap}</div>
          ${s.Nomor_Wali ? `<span style="font-size: 0.72rem; color: #0284c7;">📱 ${s.Nomor_Wali}</span>` : ''}
        </td>
        <td style="text-align: center;"><span class="badge badge-info">K${s.Kelas}</span></td>
        <td style="text-align: center; font-weight: 600;">${s.Jenis_Kelamin === 'P' ? 'P' : 'L'}</td>
        <td style="font-size: 0.8rem; color: #475569;">${s.Tempat_Lahir || '-'}, ${s.Tanggal_Lahir || '-'}</td>
        <td>${s.Nama_Orang_Tua || '-'}</td>
        <td style="font-size: 0.8rem; color: #64748b;">${s.Alamat || '-'}</td>
        <td style="text-align: center;">
          <span class="badge ${s.Status_Siswa === 'Aktif' ? 'badge-success' : 'badge-neutral'}">
            ${s.Status_Siswa}
          </span>
        </td>
        <td style="text-align: center;" class="no-print">
          <div style="display: flex; gap: 0.35rem; justify-content: center;">
            <button class="btn btn-outline btn-sm btn-edit-student" data-id="${s.ID_Siswa}" title="Edit Data Siswa" style="padding: 2px 7px; font-size: 0.75rem;">
              ✏️ Edit
            </button>
            <button class="btn btn-outline btn-sm btn-deactivate-student" data-id="${s.ID_Siswa}" data-name="${s.Nama_Lengkap}" title="Mutasi / Nonaktifkan" style="padding: 2px 7px; font-size: 0.75rem; color: #dc2626; border-color: #fca5a5;">
              Mutasi
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach row action listeners
    document.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const student = currentList.find(s => s.ID_Siswa === id);
        if (student) openStudentFormModal(student);
      };
    });

    document.querySelectorAll('.btn-deactivate-student').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (confirm(`Apakah Anda yakin ingin mengubah status siswa "${name}" menjadi Pindah/Mutasi?`)) {
          try {
            await deactivateStudent(user, id, "Pindah");
            toast.success(`Status ${name} berhasil diubah menjadi Pindah.`);
            await loadData();
          } catch (e) {
            toast.error(e.message || "Gagal mengubah status siswa.");
          }
        }
      };
    });
  };

  // Open Modal Tambah / Edit Siswa
  const openStudentFormModal = (studentToEdit = null) => {
    if (!modalSlot) return;
    const isEdit = Boolean(studentToEdit);
    const defaultStudentClass = studentToEdit 
      ? `kelas_${studentToEdit.Kelas}` 
      : (userIsGuru ? user.kelas_id : (selectClass && selectClass.value !== 'semua' ? selectClass.value : 'kelas_1'));

    modalSlot.innerHTML = `
      <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <div class="modal-content" style="background: white; border-radius: 16px; max-width: 550px; width: 100%; padding: 1.75rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">👨‍🎓</span>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0;">
                ${isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
            </div>
            <button id="btn-close-student-modal" style="background: none; border: none; font-size: 1.3rem; color: #94a3b8; cursor: pointer;">✕</button>
          </div>

          <form id="form-save-student" onsubmit="return false;">
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">NIS (Nomor Induk Siswa) *</label>
                <input type="text" id="std-nis" class="form-input" required placeholder="Contoh: 5011" value="${studentToEdit ? studentToEdit.NIS : ''}">
              </div>
              <div class="form-group" style="flex: 1;">
                <label class="form-label">NISN (10 Digit)</label>
                <input type="text" id="std-nisn" class="form-input" placeholder="0141235011" value="${studentToEdit ? (studentToEdit.NISN || '') : ''}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Lengkap Siswa Sesuai Akta *</label>
              <input type="text" id="std-name" class="form-input" required placeholder="Contoh: MUHAMMAD RIZKY PRATAMA" value="${studentToEdit ? studentToEdit.Nama_Lengkap : ''}">
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Tingkat Kelas *</label>
                <select id="std-class" class="form-select" ${userIsGuru ? 'disabled' : ''}>
                  <option value="1" ${defaultStudentClass === 'kelas_1' || defaultStudentClass === '1' ? 'selected' : ''}>Kelas 1</option>
                  <option value="2" ${defaultStudentClass === 'kelas_2' || defaultStudentClass === '2' ? 'selected' : ''}>Kelas 2</option>
                  <option value="3" ${defaultStudentClass === 'kelas_3' || defaultStudentClass === '3' ? 'selected' : ''}>Kelas 3</option>
                  <option value="4" ${defaultStudentClass === 'kelas_4' || defaultStudentClass === '4' ? 'selected' : ''}>Kelas 4</option>
                  <option value="5" ${defaultStudentClass === 'kelas_5' || defaultStudentClass === '5' ? 'selected' : ''}>Kelas 5</option>
                  <option value="6" ${defaultStudentClass === 'kelas_6' || defaultStudentClass === '6' ? 'selected' : ''}>Kelas 6</option>
                </select>
              </div>

              <div class="form-group" style="flex: 1;">
                <label class="form-label">Jenis Kelamin *</label>
                <select id="std-gender" class="form-select">
                  <option value="L" ${!studentToEdit || studentToEdit.Jenis_Kelamin === 'L' || studentToEdit.Jenis_Kelamin === 'Laki-laki' ? 'selected' : ''}>Laki-laki (L)</option>
                  <option value="P" ${studentToEdit && (studentToEdit.Jenis_Kelamin === 'P' || studentToEdit.Jenis_Kelamin === 'Perempuan') ? 'selected' : ''}>Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Tempat Lahir</label>
                <input type="text" id="std-pob" class="form-input" placeholder="Jember" value="${studentToEdit ? (studentToEdit.Tempat_Lahir || '') : 'Jember'}">
              </div>
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Tanggal Lahir</label>
                <input type="date" id="std-dob" class="form-input" value="${studentToEdit ? (studentToEdit.Tanggal_Lahir || '') : ''}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Nama Orang Tua / Wali</label>
                <input type="text" id="std-parent" class="form-input" placeholder="Nama ayah / ibu / wali" value="${studentToEdit ? (studentToEdit.Nama_Orang_Tua || '') : ''}">
              </div>
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Nomor WhatsApp / HP Wali</label>
                <input type="tel" id="std-phone" class="form-input" placeholder="08xxxxxxxxxx" value="${studentToEdit ? (studentToEdit.Nomor_Wali || '') : ''}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Alamat Tempat Tinggal</label>
              <textarea id="std-address" class="form-textarea" rows="2" placeholder="Dusun, RT/RW, Desa, Kecamatan">${studentToEdit ? (studentToEdit.Alamat || '') : 'Dsn. Tegal Baru, Kesilir, Wuluhan'}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Status Siswa</label>
              <select id="std-status" class="form-select">
                <option value="Aktif" ${!studentToEdit || studentToEdit.Status_Siswa === 'Aktif' ? 'selected' : ''}>Aktif</option>
                <option value="Pindah" ${studentToEdit && studentToEdit.Status_Siswa === 'Pindah' ? 'selected' : ''}>Pindah / Mutasi</option>
                <option value="Lulus" ${studentToEdit && studentToEdit.Status_Siswa === 'Lulus' ? 'selected' : ''}>Lulus</option>
              </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 1.25rem;">
              <button type="button" class="btn btn-outline" id="btn-cancel-student">Batal</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-student" style="font-weight: 700;">
                💾 ${isEdit ? 'Simpan Perubahan Siswa' : 'Tambahkan Siswa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const closeStudentModal = () => { modalSlot.innerHTML = ''; };
    document.getElementById('btn-close-student-modal').onclick = closeStudentModal;
    document.getElementById('btn-cancel-student').onclick = closeStudentModal;

    document.getElementById('form-save-student').onsubmit = async () => {
      const nisVal = document.getElementById('std-nis').value.trim();
      const nisnVal = document.getElementById('std-nisn').value.trim();
      const nameVal = document.getElementById('std-name').value.trim();
      const classSelect = document.getElementById('std-class');
      const classVal = classSelect ? classSelect.value : (userIsGuru ? user.kelas_id.replace('kelas_', '') : '1');
      const genderVal = document.getElementById('std-gender').value;
      const pobVal = document.getElementById('std-pob').value.trim();
      const dobVal = document.getElementById('std-dob').value;
      const parentVal = document.getElementById('std-parent').value.trim();
      const phoneVal = document.getElementById('std-phone').value.trim();
      const addrVal = document.getElementById('std-address').value.trim();
      const statusVal = document.getElementById('std-status').value;

      if (!nisVal || !nameVal) {
        toast.warning("NIS dan Nama Lengkap siswa wajib diisi.");
        return;
      }

      const submitBtn = document.getElementById('btn-submit-student');
      submitBtn.disabled = true;
      submitBtn.textContent = "Menyimpan...";

      try {
        await saveStudent(user, {
          ID_Siswa: studentToEdit ? studentToEdit.ID_Siswa : null,
          NIS: nisVal,
          NISN: nisnVal,
          Nama_Lengkap: nameVal,
          Kelas: classVal,
          Jenis_Kelamin: genderVal,
          Tempat_Lahir: pobVal,
          Tanggal_Lahir: dobVal,
          Nama_Orang_Tua: parentVal,
          Nomor_Wali: phoneVal,
          Alamat: addrVal,
          Status_Siswa: statusVal
        });

        toast.success(isEdit ? `Data ${nameVal} berhasil diperbarui!` : `Siswa baru ${nameVal} berhasil ditambahkan!`);
        closeStudentModal();
        await loadData();
      } catch (err) {
        toast.error(err.message || "Gagal menyimpan data siswa.");
        submitBtn.disabled = false;
        submitBtn.textContent = "💾 Simpan Siswa";
      }
    };
  };

  if (btnAdd) {
    btnAdd.onclick = () => openStudentFormModal(null);
  }

  if (selectClass) selectClass.onchange = loadData;
  if (selectStatus) selectStatus.onchange = loadData;
  if (searchInput) searchInput.oninput = loadData;

  // Cetak Daftar Roster Siswa
  if (btnPrint) {
    btnPrint.onclick = async () => {
      const kelasLabel = userIsGuru ? CLASS_LABELS[user.kelas_id] : (selectClass ? selectClass.options[selectClass.selectedIndex].text : 'Seluruh Siswa');
      const tableRowsHtml = currentList.map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${s.NIS}</td>
          <td style="text-align: center;">${s.NISN || '-'}</td>
          <td>${s.Nama_Lengkap}</td>
          <td style="text-align: center;">${s.Kelas}</td>
          <td style="text-align: center;">${s.Jenis_Kelamin === 'P' ? 'P' : 'L'}</td>
          <td>${s.Tempat_Lahir || '-'}, ${s.Tanggal_Lahir || '-'}</td>
          <td>${s.Nama_Orang_Tua || '-'}</td>
          <td style="text-align: center;">${s.Status_Siswa}</td>
        </tr>
      `).join('');

      const html = `
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <thead>
            <tr>
              <th style="width: 35px;">No</th>
              <th style="width: 65px;">NIS</th>
              <th style="width: 85px;">NISN</th>
              <th>Nama Lengkap Siswa</th>
              <th style="width: 40px;">Kls</th>
              <th style="width: 40px;">L/P</th>
              <th>Tempat, Tanggal Lahir</th>
              <th>Nama Orang Tua / Wali</th>
              <th style="width: 65px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || '<tr><td colspan="9" style="text-align:center;">Tidak ada data.</td></tr>'}
          </tbody>
        </table>
      `;

      await triggerPrintReport("Daftar Induk Siswa", kelasLabel, html);
    };
  }

  // Ekspor CSV
  if (btnExport) {
    btnExport.onclick = () => {
      exportToCSV("Data_Siswa_SDN_Kesilir_02", currentList);
      toast.success("Data siswa berhasil diekspor ke CSV!");
    };
  }

  // Ambil Langsung dari Google Sheets
  const btnSyncNow = document.getElementById('btn-sync-students-now');
  if (btnSyncNow) {
    btnSyncNow.onclick = async () => {
      btnSyncNow.disabled = true;
      btnSyncNow.innerHTML = '⏳ Menghubungi Google Sheets...';
      try {
        const res = await syncStudentsFromGoogleSheets(user);
        toast.success(res.message);
        await loadData();
      } catch (e) {
        toast.error('Gagal mengambil data dari Google Sheets: ' + (e.message || e));
      } finally {
        btnSyncNow.disabled = false;
        btnSyncNow.innerHTML = '🔄 Tarik dari Google Sheets';
      }
    };
  }

  loadData();
}
