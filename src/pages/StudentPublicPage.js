/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * PORTAL UTAMA SISWA (SATU LINK RESMI - KELAS 1-6)
 * (src/pages/StudentPublicPage.js)
 * ==============================================================================
 * Format Khusus:
 * 1. Tampilan siswa langsung: Atasnya DAFTAR HADIR (Gambar 1), Bawahnya DAFTAR NILAI (Gambar 2).
 * 2. Keduanya diisi dan difilter per bulan (Juli s/d Juni).
 * 3. Tidak ada tab yang menyembunyikan tabel; keduanya bertingkat langsung terlihat di satu halaman.
 * 4. Akses guru tersembunyi dengan tombol panah (➔) di pojok atas, login email tanpa password.
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

  // 6 Kartu Kelas lengkap dengan Foto Profil & Identitas Wali Kelas masing-masing
  const classCardsHtml = [1, 2, 3, 4, 5, 6].map(num => {
    const classKey = `kelas_${num}`;
    const teacher = users.find(u => u.Kelas_Ditugaskan === classKey && (u.Role === 'guru' || !u.Role)) || {
      Nama: num === 1 ? 'Suci Ayu Ningrum, S.Pd.' : (num === 5 ? 'Dra. Ratna Suminar' : `Guru Kelas ${num}`),
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
        <p style="font-size: 0.75rem; color: #16a34a; font-weight: 600; margin: 0 0 0.85rem 0;">
          ✓ Wali Kelas Aktif
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
              <img src="${settings.logo_kiri || '/logo-kiri.png'}" alt="Logo Kiri Kop Surat" style="height: 65px; object-fit: contain;" onerror="this.src='/logo-kiri.png'">
            </div>
            <div style="flex: 1; text-align: center; padding: 0 10px;">
              <h4 style="font-size: 0.95rem; font-weight: 700; color: #334155; margin: 0; text-transform: uppercase;">PEMERINTAH ${settings.kabupaten || 'KABUPATEN JEMBER'}</h4>
              <h4 style="font-size: 0.9rem; font-weight: 700; color: #334155; margin: 2px 0; text-transform: uppercase;">${settings.dinas || 'DINAS PENDIDIKAN'}</h4>
              <h2 style="font-size: 1.35rem; font-weight: 900; color: #1e3a8a; margin: 2px 0; text-transform: uppercase; letter-spacing: 0.5px;">${schoolName}</h2>
              <p style="font-size: 0.78rem; color: #64748b; margin: 2px 0;">${settings.alamat_sekolah || 'Dsn. Tegal Baru, Ds. Kesilir, Kec. Wuluhan, Kab. Jember'} | NPSN: ${settings.npsn || '20523456'}</p>
            </div>
            <div style="width: 75px; text-align: right;">
              <img src="${settings.logo_kanan || '/logo-kanan.png'}" alt="Logo Kanan Kop Surat" style="height: 65px; object-fit: contain;" onerror="this.src='/logo-kanan.png'">
            </div>
          </div>
        </div>

        <!-- Banner Portal Siswa -->
        <div style="text-align: center; margin-bottom: 1.5rem; background: linear-gradient(135deg, #1e3a8a, #0284c7); color: white; padding: 1.5rem 1rem; border-radius: 14px; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.15);">
          <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.25rem;">
            Portal Informasi Absensi &amp; Penilaian Siswa
          </h2>
          <p style="font-size: 0.9rem; opacity: 0.95; max-width: 650px; margin: 0 auto;">
            Pilih kelas di bawah atau ketik angka kelas untuk melihat lembar absensi bulanan dan daftar nilai Kurikulum Merdeka secara lengkap dan transparan.
          </p>
        </div>

        <!-- PILIHAN 6 KELAS BESERTA FOTO PROFIL WALI KELAS -->
        <div style="margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0;">
              👥 PILIH KELAS UNTUK MELIHAT ABSEN &amp; NILAI:
            </h3>

            <!-- Input Cepat Angka Kelas -->
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; background: white; padding: 0.4rem 0.85rem; border-radius: 10px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <span style="font-size: 0.82rem; font-weight: 600; color: #475569;">Ketik Angka Kelas (1–6):</span>
              <input type="number" id="input-quick-class" min="1" max="6" placeholder="1-6" style="width: 55px; padding: 0.3rem; text-align: center; font-weight: 800; font-size: 1rem; border: 1px solid #cbd5e1; border-radius: 6px;">
              <button id="btn-submit-quick-class" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.75rem; font-weight: 700;">Lihat ➔</button>
            </div>
          </div>

          <!-- Grid 6 Kartu Kelas -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem;">
            ${classCardsHtml}
          </div>
        </div>

        <!-- TAMPILAN DATA KELAS YANG DIPILIH (VERTIKAL STACKED: ATAS ABSEN, BAWAH NILAI) -->
        <div id="section-class-data" style="display: none;">
          <!-- KARTU PROFIL WALI KELAS & FILTER BULANAN -->
          <div class="card" style="margin-bottom: 1.5rem; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #f0fdf4, #eff6ff); border: 2px solid #93c5fd;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
              <!-- Identitas Wali Kelas -->
              <div style="display: flex; align-items: center; gap: 1.25rem;">
                <img id="selected-teacher-photo" src="" alt="Foto Wali Kelas" style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 3px solid #1e3a8a; box-shadow: 0 4px 6px rgba(0,0,0,0.12);" onerror="this.src='https://ui-avatars.com/api/?name=Wali+Kelas&background=1e3a8a&color=fff&size=200'">
                <div>
                  <span class="badge badge-success" style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem;">WALI KELAS RESMI</span>
                  <h3 style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; margin: 0;" id="selected-teacher-name">
                    Nama Wali Kelas
                  </h3>
                  <p style="font-size: 0.78rem; color: #16a34a; font-weight: 600; margin: 2px 0 0 0;" id="selected-teacher-role">
                    Wali Kelas SDN Kesilir 02
                  </p>
                </div>
              </div>

              <!-- FILTER PER BULAN & MAPEL ("itu semua yang diisi perbulan") -->
              <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; background: white; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                <div>
                  <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 2px;">
                    📅 PILIH BULAN (1–31):
                  </label>
                  <select id="select-student-month" class="form-select" style="font-size: 0.85rem; font-weight: 700; padding: 0.4rem 0.6rem; border-radius: 8px; border-color: #1e3a8a; color: #1e3a8a;">
                    <option value="2026-07">Juli 2026</option>
                    <option value="2026-08">Agustus 2026</option>
                    <option value="2026-09">September 2026</option>
                    <option value="2026-10" selected>Oktober 2026</option>
                    <option value="2026-11">November 2026</option>
                    <option value="2026-12">Desember 2026</option>
                    <option value="2027-01">Januari 2027</option>
                    <option value="2027-02">Februari 2027</option>
                    <option value="2027-03">Maret 2027</option>
                    <option value="2027-04">April 2027</option>
                    <option value="2027-05">Mei 2027</option>
                    <option value="2027-06">Juni 2027</option>
                  </select>
                </div>

                <div>
                  <label style="display: block; font-size: 0.72rem; font-weight: 700; color: #475569; margin-bottom: 2px;">
                    📚 MATA PELAJARAN:
                  </label>
                  <select id="select-student-subject" class="form-select" style="font-size: 0.85rem; font-weight: 700; padding: 0.4rem 0.6rem; border-radius: 8px;">
                    <option value="Matematika" selected>Matematika</option>
                    <option value="PJOK">PJOK (Pendidikan Jasmani, Olahraga &amp; Kesehatan)</option>
                    <option value="PAI">PAI (Pendidikan Agama Islam &amp; Budi Pekerti)</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="IPAS">IPAS (Alam &amp; Sosial)</option>
                    <option value="Seni Rupa">Seni Rupa</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- =================================================================== -->
          <!-- 1. TABEL ATAS: FORMAT RESMI DAFTAR HADIR BULANAN (GAMBAR 1)          -->
          <!-- =================================================================== -->
          <div class="card" id="card-student-attendance" style="margin-bottom: 2rem; border-top: 4px solid #1e3a8a;">
            <div class="card-header" style="flex-wrap: wrap; gap: 0.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 1rem 1.25rem;">
              <div>
                <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem; color: #1e3a8a;">
                  <span>📋</span>
                  <span>1. DAFTAR HADIR SISWA BULANAN (FORMAT GAMBAR 1)</span>
                </h3>
                <span style="font-size: 0.8rem; color: #64748b;">
                  Format resmi blangko presensi: Tanggal 1 s/d 31, Kolom S, I, A, Jumlah Absen, &amp; Prosentase Absen Bulan ini
                </span>
              </div>
            </div>
            <div class="table-responsive" id="container-student-attendance-table" style="background: #ffffff; padding: 1rem; border-radius: 0 0 12px 12px; overflow-x: auto;">
              <!-- Rendered via JS -->
            </div>
          </div>

          <!-- =================================================================== -->
          <!-- 2. TABEL BAWAH: FORMAT RESMI DAFTAR NILAI SEMESTER (GAMBAR 2)        -->
          <!-- =================================================================== -->
          <div class="card" id="card-student-grades" style="margin-bottom: 2rem; border-top: 4px solid #0284c7;">
            <div class="card-header" style="flex-wrap: wrap; gap: 0.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 1rem 1.25rem;">
              <div>
                <h3 class="card-title" style="display: flex; align-items: center; gap: 0.5rem; color: #0369a1;">
                  <span>📝</span>
                  <span>2. DAFTAR NILAI SISWA (FORMAT KURIKULUM MERDEKA - GAMBAR 2)</span>
                </h3>
                <span style="font-size: 0.8rem; color: #64748b;">
                  Format resmi buku nilai: Formatif Lingkup Materi 1–5 (TP1–TP4), Sumatif LM1–5, Sumatif Akhir Semester (SAS), &amp; Nilai Akhir (NA)
                </span>
              </div>
            </div>
            <div class="table-responsive" id="container-student-grades-table" style="background: #ffffff; padding: 1rem; border-radius: 0 0 12px 12px; overflow-x: auto;">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>
      </main>

      <!-- MODAL AKSES GURU TERSEMBUNYI (LOGIN EMAIL TANPA PASSWORD) -->
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

  // Filter Bulan & Mapel
  const selectMonth = document.getElementById('select-student-month');
  const selectSubject = document.getElementById('select-student-subject');

  // Info Wali Kelas Terpilih
  const selectedTeacherPhoto = document.getElementById('selected-teacher-photo');
  const selectedTeacherName = document.getElementById('selected-teacher-name');
  const selectedTeacherRole = document.getElementById('selected-teacher-role');

  const containerAtt = document.getElementById('container-student-attendance-table');
  const containerGrades = document.getElementById('container-student-grades-table');

  // Modal Login Guru Tersembunyi
  const btnSecretStaff = document.getElementById('btn-secret-staff-login');
  const modalOverlay = document.getElementById('modal-staff-login-overlay');
  const btnCloseModal = document.getElementById('btn-close-staff-modal');
  const formStaffLogin = document.getElementById('form-staff-email-login');
  const inputStaffEmail = document.getElementById('input-staff-login-email');
  const btnSubmitStaff = document.getElementById('btn-submit-staff-login');

  // Render Data Kelas Terpilih (Keduanya tampil sekaligus secara vertikal)
  const renderClassData = async () => {
    if (!activeClass) return;

    const classNum = activeClass.replace('kelas_', '');
    const classLabel = CLASS_LABELS[activeClass] || `Kelas ${classNum}`;
    const selectedYearMonth = selectMonth ? selectMonth.value : '2026-10';
    const monthText = selectMonth ? selectMonth.options[selectMonth.selectedIndex].text : 'Oktober 2026';
    const selectedSubj = selectSubject ? selectSubject.value : 'Matematika';

    // Update highlight kartu kelas
    classCards.forEach(c => {
      if (c.getAttribute('data-class') === activeClass) {
        c.style.borderColor = '#1e3a8a';
        c.style.background = '#f0f9ff';
      } else {
        c.style.borderColor = '#e2e8f0';
        c.style.background = 'white';
      }
    });

    if (quickInput) quickInput.value = classNum;
    if (sectionClassData) sectionClassData.style.display = 'block';

    if (containerAtt) containerAtt.innerHTML = '<div style="text-align:center; padding: 2rem; color:#64748b;">Memuat data kehadiran kelas...</div>';
    if (containerGrades) containerGrades.innerHTML = '<div style="text-align:center; padding: 2rem; color:#64748b;">Memuat data nilai kelas...</div>';

    const students = await getStudents(activeClass, 'Aktif');
    const attendance = await getAttendance(activeClass, null, selectedYearMonth);
    const grades = await getGrades(activeClass);
    const settings = await getSettings();
    const users = await getUsers();

    // Data Wali Kelas (NIP dirahasiakan untuk perlindungan privasi guru)
    const teacherAccount = users.find(u => u.Kelas_Ditugaskan === activeClass && (u.Role === 'guru' || !u.Role));
    const teacherName = teacherAccount?.Nama || (classNum === '1' ? 'Suci Ayu Ningrum, S.Pd.' : (classNum === '5' ? 'Dra. Ratna Suminar' : `Guru Kelas ${classNum}`));
    const teacherPhoto = teacherAccount?.Foto || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&h=250&fit=crop&crop=faces";

    // Update kartu wali kelas terpilih
    if (selectedTeacherPhoto) {
      selectedTeacherPhoto.src = teacherPhoto;
      selectedTeacherPhoto.onerror = () => {
        selectedTeacherPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=1e3a8a&color=fff&size=200`;
      };
    }
    if (selectedTeacherName) selectedTeacherName.textContent = teacherName;
    if (selectedTeacherRole) selectedTeacherRole.textContent = `Wali Kelas ${classNum} SDN Kesilir 02`;

    // 1. Render Tabel Atas: Format Resmi Gambar 1 (Absensi 1–31 Sesuai Bulan) - NIP dikosongkan untuk privasi
    cachedAttHtml = generateAttendanceMonthSheetHtml(students, attendance, monthText, settings, classLabel, teacherName, "", selectedYearMonth);
    if (containerAtt) containerAtt.innerHTML = cachedAttHtml;

    // 2. Render Tabel Bawah: Format Resmi Gambar 2 (Nilai Kurikulum Merdeka) - NIP dikosongkan untuk privasi
    cachedGradesHtml = generateGradesSemesterSheetHtml(students, grades, selectedSubj, settings.semester_aktif || "1 (Ganjil)", settings, classLabel, teacherName, "", monthText);
    if (containerGrades) containerGrades.innerHTML = cachedGradesHtml;
  };

  const selectClassHandler = (classKey, scroll = true) => {
    activeClass = classKey;
    renderClassData();
    if (scroll && sectionClassData) {
      sectionClassData.scrollIntoView({ behavior: 'smooth' });
    }
  };

  classCards.forEach(card => {
    card.onclick = () => {
      const cls = card.getAttribute('data-class');
      selectClassHandler(cls, true);
    };
  });

  if (btnQuick && quickInput) {
    const doQuick = () => {
      const val = parseInt(quickInput.value, 10);
      if (val >= 1 && val <= 6) {
        selectClassHandler(`kelas_${val}`, true);
      } else {
        toast.warning("Silakan masukkan angka kelas antara 1 sampai 6.");
      }
    };
    btnQuick.onclick = doQuick;
    quickInput.onkeydown = (e) => {
      if (e.key === 'Enter') doQuick();
    };
  }

  // Listener Pembaruan Bulan atau Mapel ("diisi perbulan")
  if (selectMonth) {
    selectMonth.onchange = () => {
      if (activeClass) renderClassData();
    };
  }

  if (selectSubject) {
    selectSubject.onchange = () => {
      if (activeClass) renderClassData();
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
