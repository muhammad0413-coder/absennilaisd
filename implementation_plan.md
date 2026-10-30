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

## 2. Status Tahapan Eksekusi Pembangunan

- [x] **Tahap 1**: Analisis kebutuhan & inisialisasi dokumen arsitektur (`implementation_plan.md`).
- [x] **Tahap 2**: Inisialisasi struktur proyek React 18 + Vite + TypeScript 5 + Tailwind CSS v3 + Lucide Icons + Recharts.
- [x] **Tahap 3**: Implementasi lapisan Service & Backend Google Apps Script (`apps-script/*.gs` lengkap 14 file).
- [x] **Tahap 4**: Implementasi modul Firebase (`firebase.ts`, Firestore rules, composite indexes, auth service, audit logs).
- [x] **Tahap 5**: Pembangunan Core UI, Navigasi Responsif, Layout, Tema (Navy `#0F2B5C`, Biru `#1E40AF`, Abu `#F1F5F9`).
- [x] **Tahap 6**: Pembangunan Modul Dashboard Dinamis (Admin, Guru, Kepala Sekolah).
- [x] **Tahap 7**: Pembangunan Modul Siswa (CRUD, filter kelas 1–6, status mutasi, import/export CSV & Excel).
- [x] **Tahap 8**: Pembangunan Modul Absensi Harian & Rekapitulasi (Input massal, hadir semua, persentase kehadiran).
- [x] **Tahap 9**: Pembangunan Modul Nilai & Rekap Nilai (Formatif, Sumatif, STS, SAS, deskripsi capaian).
- [x] **Tahap 10**: Pembangunan Modul Rapor Siswa & Engine Cetak A4 / PDF (`@media print` single & batch 1 kelas).
- [x] **Tahap 11**: Pembangunan Modul Sinkronisasi Dua Arah & Kartu Status (Sheets, Drive, Apps Script, Firebase).
- [x] **Tahap 12**: Pembangunan Modul Pengguna, Profil Guru (Unggah Foto ke Drive), & Pengaturan Sekolah.
- [x] **Tahap 13**: Pembangunan Portal Mandiri Siswa & Orang Tua (Verifikasi NISN + PIN/Tanggal Lahir).
- [x] **Tahap 14**: Pembuatan Dokumentasi Lengkap (`README.md`, `USER_GUIDE.md`, `SETUP_*.md`, `DEPLOYMENT.md`, `SECURITY.md`, `TEST_REPORT.md`).
- [x] **Tahap 15**: Pengujian Kompilasi Produksi (`npm run build`), verifikasi tidak ada error TypeScript, verifikasi git commit.
