# Rencana Implementasi: Sistem Informasi Absensi, Nilai, dan Rapor Siswa SD (Kelas 1–6)

Dokumen ini mendefinisikan arsitektur lengkap, skema database, alur sinkronisasi dua arah, hak akses multi-peran, dan rencana tahapan pembangunan aplikasi dari nol (*zero to production*).

---

## 1. Arsitektur Sistem & Spesifikasi Teknis

Aplikasi dibangun menggunakan arsitektur modern web application:
- **Frontend**: React 18 / Vite / TypeScript / Tailwind CSS / Lucide Icons / Recharts
- **Database Operasional**: Firebase Cloud Firestore + Firebase Authentication
- **Database Induk & Arsip**: Google Sheets (9 lembar kerja terstruktur) + Google Drive
- **Integrasi Backend**: Google Apps Script Web App (API Router dengan otorisasi & LockService)
- **Cetak Dokumen**: Standard Print CSS (`@media print`) untuk kertas A4 Portrait & Landscape

---

## 2. Struktur Hak Akses (RBAC)

1. **Administrator**:
   - Kontrol total kelas 1–6, data siswa, akun pengguna, guru kelas, tahun pelajaran, semester, mata pelajaran, jenis asesmen.
   - Manajemen konfigurasi Google Sheets, Apps Script, Google Drive, status Firebase.
   - Monitoring audit log, profil sekolah, logo, dan identitas kepala sekolah.
2. **Guru Kelas**:
   - Dibatasi hanya pada kelas yang ditugaskan (contoh: Guru Kelas 3 hanya berhak atas siswa Kelas 3).
   - Pengisian absensi harian massal & individual (Hadir, Sakit, Izin, Alpa).
   - Input nilai asesmen (Formatif, Sumatif Lingkup Materi, STS, SAS) rentang 0–100.
   - Input deskripsi capaian kompetensi dan catatan rapor.
   - Manajemen profil sendiri (foto profil via Drive, nama, ubah password Firebase).
   - Cetak absensi, rekap nilai, dan rapor kelas binaannya.
3. **Kepala Sekolah**:
   - Pemantauan *read-only* tingkat sekolah: statistik absensi per kelas, kelengkapan input nilai guru, rekapitulasi semester, cetak laporan sekolah.
4. **Siswa / Orang Tua (Portal Publik)**:
   - Autentikasi independen berbasis Kelas + NISN/ID Siswa + PIN Keamanan.
   - Akses murni *read-only* ke data pribadi, rekap kehadiran siswa bersangkutan, dan pratinjau rapor semester aktif tanpa akses ke siswa lain.

---

## 3. Skema Basis Data

### 3.1 Cloud Firestore Collections
- `users`: `{ uid, name, email, role, assignedClasses, photoURL, active, createdAt, updatedAt }`
- `students`: `{ studentId, nis, nisn, name, gender, birthPlace, birthDate, parentName, address, class, schoolYear, status, photoURL, createdAt, updatedAt, source, syncStatus }`
- `attendance`: `{ attendanceId, studentId, studentName, class, date, schoolYear, semester, status, notes, createdBy, updatedBy, createdAt, updatedAt, syncStatus }`
- `grades`: `{ gradeId, studentId, studentName, class, subject, assessmentType, material, score, description, schoolYear, semester, createdBy, updatedBy, createdAt, updatedAt, syncStatus }`
- `schoolProfile`: `{ id, name, npsn, address, village, subdistrict, regency, province, logoUrl, principalName, principalNip, academicYear, activeSemester }`
- `settings`: `{ key, value, description, updatedAt }` (Mata pelajaran, bobot asesmen, skala nilai, KKM)
- `syncJobs`: `{ id, type, direction, count, success, failed, status, message, timestamp }`
- `auditLogs`: `{ id, timestamp, userId, userName, action, dataType, dataId, details }`
- `studentPortalAccess`: `{ studentId, nisn, accessPin, class, lastLogin }`

### 3.2 Google Sheets Schema (9 Sheets)
1. `Data_Siswa`: ID_Siswa, NIS, NISN, Nama_Lengkap, Jenis_Kelamin, Tempat_Lahir, Tanggal_Lahir, Nama_Orang_Tua, Alamat, Kelas, Tahun_Pelajaran, Status_Siswa, Foto_URL, Created_At, Updated_At, Updated_By, Sync_Status
2. `Data_Guru`: User_ID, Nama_Guru, Email, NIP, Foto_URL, Kelas_Ditugaskan, Role, Status, Created_At, Updated_At
3. `Data_Absensi`: ID_Absensi, Tanggal, Tahun_Pelajaran, Semester, Kelas, ID_Siswa, NIS, NISN, Nama_Siswa, Status_Absensi, Keterangan, Diinput_Oleh, Updated_At, Sync_Status
4. `Data_Nilai`: ID_Nilai, Tahun_Pelajaran, Semester, Kelas, ID_Siswa, NIS, NISN, Nama_Siswa, Mata_Pelajaran, Jenis_Asesmen, Lingkup_Materi, Nilai, Deskripsi, Diinput_Oleh, Updated_At, Sync_Status
5. `Pengaturan`: Nama_Pengaturan, Nilai_Pengaturan, Keterangan, Updated_At
6. `Pengguna`: User_ID, Nama, Email, Role, Kelas_Ditugaskan, Status, Updated_At
7. `Log_Sinkronisasi`: ID_Log, Waktu, Jenis_Data, Arah_Sinkronisasi, Jumlah_Data, Berhasil, Gagal, Status, Pesan
8. `Log_Aktivitas`: ID_Aktivitas, Waktu, User_ID, Nama_Pengguna, Aktivitas, Jenis_Data, ID_Data, Keterangan
9. `Antrean_Sinkronisasi`: ID_Transaksi, Jenis_Data, ID_Data, Operasi, Payload_JSON, Status, Percobaan, Pesan_Error, Created_At, Updated_At

---

## 4. Alur Integrasi Google Apps Script
- File Apps Script disimpan di folder `apps-script/`:
  - `Code.gs`, `Config.gs`, `Authentication.gs`, `SpreadsheetService.gs`, `FirebaseService.gs`, `StudentService.gs`, `AttendanceService.gs`, `GradeService.gs`, `DriveService.gs`, `SyncService.gs`, `ValidationService.gs`, `LogService.gs`, `ApiRouter.gs`, `appsscript.json`.
- Web App dengan routing parameter `action`, otorisasi Bearer ID Token / API Secret, LockService untuk concurrency safety, dan output JSON standar.
