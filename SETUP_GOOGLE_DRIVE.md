# PANDUAN PENGATURAN GOOGLE DRIVE (SETUP_GOOGLE_DRIVE.md)
## SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD

Google Drive digunakan sebagai media penyimpanan awan (*cloud archive*) untuk foto profil guru, foto siswa, arsip rapor semester, serta salinan berkas rekap absensi dan nilai dalam format dokumen permanen.

---

## 1. Struktur Folder Google Drive Otomatis

Sistem secara otomatis membangun struktur folder teratur di Google Drive akun Anda saat fungsi inisialisasi dijalankan:

```text
My Drive (Google Drive Utama)/
└── SISTEM INFORMASI SEKOLAH/
    ├── FOTO_GURU/              <- Foto profil guru kelas & kepala sekolah
    ├── FOTO_SISWA/             <- Pas foto siswa rombel
    ├── LAPORAN_ABSENSI/        <- Berkas arsip rekap absensi bulanan/semester
    ├── LAPORAN_NILAI/          <- Berkas rekapitulasi nilai akhir & leger
    ├── RAPOR/                  <- Arsip rapor digital per siswa
    ├── ARSIP_SEMESTER/         <- Bundel laporan akhir semester
    └── DOKUMEN_ADMINISTRASI/   <- SK pembagian tugas dan administrasi lain
```

---

## 2. Inisialisasi Melalui Google Apps Script

1. Pastikan Anda telah mengikuti `SETUP_APPS_SCRIPT.md`.
2. Saat fungsi `runInitialization()` dijalankan di Apps Script, fungsi `initializeDriveFolders()` di `DriveService.gs` akan memeriksa apakah folder `SISTEM INFORMASI SEKOLAH` sudah ada di Drive Anda.
3. Jika belum ada, folder induk beserta ke-7 subfoldernya dibuat secara otomatis.
4. ID folder induk disimpan secara otomatis pada Script Properties dengan kunci `DRIVE_ROOT_FOLDER_ID`.
5. Anda dapat memverifikasi dengan membuka [Google Drive](https://drive.google.com/) dan melihat folder baru bernama `SISTEM INFORMASI SEKOLAH`.

---

## 3. Kebijakan Keamanan dan Hak Akses Berkas Drive

- **Folder Tidak Dibuat Publik**: Seluruh folder utama dan subfolder bersifat **Private** (hanya dapat diakses oleh akun Google pemilik dan backend Apps Script).
- **Foto Profil Guru**: Saat guru mengunggah foto profil di aplikasi, berkas foto disimpan di subfolder `FOTO_GURU` dan diberi izin *Anyone with link can view* khusus untuk berkas foto tersebut agar avatar guru dapat dirender di browser, sementara folder induknya tetap terlindungi.
- **Batas Ukuran Berkas**:
  - Foto avatar guru/siswa: Maksimal **5 MB** (format: `.jpg`, `.png`, `.webp`).
  - Berkas arsip rapor/dokumen: Maksimal **25 MB** (format: `.pdf`, `.xlsx`, `.html`).
- **Resiliensi Sistem**: Jika Google Drive mengalami gangguan jaringan atau kuota penyimpanan Google Anda penuh, sistem aplikasi web akan tetap menyimpan data absensi dan nilai di Firebase Firestore dengan aman tanpa kehilangan data.

---

## 4. Cara Mengunggah Foto Profil Guru

1. Masuk ke aplikasi web sebagai guru.
2. Klik nama atau avatar Anda di pojok kanan atas untuk membuka jendela **Profil Pengguna Saya**.
3. Klik ikon kamera pada lingkaran foto profil.
4. Pilih berkas foto dari komputer atau gawai Anda.
5. Aplikasi akan mengirimkan berkas base64 ke Google Apps Script dan menyimpannya langsung ke subfolder `FOTO_GURU` di Google Drive.
6. Tautan foto langsung diperbarui di profil pengguna dan sheet `Data_Guru`.

---

## 5. Cara Mengarsipkan Rapor Siswa ke Drive

1. Masuk ke aplikasi web, buka menu **Rapor Siswa**.
2. Pilih siswa yang ingin diarsipkan.
3. Klik tombol hijau **Arsip ke Drive**.
4. Salinan laporan rapor lengkap dengan nilai, absensi, dan catatan wali kelas akan langsung tersimpan di subfolder `RAPOR/` di Google Drive.
