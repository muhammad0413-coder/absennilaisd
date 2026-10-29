/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * HALAMAN PUBLIK SISWA RAMAH ANAK (src/pages/StudentPublicPage.js)
 * ==============================================================================
 */

import { getPublicClassInfo, verifyStudentAccess } from '../services.js';
import { toast } from '../components/Toast.js';

export async function renderStudentPublicPage(selectedClass = null) {
  let activeClass = selectedClass;
  let classData = null;

  if (activeClass) {
    classData = await getPublicClassInfo(activeClass);
  }

  return `
    <div style="min-height: 100vh; background: #f8fafc; display: flex; flex-direction: column;">
      <!-- Header Siswa Bersih -->
      <header style="background: white; border-bottom: 2px solid #e2e8f0; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #1e3a8a, #0284c7); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white;">
            🏫
          </div>
          <div>
            <h1 style="font-size: 1.15rem; font-weight: 800; color: #1e3a8a; margin: 0; line-height: 1.2;">
              SD NEGERI HARAPAN BANGSA
            </h1>
            <p style="font-size: 0.78rem; color: #64748b; margin: 0;">Sistem Informasi Absensi & Penilaian Siswa</p>
          </div>
        </div>

        <div>
          <a href="#login" class="btn btn-outline btn-sm" title="Login Guru / Admin" style="display: flex; align-items: center; gap: 0.4rem; font-weight: 600;">
            🔒 <span>Login Staf</span>
          </a>
        </div>
      </header>

      <main style="flex: 1; max-width: 1000px; width: 100%; margin: 0 auto; padding: 1.5rem 1rem;">
        <!-- Banner Ramah Anak -->
        <div class="student-hero">
          <span style="font-size: 3rem; display: block; margin-bottom: 0.5rem;">🌟</span>
          <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem;">Selamat Datang, Siswa Hebat!</h2>
          <p style="font-size: 1.05rem; opacity: 0.95; max-width: 600px; margin: 0 auto;">
            Pilih kelasmu di bawah untuk melihat jadwal pelajaran, pengumuman sekolah, serta informasi kegiatan kelas.
          </p>
        </div>

        <!-- Pilihan Kelas (Kelas 1 & Kelas 6) -->
        <div class="student-class-picker">
          <button class="class-card-btn ${activeClass === 'kelas_1' ? 'selected' : ''}" id="btn-select-k1" style="${activeClass === 'kelas_1' ? 'border-color: #2563eb; background: #eff6ff;' : ''}">
            <div class="class-badge-big" style="background: #e0f2fe; color: #0284c7;">1</div>
            <div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">KELAS 1</h3>
              <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Fase A - Tematik & Berhitung Dasar</p>
            </div>
            <span class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%;">
              ${activeClass === 'kelas_1' ? '✓ Sedang Dilihat' : 'Lihat Kelas 1 →'}
            </span>
          </button>

          <button class="class-card-btn ${activeClass === 'kelas_6' ? 'selected' : ''}" id="btn-select-k6" style="${activeClass === 'kelas_6' ? 'border-color: #2563eb; background: #eff6ff;' : ''}">
            <div class="class-badge-big" style="background: #fef3c7; color: #d97706;">6</div>
            <div>
              <h3 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">KELAS 6</h3>
              <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Fase C - Persiapan Asesmen Akhir</p>
            </div>
            <span class="btn btn-primary btn-sm" style="margin-top: 0.5rem; width: 100%;">
              ${activeClass === 'kelas_6' ? '✓ Sedang Dilihat' : 'Lihat Kelas 6 →'}
            </span>
          </button>
        </div>

        ${activeClass && classData ? `
          <!-- TAMPILAN DETAIL KELAS YANG DIPILIH -->
          <div style="animation: slideIn 0.3s ease;">
            <!-- Profil Guru Kelas -->
            <div class="card" style="border-left: 5px solid #2563eb;">
              <div style="display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;">
                <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #e2e8f0; flex-shrink: 0; border: 3px solid #2563eb;">
                  ${classData.guru.foto_url 
                    ? `<img src="${classData.guru.foto_url}" alt="Foto Guru" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=''; this.innerHTML='👨‍🏫';">`
                    : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">👨‍🏫</div>`
                  }
                </div>
                <div style="flex: 1;">
                  <span class="badge badge-info" style="margin-bottom: 0.35rem;">Wali Kelas</span>
                  <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem;">
                    ${classData.guru.nama_guru}
                  </h3>
                  <p style="font-size: 0.85rem; color: #64748b; margin: 0;">
                    Kontak WhatsApp/Telepon: <strong>${classData.guru.nomor_telepon || "-"}</strong>
                  </p>
                </div>
                <button class="btn btn-accent btn-sm" id="btn-open-private-check">
                  🔍 Cek Nilai & Absen Pribadi
                </button>
              </div>
            </div>

            <!-- Rekap Kehadiran Kelas Umum -->
            <div class="card">
              <div class="card-header">
                <h4 class="card-title">📊 Rekap Kehadiran Siswa ${classData.nama_kelas}</h4>
                <span class="badge badge-neutral">Transparan & Ramah Siswa</span>
              </div>
              <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 0;">
                <div class="stat-card" style="padding: 0.85rem;">
                  <div class="stat-icon green" style="width: 38px; height: 38px; font-size: 1.2rem;">✓</div>
                  <div>
                    <div class="stat-val" style="font-size: 1.3rem;">${classData.rekap_absensi_umum.hadir}</div>
                    <div class="stat-label">Hadir</div>
                  </div>
                </div>
                <div class="stat-card" style="padding: 0.85rem;">
                  <div class="stat-icon blue" style="width: 38px; height: 38px; font-size: 1.2rem;">🏥</div>
                  <div>
                    <div class="stat-val" style="font-size: 1.3rem;">${classData.rekap_absensi_umum.sakit}</div>
                    <div class="stat-label">Sakit</div>
                  </div>
                </div>
                <div class="stat-card" style="padding: 0.85rem;">
                  <div class="stat-icon amber" style="width: 38px; height: 38px; font-size: 1.2rem;">✉️</div>
                  <div>
                    <div class="stat-val" style="font-size: 1.3rem;">${classData.rekap_absensi_umum.izin}</div>
                    <div class="stat-label">Izin</div>
                  </div>
                </div>
                <div class="stat-card" style="padding: 0.85rem;">
                  <div class="stat-icon rose" style="width: 38px; height: 38px; font-size: 1.2rem;">⚠️</div>
                  <div>
                    <div class="stat-val" style="font-size: 1.3rem;">${classData.rekap_absensi_umum.alpa}</div>
                    <div class="stat-label">Alpa</div>
                  </div>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
              <!-- Jadwal Pelajaran -->
              <div class="card">
                <div class="card-header">
                  <h4 class="card-title">⏱️ Jadwal Pelajaran ${classData.nama_kelas}</h4>
                </div>
                ${classData.jadwal.length === 0 ? `
                  <p style="color: #64748b; font-size: 0.9rem; text-align: center; padding: 1.5rem 0;">Jadwal belum dipublikasikan.</p>
                ` : `
                  <div class="table-responsive">
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Hari / Jam</th>
                          <th>Mata Pelajaran</th>
                          <th>Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${classData.jadwal.map(j => `
                          <tr>
                            <td>
                              <strong>${j.hari}</strong><br>
                              <span style="font-size: 0.75rem; color: #64748b;">${j.jam_mulai} - ${j.jam_selesai}</span>
                            </td>
                            <td><strong style="color: #1e3a8a;">${j.mata_pelajaran}</strong></td>
                            <td style="font-size: 0.8rem; color: #64748b;">${j.keterangan || "-"}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `}
              </div>

              <!-- Pengumuman Kelas -->
              <div class="card">
                <div class="card-header">
                  <h4 class="card-title">📢 Pengumuman ${classData.nama_kelas}</h4>
                </div>
                ${classData.pengumuman.length === 0 ? `
                  <p style="color: #64748b; font-size: 0.9rem; text-align: center; padding: 1.5rem 0;">Belum ada pengumuman baru.</p>
                ` : `
                  <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${classData.pengumuman.map(p => `
                      <div style="padding: 1rem; border-radius: 8px; background: #f1f5f9; border-left: 4px solid #0284c7;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                          <h5 style="font-weight: 700; color: #0f172a; margin: 0; font-size: 0.95rem;">${p.judul}</h5>
                          <span style="font-size: 0.72rem; color: #64748b;">${p.tanggal_publikasi}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: #334155; margin: 0; line-height: 1.4;">${p.isi}</p>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            </div>
          </div>
        ` : `
          <!-- Tampilan saat belum memilih kelas -->
          <div class="card" style="text-align: center; padding: 3rem 1.5rem;">
            <span style="font-size: 3rem; display: block; margin-bottom: 0.75rem;">👆</span>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Pilih Kelas untuk Menampilkan Informasi</h3>
            <p style="font-size: 0.9rem; color: #64748b; max-width: 500px; margin: 0 auto;">
              Klik tombol <strong>KELAS 1</strong> atau <strong>KELAS 6</strong> di atas untuk memuat guru kelas, jadwal mingguan, dan pengumuman.
            </p>
          </div>
        `}
      </main>

      <!-- Modal Verifikasi Siswa (Cek Nilai & Absensi Pribadi Aman) -->
      <div id="student-verification-modal-slot"></div>

      <!-- Footer Publik -->
      <footer style="background: white; border-top: 1px solid #e2e8f0; padding: 1.25rem; text-align: center; font-size: 0.8rem; color: #64748b;">
        <p style="margin: 0;">© 2026 SD Negeri Harapan Bangsa. Hak Cipta Dilindungi.</p>
        <p style="margin: 4px 0 0 0; font-size: 0.75rem;">Akses Resmi Kelas 1 & Kelas 6 - PWA & Cloud Integrated</p>
      </footer>
    </div>
  `;
}

export function attachStudentPublicEvents(currentClass) {
  const btnK1 = document.getElementById('btn-select-k1');
  const btnK6 = document.getElementById('btn-select-k6');

  if (btnK1) {
    btnK1.onclick = () => {
      window.location.hash = '#student-kelas_1';
    };
  }

  if (btnK6) {
    btnK6.onclick = () => {
      window.location.hash = '#student-kelas_6';
    };
  }

  const btnOpenPrivate = document.getElementById('btn-open-private-check');
  if (btnOpenPrivate) {
    btnOpenPrivate.onclick = () => {
      showStudentVerificationDialog(currentClass);
    };
  }
}

/**
 * Dialog Verifikasi Siswa untuk Mengakses Nilai & Absensi Pribadi
 */
function showStudentVerificationDialog(currentClass) {
  const slot = document.getElementById('student-verification-modal-slot');
  if (!slot) return;

  slot.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="card-title" style="margin: 0;">🔍 Cek Nilai & Absensi Pribadi</h3>
          <button class="btn btn-outline btn-sm" id="btn-close-verify-modal">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
            Masukkan <strong>Nomor Induk Siswa (NIS)</strong> dan <strong>Tanggal Lahir</strong> ananda untuk mengakses nilai yang telah dipublikasikan sekolah secara aman.
          </p>
          <div class="form-group">
            <label class="form-label">NIS (Nomor Induk Siswa) *</label>
            <input type="text" id="verify-nis" class="form-input" placeholder="Contoh: 1001 atau 6001" autocomplete="off">
            <span class="form-hint">Dapat dilihat di kartu pelajar / buku rapor.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Tanggal Lahir (Opsional untuk Verifikasi Ganda)</label>
            <input type="date" id="verify-birthdate" class="form-input">
          </div>
          <div id="verify-error-msg" style="display: none; padding: 0.65rem; border-radius: 6px; background: #fee2e2; color: #991b1b; font-size: 0.82rem; margin-bottom: 0.75rem;"></div>

          <div id="verify-result-container" style="display: none;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-close-verify-footer">Tutup</button>
          <button class="btn btn-primary" id="btn-do-verify">Periksa Nilai Saya →</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { slot.innerHTML = ''; };
  document.getElementById('btn-close-verify-modal').onclick = closeModal;
  document.getElementById('btn-close-verify-footer').onclick = closeModal;

  const btnDoVerify = document.getElementById('btn-do-verify');
  btnDoVerify.onclick = async () => {
    const nis = document.getElementById('verify-nis').value.trim();
    const birthDate = document.getElementById('verify-birthdate').value;
    const errorMsg = document.getElementById('verify-error-msg');
    const resultContainer = document.getElementById('verify-result-container');

    errorMsg.style.display = 'none';
    resultContainer.style.display = 'none';

    if (!nis) {
      errorMsg.textContent = "NIS wajib diisi!";
      errorMsg.style.display = 'block';
      return;
    }

    btnDoVerify.disabled = true;
    btnDoVerify.textContent = "Memverifikasi...";

    try {
      const res = await verifyStudentAccess(nis, birthDate);
      if (res.error) {
        errorMsg.textContent = res.error;
        errorMsg.style.display = 'block';
      } else {
        // Tampilkan Nilai & Kehadiran Pribadi
        resultContainer.style.display = 'block';
        resultContainer.innerHTML = `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem;">
            <div style="font-weight: 700; color: #166534; font-size: 1rem;">${res.student.nama_siswa}</div>
            <div style="font-size: 0.8rem; color: #15803d;">NIS: ${res.student.nis} | Kelas: ${res.student.kelas_id === 'kelas_1' ? 'Kelas 1' : 'Kelas 6'}</div>
          </div>

          <h5 style="font-weight: 700; margin-bottom: 0.4rem; font-size: 0.9rem;">📝 Nilai yang Dipublikasikan</h5>
          ${res.grades.length === 0 ? `
            <p style="font-size: 0.8rem; color: #64748b;">Belum ada nilai yang dipublikasikan untuk ananda.</p>
          ` : `
            <div class="table-responsive" style="margin-bottom: 1rem;">
              <table class="table" style="font-size: 0.8rem;">
                <thead>
                  <tr>
                    <th>Mata Pelajaran</th>
                    <th>Penilaian</th>
                    <th>Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  ${res.grades.map(g => `
                    <tr>
                      <td>${g.mata_pelajaran}</td>
                      <td>${g.nama_penilaian}</td>
                      <td><strong style="color: #1e3a8a; font-size: 0.95rem;">${g.nilai}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}

          <h5 style="font-weight: 700; margin-bottom: 0.4rem; font-size: 0.9rem;">📅 Riwayat Kehadiran Terakhir</h5>
          ${res.attendance.length === 0 ? `
            <p style="font-size: 0.8rem; color: #64748b;">Belum ada catatan kehadiran.</p>
          ` : `
            <div style="max-height: 140px; overflow-y: auto;">
              ${res.attendance.slice(-5).reverse().map(a => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 0.8rem;">
                  <span>${a.tanggal}</span>
                  <span class="badge ${a.status_absensi === 'Hadir' ? 'badge-success' : 'badge-warning'}">${a.status_absensi}</span>
                </div>
              `).join('')}
            </div>
          `}
        `;
      }
    } catch (e) {
      errorMsg.textContent = "Terjadi kesalahan sistem: " + e.message;
      errorMsg.style.display = 'block';
    } finally {
      btnDoVerify.disabled = false;
      btnDoVerify.textContent = "Periksa Nilai Saya →";
    }
  };
}
