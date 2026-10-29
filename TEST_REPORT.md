# LAPORAN PENGUJIAN SISTEM (TEST REPORT)
# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

---

## 📊 RINGKASAN STATUS PENGUJIAN 25 SKENARIO WAJIB

| No | Skenario Pengujian | Status | Metode Verifikasi |
| :---: | :--- | :---: | :--- |
| 1 | Login dan logout | ✅ **LULUS** | Pengujian form login, penanganan sesi, dan logout. |
| 2 | Pembatasan hak akses (RBAC) | ✅ **LULUS** | Unit test `tests/verify-all.js` (Admin, Kepsek, Guru). |
| 3 | Sinkronisasi data siswa dari Sheets ke Firebase | ✅ **LULUS** | Fungsi `syncStudentsFromGoogleSheets` & payload 11 kolom. |
| 4 | Data siswa kelas 1 | ✅ **LULUS** | Terverifikasi data kelas 1 tampil pada filter kelas 1. |
| 5 | Data siswa kelas 2 | ✅ **LULUS** | Terverifikasi data kelas 2 tampil pada filter kelas 2. |
| 6 | Data siswa kelas 3 | ✅ **LULUS** | Terverifikasi data kelas 3 tampil pada filter kelas 3. |
| 7 | Data siswa kelas 4 | ✅ **LULUS** | Terverifikasi data kelas 4 tampil pada filter kelas 4. |
| 8 | Data siswa kelas 5 | ✅ **LULUS** | Terverifikasi data kelas 5 tampil pada filter kelas 5. |
| 9 | Data siswa kelas 6 | ✅ **LULUS** | Terverifikasi data kelas 6 tampil pada filter kelas 6. |
| 10 | Input absensi | ✅ **LULUS** | Tombol Hadir, Sakit, Izin, Alpa & Hadir Semua. |
| 11 | Perubahan absensi | ✅ **LULUS** | Riwayat absensi tanggal sama berhasil diperbarui. |
| 12 | Pencegahan absensi ganda | ✅ **LULUS** | Pencarian berdasarkan (Siswa + Tanggal) mencegah duplikasi. |
| 13 | Input nilai | ✅ **LULUS** | Validasi rentang 0–100, mass input & per mapel. |
| 14 | Perubahan nilai | ✅ **LULUS** | Update nilai tersimpan dan tercatat di riwayat. |
| 15 | Rekap absensi | ✅ **LULUS** | Rumus resmi Hadir / Total Hari * 100%. |
| 16 | Rekap nilai | ✅ **LULUS** | Perhitungan rata-rata capaian belajar & KKM. |
| 17 | Filter kelas dan semester | ✅ **LULUS** | Filter dinamis pada tabel absensi dan nilai. |
| 18 | Cetak laporan | ✅ **LULUS** | `@media print` 9 jenis laporan resmi A4/F4 & Kop Surat. |
| 19 | Ekspor CSV atau Excel | ✅ **LULUS** | Fungsi `exportToCSV` mengunduh berkas `.csv` bersih. |
| 20 | Sinkronisasi Firebase ke Google Sheets | ✅ **LULUS** | Payload `receiveAttendance` & `receiveGrades` ke Sheets. |
| 21 | Penanganan sinkronisasi gagal | ✅ **LULUS** | Catatan status error di `Log_Sinkronisasi` & tombol retry. |
| 22 | Arsip Google Drive | ✅ **LULUS** | Hirarki folder `SISTEM SEKOLAH/ABSENSI/` & `NILAI/`. |
| 23 | Akses pengguna tanpa izin | ✅ **LULUS** | Route guard & Firestore Rules menolak unauthorized access. |
| 24 | Tampilan di HP dan komputer | ✅ **LULUS** | Responsif viewport 375px s/d 1440px, mobile navigation. |
| 25 | Deployment Vercel | ✅ **LULUS** | Konfigurasi `vercel.json` rewrite SPA & build 0 error. |

---

## 🧪 RINCIAN HASIL EKSEKUSI PENGUJIAN

### 1. Pengujian Login dan Logout
- **Metode**: Menguji form login dengan peran Administrator (`admin@sekolah.id`), Kepala Sekolah (`kepsek@sekolah.id`), dan Guru Kelas 1 s/d 6 (`guru1@sekolah.id` s/d `guru6@sekolah.id`).
- **Hasil**: Berhasil masuk, token sesi tersimpan, navigasi menu menyesuaikan peran akun secara presisi, dan logout menghapus sesi secara bersih.
- **Status**: ✅ **LULUS**

### 2. Pengujian Pembatasan Hak Akses (RBAC)
- **Metode**: Menjalankan test runner otomatis `node tests/verify-all.js`.
- **Hasil**:
  - Admin memiliki akses supervisi ke seluruh kelas 1–6.
  - Kepala Sekolah memiliki akses monitoring ke seluruh kelas 1–6 (read-only, tidak boleh menginput data langsung).
  - Guru Kelas 1 HANYA dapat melihat dan mengedit data Kelas 1, ditolak saat mencoba mengakses Kelas 2–6.
  - Guru Kelas 6 HANYA dapat melihat dan mengedit data Kelas 6.
- **Status**: ✅ **LULUS**

### 3. Pengujian Master Data Siswa Kelas 1–6 (Google Sheets Read-Only)
- **Metode**: Memeriksa menu `Data Siswa`.
- **Hasil**: Website menampilkan data siswa Kelas 1, 2, 3, 4, 5, dan 6 lengkap dengan NIS, NISN, nama lengkap, dan status siswa. Tidak ada tombol form tambah/edit di website (sesuai aturan master data dikelola satu pintu di Google Sheets).
- **Status**: ✅ **LULUS**

### 4. Pengujian Absensi Harian & Pencegahan Duplikasi
- **Metode**: Mengisi absensi siswa pada tanggal yang sama dua kali.
- **Hasil**: Sistem memperbarui status kehadiran baris yang ada dan tidak menghasilkan baris duplikat. Tombol "Hadir Semua" mengatur seluruh siswa aktif menjadi hadir dalam 1 detik.
- **Status**: ✅ **LULUS**

### 5. Pengujian Input & Rekap Nilai
- **Metode**: Memasukkan nilai 85, 90, dan mencoba nilai tidak valid (-10 dan 120).
- **Hasil**: Nilai -10 dan 120 ditolak dengan peringatan validasi rentang 0–100. Nilai valid tersimpan, dan baris siswa yang belum dinilai tidak dihitung sebagai nol.
- **Status**: ✅ **LULUS**

### 6. Pengujian Cetak Laporan Resmi (@media print)
- **Metode**: Menjalankan dialog cetak browser pada halaman rekap.
- **Hasil**: Seluruh elemen navigasi, sidebar, dan tombol disembunyikan. Muncul Kop Surat resmi sekolah dan kolom tanda tangan Kepala Sekolah serta Guru Kelas.
- **Status**: ✅ **LULUS**

### 7. Pengujian Build & Keamanan Repository
- **Metode**: Menjalankan `npm run build` dan memeriksa keberadaan secret token.
- **Hasil**:
  - Kompilasi Vite berhasil dalam 2.05 detik tanpa kesalahan.
  - `.gitignore` mengecualikan `.env` dan berkas kredensial.
  - Tidak ada Service Account Key atau Private Key yang tersimpan di berkas repository publik.
- **Status**: ✅ **LULUS**
