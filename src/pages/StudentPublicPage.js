/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * PORTAL UTAMA SISWA (SATU LINK RESMI - WALI KELAS & FOTO PROFIL KELAS 1-6)
 * (src/pages/StudentPublicPage.js)
 * ==============================================================================
 */

import { getStudents, getAttendance, getGrades, getSettings, getUsers } from '../services.js';
import { generateAttendanceMonthSheetHtml, generateGradesSemesterSheetHtml, triggerPrintAuthenticLandscape } from '../components/ReportPrint.js';
import { loginWithEmailOnly } from '../auth.js';
import { CLASS_LABELS } from '../permissions.js';
import { toast } from '../components/Toast.js';

export async function renderStudentPublicPage() {
  const settings = await getSettings();
  const schoolName = settings.nama_sekolah || "SDN KESILIR 02";
  const users = await getUsers();

  // Buat 6 Kartu Kelas lengkap dengan Foto Profil & Identitas Wali Kelas masing-masing
  const classCardsHtml = [1, 2, 3, 4, 5, 6].map(num => {
    const classKey = `kelas_${num}`;
    const teacher = users.find(u => u.Kelas_Ditugaskan === classKey && (u.Role === 'guru' || !u.Role)) || {
      Nama: num === 1 ? 'Suci Ayu Ningrum, S.Pd.' : (num === 5 ? 'Dra. Ratna Suminar' : `Guru Kelas ${num}`),
      NIP: num === 1 ? '199410142023212000' : (num === 5 ? '195701201992032001' : '-'),
      Foto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&h=250&fit=crop&crop=faces"
    };

    const teacherPhoto = teacher.Foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&h=250&fit=crop&crop=faces";

    return `
      <div class="card btn-class-choice" data-class="${classKey}" style="cursor: pointer; text-align: center; padding: 1.25rem 1rem; border-radius: 14px; border: 2px solid #e2e8f0; transition: all 0.25s; position: relative; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" onmouseover="this.style.borderColor='#1e3a8a'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 15px -3px rgba(30,58,138,0.15)';" onmouseout="this.style.borderColor='#e2e8f0'; this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)';">
        <!-- Foto Profil Wali Kelas -->
        <div style="width: 80px; height: 80px; margin: 0 auto 0.75rem; position: relative;">
          <img src="${teacherPhoto}" alt="Foto Wali Kelas ${num}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #0284c7; box-shadow: 0 4px 8px rgba(0,0,0,0.12);" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.Nama)}&background=1e3a8a&color=fff&size=200'">
          <span style="position: absolute; bottom: 2px; right: 2px; background: #16a34a; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;" title="Wali Kelas Aktif"></span>
        </div>

        <!-- Identitas Kelas & Wali Kelas -->
        <div style="display: inline-block; background: #eff6ff; color: #1e3a8a; font-size: 0.75rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 0.35rem;">
          KELAS ${num}
        </div>
        <h4 style="font-size: 1rem; font-weight: 800; color: #0f172a; margin: 0 0 2px 0; line-height: 1.25;">
          ${teacher.Nama}
        </h4>
        <p style="font-size: 0.72rem; color: #64748b; margin: 0 0 0.85rem 0;">
          NIP. ${teacher.NIP || '-'}
        </p>

        <button class="btn btn-outline btn-sm" style="width: 100%; font-size: 0.8rem; font-weight: 700; border-radius: 8px; pointer-events: none;">
          Buka Absen &amp; Nilai ➔
        </button>
      </div>
    `;
  }).join('');

  return `
    <div style="min-height: 100vh; background: #f8fafc; display: flex; flex-direction: column; font-family: var(--font-sans);">
      <!-- HEADER UTAMA TUNGGAL -->
      <header style="background: white; border-bottom: 1px solid #e2e8f0; padding: 0.85rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.85rem;">
          <img src="/logo-kanan.png" alt="Logo Sekolah" style="width: 44px; height: 44px; object-fit: contain; border-radius: 8px;" onerror="this.src='https://drive.google.com/thumbnail?id=1XWfjQdygAvCCyRfKpTLD40MImqnl08X8&sz=w200'">
          <div>
            <h1 style="font-size: 1.15rem; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1.2;">
              ${schoolName}
            </h1>
            <p style="font-size: 0.75rem; color: #64748b; margin: 0;">Sistem Informasi Absensi &amp; Penilaian Siswa (Kelas 1–6)</p>
          </div>
        </div>

        <!-- AKSES GURU / STAF TERSEMBUNYI (HANYA SIMBOL PANAH) -->
        <div>
          <button id="btn-secret-staff-login" title="Akses Masuk Guru / Staf" style="background: none; border: 1px solid transparent; color: #94a3b8; font-size: 1.4rem; cursor: pointer; padding: 6px 12px; border-radius: 8px; transition: all 0.2s;" onmouseover="this.style.color='#1e3a8a'; this.style.borderColor='#cbd5e1';" onmouseout="this.style.color='#94a3b8'; this.style.borderColor='transparent';">
            ➔
          </button>
        </div>
      </header>

      <!-- KONTEN PORTAL SISWA -->
      <main style="flex: 1; max-width: 1200px; width: 100%; margin: 0 auto; padding: 1.5rem 1rem;">
        <!-- KOP SURAT RESMI SEKOLAH (LOGO KIRI & LOGO KANAN) -->
        <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem 1.5rem; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #1e3a8a; padding-bottom: 0.85rem;">
            <div style="width: 75px; text-align: left;">
              <img src="/logo-kiri.png" alt="Logo Kiri Kop Surat" style="height: 65px; object-fit: contain;" onerror="this.src='https://drive.google.com/thumbnail?id=1YkV5mi6NjLLnVwOmS-gk7NUS8vQyIU9M&sz=w200'">
            </div>
            <div style="flex: 1; text-align: center; padding: 0 10px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #334155; margin: 0; text-transform: uppercase;">PEMERINTAH ${settings.kabupaten || 'KABUPATEN JEMBER'}</h4>
              <h4 style="font-size: 0.9rem; font-weight: 700; color: #334155; margin: 2px 0; text-transform: uppercase;">${settings.dinas || 'DINAS PENDIDIKAN'}</h4>
              <h2 style="font-size: 1.35rem; font-weight: 900; color: #1e3a8a; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">${schoolName}</h2>
              <p style="font-size: 0.78rem; color: #64748b; margin: 2px 0;">${settings.alamat_sekolah || 'Dsn. Tegal Baru, Ds. Kesilir, Kec. Wuluhan, Kab. Jember'} | NPSN: ${settings.npsn || '20523456'}</p>
            </div>
            <div style="width: 75px; text-align: right;">
              <img src="/logo-kanan.png" alt="Logo Kanan Kop Surat" style="height: 65px; object-fit: contain;" onerror="this.src='https://drive.google.com/thumbnail?id=1XWfjQdygAvCCyRfKpTLD40MImqnl08X8&sz=w200'">
            </div>
          </div>
        </div>

        <!-- Banner Portal -->
        <div style="text-align: center; margin-bottom: 1.5rem; background: linear-gradient(135deg, #1e3a8a, #0284c7); color: white; padding: 1.5rem 1rem; border-radius: 14px; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);">
          <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.25rem;">
            Portal Absensi &amp; Nilai Siswa (Kelas 1 – 6)
          </h2>
          <p style="font-size: 0.9rem; opacity: 0.95; max-width: 600px; margin: 0 auto;">
            Pilih kelas di bawah untuk melihat profil wali kelas serta rekapitulasi kehadiran dan laporan nilai kelas secara transparan.
          </p>
        </div>

        <!-- PILIHAN 6 KELAS BESERTA FOTO PROFIL WALI KELAS -->
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0;">
              👥 DAFTAR KELAS &amp; WALI KELAS:
            </h3>

            <!-- Input Cepat Angka Kelas -->
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: white; padding: 0.4rem 0.85rem; border-radius: 10px; border: 1px solid #cbd5e1;">
              <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">Ketik Angka Kelas:</span>
              <input type="number" id="input-quick-class" min="1" max="6" placeholder="1-6" style="width: 55px; padding: 0.3rem; text-align: center; font-weight: 800; font-size: 1rem; border: 1px solid #cbd5e1; border-radius: 6px;">
              <button id="btn-submit-quick-class" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.75rem;">Lihat ➔</button>
            </div>
          </div>

          <!-- Grid 6 Kartu Kelas -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem;">
            ${classCardsHtml}
          </div>
        </div>

        <!-- TAMPILAN DATA KELAS YANG DIPILIH -->
        <div id="section-class-data" style="display: none;">
          <!-- KARTU PROFIL WALI KELAS TERPILIH -->
          <div class="card" style="margin-bottom: 1.25rem; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #f0fdf4, #eff6ff); border: 2px solid #93c5fd;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 1.25rem;">
                <img id="selected-teacher-photo" src="" alt="Foto Wali Kelas" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 3px solid #1e3a8a; box-shadow: 0 4px 6px rgba(0,0,0,0.12);" onerror="this.src='https://ui-avatars.com/api/?name=Wali+Kelas&background=1e3a8a&color=fff&size=200'">
                <div>
                  <span class="badge badge-success" style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">WALI KELAS RESMI</span>
                  <h3 style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; margin: 0;" id="selected-teacher-name">
                    Nama Wali Kelas
                  </h3>
                  <p style="font-size: 0.85rem; color: #475569; margin: 2px 0 0 0;" id="selected-teacher-nip">
                    NIP. -
                  </p>
                  <p style="font-size: 0.75rem; color: #64748b; margin: 2px 0 0 0;" id="selected-teacher-role">
                    Wali Kelas SDN Kesilir 02
                  </p>
                </div>
              </div>

              <!-- Dua Tab Tampilan: Absen (Gambar 1) & Nilai (Gambar 2) -->
              <div style="display: flex; gap: 0.5rem; background: white; padding: 5px; border-radius: 10px; border: 1px solid #cbd5e1;">
                <button class="btn btn-sm btn-primary" id="tab-btn-absen" style="font-weight: 700;">
                  📋 1. Tampilan Absen (Gambar 1)
                </button>
                <button class="btn btn-sm btn-outline" id="tab-btn-nilai" style="font-weight: 700; border: none;">
                  📝 2. Tampilan Nilai (Gambar 2)
                </button>
              </div>
            </div>
          </div>

          <!-- KONTEN TAB 1: FORMAT RESMI GAMBAR 1 (ABSENSI 1-31) -->
          <div class="card" id="view-tab-absen">
            <div class="card-header" style="flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 class="card-title">📋 Format Resmi Daftar Hadir Siswa (Gambar 1)</h3>
                <span style="font-size: 0.78rem; color: #64748b;">Tanggal 1–31, S, I, A, Jumlah, &amp; Persentase Kehadiran</span>
              </div>
              <button class="btn btn-primary btn-sm" id="btn-print-student-att">
                🖨️ Cetak / Simpan PDF
              </button>
            </div>
            <div class="table-responsive" id="container-student-attendance-table" style="background: #ffffff; padding: 0.75rem; border-radius: 8px; overflow-x: auto;">
              <!-- Rendered via JS -->
            </div>
          </div>

          <!-- KONTEN TAB 2: FORMAT RESMI GAMBAR 2 (NILAI KURIKULUM MERDEKA) -->
          <div class="card" id="view-tab-nilai" style="display: none;">
            <div class="card-header" style="flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 class="card-title">📝 Format Resmi Daftar Nilai Semester (Gambar 2)</h3>
                <span style="font-size: 0.78rem; color: #64748b;">Kurikulum Merdeka: Formatif (TP1–4 per LM1–5), Sumatif LM1–5, SAS, &amp; Nilai Akhir</span>
              </div>
              <button class="btn btn-primary btn-sm" id="btn-print-student-grades">
                🖨️ Cetak / Simpan PDF
              </button>
            </div>
            <div class="table-responsive" id="container-student-grades-table" style="background: #ffffff; padding: 0.75rem; border-radius: 8px; overflow-x: auto;">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>
      </main>

      <!-- MODAL AKSES GURU TERSEMBUNYI (TANPA PASSWORD) -->
      <div id="modal-staff-login-overlay" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); z-index: 1000; align-items: center; justify-content: center; padding: 1.5rem;">
        <div style="background: white; border-radius: 16px; max-width: 420px; width: 100%; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2); position: relative;">
          <!-- Tombol Tutup Modal -->
          <button id="btn-close-staff-modal" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.4rem; color: #94a3b8; cursor: pointer;">
            ✕
          </button>

          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="width: 50px; height: 50px; border-radius: 12px; background: #eff6ff; color: #1e3a8a; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem;">
              👨‍🏫
            </div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem;">
              Akses Masuk Guru &amp; Staf
            </h3>
            <p style="font-size: 0.8rem; color: #64748b; margin: 0;">
              Masukkan email akun guru atau staf untuk masuk langsung ke dashboard kerja.
            </p>
          </div>

          <form id="form-staff-email-login" onsubmit="return false;">
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">
                Email Akun Guru / Staf *
              </label>
              <input type="email" id="input-staff-login-email" class="form-input" placeholder="contoh: guru5@sekolah.id atau admin@sekolah.id" required style="width: 100%; padding: 0.75rem 1rem; font-size: 0.95rem;">
            </div>

            <button type="submit" id="btn-submit-staff-login" class="btn btn-primary btn-lg" style="width: 100%; font-weight: 700;">
              Masuk ke Dashboard ➔
            </button>
          </form>

          <div style="margin-top: 1rem; text-align: center; font-size: 0.75rem; color: #94a3b8;">
            ℹ️ Sesi Anda akan tetap aktif di perangkat ini sampai Anda menekan tombol Keluar.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachStudentPublicEvents() {
  let activeClass = null;
  let cachedAttHtml = "";
  let cachedGradesHtml = "";

  const classCards = document.querySelectorAll('.btn-class-choice');
  const quickInput = document.getElementById('input-quick-class');
  const btnQuick = document.getElementById('btn-submit-quick-class');
  const sectionClassData = document.getElementById('section-class-data');

  // Info Wali Kelas Terpilih
  const selectedTeacherPhoto = document.getElementById('selected-teacher-photo');
  const selectedTeacherName = document.getElementById('selected-teacher-name');
  const selectedTeacherNip = document.getElementById('selected-teacher-nip');
  const selectedTeacherRole = document.getElementById('selected-teacher-role');

  const tabBtnAbsen = document.getElementById('tab-btn-absen');
  const tabBtnNilai = document.getElementById('tab-btn-nilai');
  const viewTabAbsen = document.getElementById('view-tab-absen');
  const viewTabNilai = document.getElementById('view-tab-nilai');

  const containerAtt = document.getElementById('container-student-attendance-table');
  const containerGrades = document.getElementById('container-student-grades-table');
  const btnPrintAtt = document.getElementById('btn-print-student-att');
  const btnPrintGrades = document.getElementById('btn-print-student-grades');

  // Modal Login Guru Tersembunyi
  const btnSecretStaff = document.getElementById('btn-secret-staff-login');
  const modalOverlay = document.getElementById('modal-staff-login-overlay');
  const btnCloseModal = document.getElementById('btn-close-staff-modal');
  const formStaffLogin = document.getElementById('form-staff-email-login');
  const inputStaffEmail = document.getElementById('input-staff-login-email');
  const btnSubmitStaff = document.getElementById('btn-submit-staff-login');

  // Pilih Kelas Langsung
  const selectClassHandler = async (classKey) => {
    activeClass = classKey;
    const classNum = classKey.replace('kelas_', '');
    const classLabel = CLASS_LABELS[classKey] || `Kelas ${classNum}`;

    // Update highlight kartu kelas
    classCards.forEach(c => {
      if (c.getAttribute('data-class') === classKey) {
        c.style.borderColor = '#1e3a8a';
        c.style.background = '#f0f9ff';
      } else {
        c.style.borderColor = '#e2e8f0';
        c.style.background = 'white';
      }
    });

    if (quickInput) quickInput.value = classNum;
    if (sectionClassData) sectionClassData.style.display = 'block';

    // Scroll mulus ke data kelas
    sectionClassData.scrollIntoView({ behavior: 'smooth' });

    // Muat data Absen (Gambar 1) dan Nilai (Gambar 2)
    if (containerAtt) containerAtt.innerHTML = '<div style="text-align:center; padding: 2rem; color:#64748b;">Memuat data kehadiran kelas...</div>';
    if (containerGrades) containerGrades.innerHTML = '<div style="text-align:center; padding: 2rem; color:#64748b;">Memuat data nilai kelas...</div>';

    const students = await getStudents(classKey, 'Aktif');
    const attendance = await getAttendance(classKey);
    const grades = await getGrades(classKey);
    const settings = await getSettings();
    const users = await getUsers();

    // Data Wali Kelas
    const teacherAccount = users.find(u => u.Kelas_Ditugaskan === classKey && (u.Role === 'guru' || !u.Role));
    const teacherName = teacherAccount?.Nama || (classNum === '1' ? 'Suci Ayu Ningrum, S.Pd.' : (classNum === '5' ? 'Dra. Ratna Suminar' : `Guru Kelas ${classNum}`));
    const teacherNip = teacherAccount?.NIP || (classNum === '1' ? '199410142023212000' : (classNum === '5' ? '195701201992032001' : '-'));
    const teacherPhoto = teacherAccount?.Foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&h=250&fit=crop&crop=faces";

    // Update banner wali kelas terpilih
    if (selectedTeacherPhoto) {
      selectedTeacherPhoto.src = teacherPhoto;
      selectedTeacherPhoto.onerror = () => {
        selectedTeacherPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=1e3a8a&color=fff&size=200`;
      };
    }
    if (selectedTeacherName) selectedTeacherName.textContent = teacherName;
    if (selectedTeacherNip) selectedTeacherNip.textContent = `NIP. ${teacherNip}`;
    if (selectedTeacherRole) selectedTeacherRole.textContent = `Wali Kelas ${classNum} SDN Kesilir 02`;

    // 1. Render Gambar 1: Daftar Hadir 1-31
    cachedAttHtml = generateAttendanceMonthSheetHtml(students, attendance, "Bulan Ini", settings, classLabel, teacherName, teacherNip);
    if (containerAtt) containerAtt.innerHTML = cachedAttHtml;

    // 2. Render Gambar 2: Lembar Nilai Kurikulum Merdeka
    cachedGradesHtml = generateGradesSemesterSheetHtml(students, grades, "Matematika", settings.semester_aktif || "1 (Ganjil)", settings, classLabel, teacherName, teacherNip);
    if (containerGrades) containerGrades.innerHTML = cachedGradesHtml;
  };

  classCards.forEach(card => {
    card.onclick = () => {
      const cls = card.getAttribute('data-class');
      selectClassHandler(cls);
    };
  });

  if (btnQuick && quickInput) {
    const doQuick = () => {
      const val = parseInt(quickInput.value, 10);
      if (val >= 1 && val <= 6) {
        selectClassHandler(`kelas_${val}`);
      } else {
        toast.warning("Silakan masukkan angka kelas antara 1 sampai 6.");
      }
    };
    btnQuick.onclick = doQuick;
    quickInput.onkeydown = (e) => {
      if (e.key === 'Enter') doQuick();
    };
  }

  // Tab Switcher Absen vs Nilai
  if (tabBtnAbsen && tabBtnNilai) {
    tabBtnAbsen.onclick = () => {
      tabBtnAbsen.className = 'btn btn-sm btn-primary';
      tabBtnAbsen.style.border = 'none';
      tabBtnNilai.className = 'btn btn-sm btn-outline';
      tabBtnNilai.style.border = 'none';
      if (viewTabAbsen) viewTabAbsen.style.display = 'block';
      if (viewTabNilai) viewTabNilai.style.display = 'none';
    };

    tabBtnNilai.onclick = () => {
      tabBtnNilai.className = 'btn btn-sm btn-primary';
      tabBtnNilai.style.border = 'none';
      tabBtnAbsen.className = 'btn btn-sm btn-outline';
      tabBtnAbsen.style.border = 'none';
      if (viewTabAbsen) viewTabAbsen.style.display = 'none';
      if (viewTabNilai) viewTabNilai.style.display = 'block';
    };
  }

  // Cetak Dokumen Langsung via Iframe
  if (btnPrintAtt) {
    btnPrintAtt.onclick = () => {
      if (cachedAttHtml) triggerPrintAuthenticLandscape(cachedAttHtml);
    };
  }

  if (btnPrintGrades) {
    btnPrintGrades.onclick = () => {
      if (cachedGradesHtml) triggerPrintAuthenticLandscape(cachedGradesHtml);
    };
  }

  // Kontrol Akses Guru Tersembunyi (➔)
  if (btnSecretStaff && modalOverlay) {
    btnSecretStaff.onclick = () => {
      modalOverlay.style.display = 'flex';
      if (inputStaffEmail) inputStaffEmail.focus();
    };
  }

  if (btnCloseModal && modalOverlay) {
    btnCloseModal.onclick = () => {
      modalOverlay.style.display = 'none';
    };
  }

  // Login Email Guru Tanpa Password
  if (formStaffLogin) {
    formStaffLogin.onsubmit = async (e) => {
      e.preventDefault();
      const email = inputStaffEmail.value.trim();
      if (!email) {
        toast.warning("Masukkan alamat email Anda.");
        return;
      }

      btnSubmitStaff.disabled = true;
      btnSubmitStaff.textContent = "Memverifikasi...";

      try {
        const user = await loginWithEmailOnly(email);
        toast.success(`Selamat datang, ${user.displayName}!`);
        modalOverlay.style.display = 'none';
        window.location.hash = '#dashboard';
      } catch (err) {
        toast.error(err.message || "Gagal masuk.");
        btnSubmitStaff.disabled = false;
        btnSubmitStaff.textContent = "Masuk ke Dashboard ➔";
      }
    };
  }
}
