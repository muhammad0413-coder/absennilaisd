# SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD (KELAS 1 & KELAS 6)

Aplikasi web modern, responsif, dan **Progressive Web App (PWA)** yang dirancang khusus untuk Sekolah Dasar dalam mengelola administrasi siswa **Kelas 1** dan **Kelas 6**.

Dibangun dengan arsitektur **Google Sheets sebagai Master Database**, **Cloud Firestore sebagai cache operasional cepat**, **Firebase Authentication untuk sistem login aman**, **Google Drive untuk penyimpanan dokumen & foto**, serta **Google Apps Script sebagai secure integration backend**.

---

## 📌 Daftar Isi
1. [Fitur Unggulan](#-fitur-unggulan)
2. [Arsitektur & Tumpukan Teknologi](#-arsitektur--tumpukan-teknologi)
3. [Struktur Folder Proyek](#-struktur-folder-proyek)
4. [Panduan Instalasi & Pengembangan Lokal](#-panduan-instalasi--pengembangan-lokal)
5. [Panduan Konfigurasi Eksternal](#-panduan-konfigurasi-eksternal)
   - [A. Google Sheets Master Database](#a-google-sheets-master-database)
   - [B. Google Apps Script Backend (Code.gs)](#b-google-apps-script-backend-codegs)
   - [C. Google Drive Folders](#c-google-drive-folders)
   - [D. Firebase Authentication & Firestore](#d-firebase-authentication--firestore)
6. [Deployment ke GitHub dan Vercel](#-deployment-ke-github-dan-vercel)
7. [Keamanan & Integritas Data](#-keamanan--integritas-data)

---

## 🌟 Fitur Unggulan

### 1. Hak Akses Berjenjang & Terisolasi (RBAC)
- **Admin**: Akses penuh mengelola Kelas 1, Kelas 6, data guru, akun, sinkronisasi, jadwal, pengumuman, dan pengaturan sekolah.
- **Guru Kelas 1**: Khusus mengelola siswa, absensi, nilai, dan jadwal Kelas 1. Ditolak secara mutlak jika mencoba mengakses atau memanipulasi data Kelas 6.
- **Guru Kelas 6**: Khusus mengelola siswa, absensi, nilai, dan jadwal Kelas 6. Ditolak jika mencoba mengakses data Kelas 1.
- **Siswa / Wali**: Halaman publik ramah anak untuk memilih Kelas 1 atau Kelas 6, melihat profil guru, jadwal, pengumuman, dan rekap umum kelas.
- **Cek Nilai Privat Siswa**: Siswa/wali dapat memverifikasi NIS dan tanggal lahir untuk melihat rapor capaian pribadi tanpa membocorkan data siswa lain.

### 2. Manajemen Siswa & Mekanisme Soft Deletion
- Guru dapat mendaftarkan siswa baru langsung ke kelasnya dengan validasi duplikasi NIS.
- **Mekanisme Aman**: Tindakan mengeluarkan siswa dari kelas menggunakan *soft deletion* (`status_aktif = 'nonaktif'`) yang mewajibkan pencatatan alasan dan pengguna yang melakukan tindakan. Seluruh histori nilai dan kehadiran **TIDAK DIHAPUS** dan dapat dipulihkan kapan saja.

### 3. Profil Guru & Upload Foto ke Google Drive
- Guru dapat mengganti foto profil miliknya dengan pratinjau langsung (*live preview*), validasi format (JPG, PNG, WebP) dan ukuran maksimal 2MB.
- Foto diunggah langsung ke Google Drive subfolder `FOTO_GURU` melalui Apps Script backend.

### 4. Presensi & Penilaian Kurikulum Merdeka
- Presensi harian dengan status **Hadir, Sakit, Izin, Alpa**, catatan, dan perlindungan anti-duplikasi per siswa per tanggal.
- Penilaian lengkap: Formatif (Tugas/Kuis), Sumatif Lingkup Materi, dan Sumatif Akhir Semester (SAS).
- Opsi publikasi nilai: Draft (hanya guru/admin) atau Dipublikasikan (dapat dilihat siswa/wali).

### 5. Format Cetak Resmi (@media print) & Ekspor CSV
- Tombol cetak langsung membuka dialog cetak browser dengan format kertas resmi (A4/F4).
- Otomatis memuat Kop Surat Sekolah resmi (Nama Sekolah, NPSN, Alamat, Garis Ganda) dan kolom tanda tangan Kepala Sekolah & Guru Kelas.
- Ekspor data siswa, absensi, nilai, dan audit log ke file CSV.

### 6. PWA & Responsivitas HP
- Berjalan optimal pada HP Android, tablet, laptop, dan komputer desktop.
- Web App Manifest (`manifest.webmanifest`) dan Service Worker (`sw.js`) untuk caching shell statis dan indikator status koneksi (Online/Offline).

---

## 🛠️ Arsitektur & Tumpukan Teknologi

- **Frontend**: HTML5, CSS3 Modern (Custom Design System Deep Navy `#1e3a8a` & Bright Sky Blue `#0284c7`), JavaScript Modular ES6+, Vite.
- **Autentikasi**: Firebase Authentication (Email/Password, Password Reset, Verification).
- **Database Master**: Google Sheets (1 Spreadsheet dengan 11 Sheet Terstruktur).
- **Database Cache & Realtime**: Cloud Firestore (dengan Firebase Security Rules ketat).
- **Penyimpanan Berkas**: Google Drive (`DATA_SEKOLAH` -> `FOTO_GURU`, `FOTO_SISWA`, `DOKUMEN_SEKOLAH`, `LAPORAN`).
- **Integration Backend**: Google Apps Script (`backend/Code.gs`).
- **Hosting & Deployment**: Vercel & GitHub.

---

## 📂 Struktur Folder Proyek

```text
absen/
├── .env.example              # Template variabel lingkungan (Client-safe)
├── .gitignore                # Aturan file yang diabaikan Git (mencegah kebocoran rahasia)
├── index.html                # Entry point HTML5 & meta PWA
├── package.json              # Konfigurasi dependensi (Vite & Firebase)
├── vercel.json               # Konfigurasi rewrite SPA & security header Vercel
├── vite.config.js            # Konfigurasi bundler Vite
├── firestore.rules           # Aturan keamanan database Cloud Firestore
├── backend/
│   └── Code.gs               # Backend API Google Apps Script (Sheets, Drive, Firestore)
├── public/
│   ├── manifest.webmanifest  # Web App Manifest PWA
│   ├── sw.js                 # Service worker caching & offline indicator
│   └── icons/                # Ikon aplikasi PWA (192x192 & 512x512)
├── src/
│   ├── main.js               # Bootstrap aplikasi & service worker register
│   ├── style.css             # Master stylesheet & @media print styles
│   ├── firebase.js           # Inisialisasi Firebase Auth & Firestore
│   ├── auth.js               # Pengelola sesi login, logout, & reset password
│   ├── permissions.js        # RBAC: Aturan hak akses Admin, Guru K1, Guru K6, Siswa
│   ├── services.js           # Unified Data Layer (GAS, Firestore, Demo Cache)
│   ├── router.js             # Client-side router & route protection guard
│   ├── components/
│   │   ├── Navbar.js         # Topbar navigasi & status koneksi
│   │   ├── Sidebar.js        # Sidebar menu berjenjang per role
│   │   ├── Toast.js          # Notifikasi pop-up (Sukses, Error, Warning)
│   │   ├── Modal.js          # Modal konfirmasi & form dialog
│   │   └── ReportPrint.js    # Utilitas cetak kop surat resmi & ekspor CSV
│   └── pages/
│       ├── StudentPublicPage.js  # Halaman siswa ramah anak & cek nilai privat
│       ├── LoginPage.js          # Halaman login staf / guru
│       ├── TeacherDashboard.js   # Dashboard guru kelas (manajemen siswa & soft-delete)
│       ├── TeacherProfile.js     # Profil guru & upload foto ke Drive
│       ├── AttendancePage.js     # Presensi harian & rekap kehadiran
│       ├── GradesPage.js         # Penilaian formatif/sumatif & publikasi
│       ├── AdminDashboard.js     # Pusat kontrol admin menyeluruh
│       ├── SchedulePage.js       # Manajemen jadwal pelajaran
│       ├── AnnouncementsPage.js  # Manajemen pengumuman kelas
│       ├── SyncStatusPage.js     # Monitor sinkronisasi Sheets-Firestore
│       ├── AuditLogPage.js       # Jejak audit aktivitas pengguna
│       └── SettingsPage.js       # Pengaturan identitas sekolah
└── tests/
    └── verify-all.js         # Pengujian otomatis hak akses & otorisasi
```

---

## 💻 Panduan Instalasi & Pengembangan Lokal

### 1. Prasyarat
- Node.js versi 18+ atau 20+.
- Peramban web modern (Google Chrome, Edge, Firefox).

### 2. Langkah Instalasi
```bash
# Clone repository
git clone https://github.com/USERNAME/sd-absensi-penilaian.git
cd sd-absensi-penilaian

# Install dependensi
npm install

# Buat file konfigurasi lingkungan
cp .env.example .env

# Jalankan server pengembangan lokal
npm run dev
```
Aplikasi akan aktif di `http://localhost:3000`.

### 3. Menjalankan Pengujian Otorisasi & Build
```bash
# Menjalankan unit test aturan otorisasi & keamanan
npm test

# Menjalankan build bundle produksi Vite
npm run build
```

---

## ⚙️ Panduan Konfigurasi Eksternal

### A. Google Sheets Master Database
1. Buka [Google Sheets](https://sheets.google.com/) dan buat spreadsheet baru bernama:
   **`DATABASE ABSENSI DAN PENILAIAN SD`**
2. Spreadsheet ini terdiri dari 11 Sheet terstruktur:
   - `SISWA`: Data induk siswa kelas 1 dan kelas 6.
   - `GURU`: Data guru dan penugasan kelas.
   - `KELAS`: Data kelas operasional (`kelas_1` dan `kelas_6`).
   - `AKUN_PENGGUNA`: Relasi UID login, email, role, dan status akun.
   - `ABSENSI`: Log presensi harian per siswa per tanggal.
   - `NILAI`: Nilai formatif dan sumatif siswa.
   - `JADWAL`: Jadwal pelajaran mingguan per kelas.
   - `PENGUMUMAN`: Pengumuman dengan target kelas.
   - `PENGATURAN`: Pengaturan identitas sekolah, kepala sekolah, dan semester.
   - `LOG_AKTIVITAS`: Audit trail aktivitas sistem.
   - `STATUS_SINKRONISASI`: Catatan status sinkronisasi Sheets-Firestore.

> **Tips Cepat:** Anda tidak perlu membuat 11 sheet ini secara manual satu per satu! Buka menu **Extensions > Apps Script** di spreadsheet tersebut, tempelkan kode dari file [`backend/Code.gs`](backend/Code.gs), lalu jalankan fungsi `setupDatabaseAndFolders()`. Seluruh sheet, kolom header, data default, dan folder Drive akan terbuat otomatis dalam beberapa detik!

### B. Google Apps Script Backend (Code.gs)
1. Pada editor Apps Script spreadsheet Anda:
   - Salin seluruh isi file [`backend/Code.gs`](backend/Code.gs) ke file `Code.gs`.
2. Klik tombol **Deploy > New deployment**.
3. Pilih jenis: **Web app**.
   - **Description**: `API Absensi SD v1`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone` (atau `Anyone with Google account`)
4. Klik **Deploy** dan berikan izin otorisasi Google Workspace.
5. Salin URL Web App yang dihasilkan (berawalan `https://script.google.com/macros/s/.../exec`).
6. Masukkan URL tersebut ke file `.env` pada variabel:
   ```env
   VITE_GAS_API_URL="https://script.google.com/macros/s/AKfycbx.../exec"
   ```

### C. Google Drive Folders
Fungsi `setupDatabaseAndFolders()` di Apps Script akan otomatis membuat struktur folder di Google Drive Anda:
- `DATA_SEKOLAH` (Folder Induk)
  - `FOTO_GURU` (Tempat penyimpanan foto profil guru)
  - `FOTO_SISWA` (Tempat foto identitas siswa)
  - `DOKUMEN_SEKOLAH` (Arsip berkas administrasi)
  - `LAPORAN` (Ekspor laporan resmi)

### D. Firebase Authentication & Firestore
1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru.
2. Di menu **Authentication > Sign-in method**:
   - Aktifkan provider **Email/Password**.
3. Di menu **Firestore Database**:
   - Buat database dalam mode Production.
   - Buka tab **Rules** dan salin isi file [`firestore.rules`](firestore.rules).
   - Klik **Publish**.
4. Di menu **Project Settings > General > Your apps**:
   - Tambahkan Web App (`</>`).
   - Salin konfigurasi Firebase SDK dan masukkan ke file `.env`:
     ```env
     VITE_FIREBASE_API_KEY="AIzaSy..."
     VITE_FIREBASE_AUTH_DOMAIN="sd-absensi-penilaian.firebaseapp.com"
     VITE_FIREBASE_PROJECT_ID="sd-absensi-penilaian"
     VITE_FIREBASE_STORAGE_BUCKET="sd-absensi-penilaian.appspot.com"
     VITE_FIREBASE_MESSAGING_SENDER_ID="..."
     VITE_FIREBASE_APP_ID="1:...:web:..."
     ```

---

## 🚀 Deployment ke GitHub dan Vercel

### 1. Push ke GitHub
```bash
git add .
git commit -m "feat: complete SD absensi & penilaian system for grade 1 and 6"
git branch -M main
git remote add origin https://github.com/USERNAME/sd-absensi-penilaian.git
git push -u origin main
```

### 2. Hubungkan ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/) dan klik **Add New > Project**.
2. Pilih repository GitHub `sd-absensi-penilaian`.
3. Framework Preset: **Vite** (otomatis terdeteksi).
4. Di bagian **Environment Variables**, tambahkan variabel dari file `.env`:
   - `VITE_GAS_API_URL`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Klik **Deploy**. Aplikasi akan online dalam waktu kurang dari 1 menit!

---

## 🔒 Keamanan & Integritas Data

1. **Zero Client Secrets**: Tidak ada kunci rahasia server (*Service Account Key*, token privat) yang disertakan pada kode frontend atau repository publik.
2. **Backend Verified RBAC**: Hak akses guru diperiksa di sisi server (Google Apps Script & Firestore Rules). Guru tidak dapat memanipulasi kelas lain hanya dengan mengubah URL atau kode browser.
3. **Soft-Delete Protektif**: Siswa yang dinonaktifkan tidak dihapus permanen untuk melindungi nilai rapor dan rekap kehadiran historis.
4. **Perlindungan Privasi Siswa**: Siswa hanya dapat melihat nilai miliknya sendiri setelah verifikasi NIS; nilai siswa lain tidak pernah dikirimkan ke peramban publik.
