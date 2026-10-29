# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

Aplikasi Web Modern dan Progressive Web App (PWA) untuk Pengelolaan Absensi, Nilai, dan Pelaporan Rapor Sekolah Dasar jenjang **Kelas 1 sampai Kelas 6**.

---

## 📌 Ringkasan Arsitektur Sistem

Aplikasi ini menggunakan model pemisahan sumber data yang ketat:

1. **Google Sheets sebagai Master Data Induk Siswa**:
   - Diinput dan diperbarui secara manual oleh Administrator di spreadsheet *DATABASE SISWA SD* (`Data_Siswa`).
   - Website **tidak menyediakan form tambah/edit/hapus** data induk siswa (read-only di website) guna menjaga integritas data satu pintu.
   - Alur data: `Google Sheets → Google Apps Script → Firebase → Website`.
2. **Cloud Firestore sebagai Database Operasional Realtime**:
   - Menyimpan akun pengguna, peran akses, data presensi harian, nilai siswa, dan riwayat perubahan.
3. **Google Sheets sebagai Salinan Laporan Arsip**:
   - Presensi dan nilai yang dimasukkan guru melalui website disimpan ke Firebase, lalu disinkronkan salinannya ke Google Sheets (`Data_Absensi` dan `Data_Nilai`).
   - Alur data: `Website → Firebase → Google Apps Script → Google Sheets`.
4. **Google Drive untuk Pengarsipan Dokumen**:
   - Struktur folder: `SISTEM SEKOLAH/ABSENSI/`, `NILAI/`, dan `LAPORAN/` per tahun pelajaran.

---

## 🛠️ Tumpukan Teknologi

- **Frontend**: HTML5, CSS3, JavaScript Modular ES6+, Vite.
- **Hosting Frontend**: GitHub dan Vercel.
- **Autentikasi**: Firebase Authentication.
- **Database Operasional**: Cloud Firestore (dengan Firestore Security Rules).
- **Database Master Siswa & Arsip**: Google Sheets (6 Sheet Terstruktur).
- **Integration Backend**: Google Apps Script (`backend/Code.gs`).
- **Penyimpanan Dokumen**: Google Drive.

---

## 📂 Struktur Berkas Proyek

```text
absen/
├── .env.example              # Template variabel lingkungan (Client-Safe)
├── .gitignore                # Pengecualian berkas rahasia & build
├── index.html                # Entry point aplikasi
├── package.json              # Dependensi Vite & Firebase
├── vercel.json               # Konfigurasi rewrite SPA & Security Headers
├── vite.config.js            # Konfigurasi Vite
├── firestore.rules           # Aturan keamanan database Firestore
├── backend/
│   └── Code.gs               # Backend API Google Apps Script (Sheets & Drive)
├── public/
│   ├── manifest.webmanifest  # Manifest PWA (bisa diinstall di HP/Desktop)
│   ├── sw.js                 # Service worker caching & status offline
│   └── icons/                # Ikon PWA (192x192 & 512x512)
├── src/
│   ├── main.js               # Bootstrap aplikasi
│   ├── style.css             # Desain sistem & style cetak (@media print)
│   ├── firebase.js           # Inisialisasi Firebase Auth & Firestore
│   ├── auth.js               # Pengelola sesi login & recovery
│   ├── permissions.js        # RBAC: Aturan hak akses Admin, Kepsek, Guru K1-6
│   ├── services.js           # Sinkronisasi data Sheets, Firestore, & Cache
│   ├── router.js             # Client-side router & route guard
│   ├── components/
│   │   ├── Navbar.js         # Topbar & indikator status online
│   │   ├── Sidebar.js        # Navigasi 10 menu sesuai peran
│   │   ├── Toast.js          # Notifikasi pop-up
│   │   ├── Modal.js          # Dialog konfirmasi
│   │   └── ReportPrint.js    # Utilitas cetak kop surat resmi & ekspor CSV
│   └── pages/
│       ├── LoginPage.js             # Halaman login staf & guru
│       ├── DashboardPage.js         # Dashboard statistik kelas 1–6
│       ├── StudentsPage.js          # Data siswa read-only kelas 1–6
│       ├── AttendanceDailyPage.js   # Input presensi harian
│       ├── AttendanceRecapPage.js   # Rekap kehadiran & persentase
│       ├── GradesInputPage.js       # Input nilai formatif & sumatif
│       ├── GradesRecapPage.js       # Rekapitulasi nilai & capaian
│       ├── ReportsPage.js           # Pusat cetak 9 laporan resmi
│       ├── SyncPage.js              # Panel monitoring sinkronisasi data
│       ├── UsersPage.js             # Pengguna & penugasan kelas
│       └── SettingsPage.js          # Pengaturan kurikulum & sekolah
├── tests/
│   └── verify-all.js         # Automated test suite aturan sistem
├── README.md                 # Dokumentasi umum
├── USER_GUIDE.md             # Panduan pengguna (Admin, Guru, Kepsek)
├── SETUP_FIREBASE.md         # Panduan instalasi Firebase
├── SETUP_GOOGLE_SHEETS.md    # Panduan 6 sheet Google Sheets
├── SETUP_GOOGLE_DRIVE.md     # Panduan folder arsip Google Drive
├── DEPLOYMENT.md             # Panduan deployment GitHub & Vercel
└── TEST_REPORT.md            # Laporan hasil pengujian 25 skenario
```

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Lingkungan
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

### 3. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser pada alamat `http://localhost:3000`.

### 4. Menjalankan Pengujian Otomatis
```bash
npm test
```

### 5. Menjalankan Build Produksi
```bash
npm run build
```

---

## 🧪 Akun Cepat Pengujian (Mode Demo Aktif)

Untuk kemudahan pengujian fitur secara langsung sebelum mengisi kredensial Firebase asli:
- **Administrator**: `admin@sekolah.id` / `admin123` (Akses supervisi penuh seluruh K1–6).
- **Kepala Sekolah**: `kepsek@sekolah.id` / `kepsek123` (Monitoring & Cetak Laporan seluruh K1–6).
- **Guru Kelas 1 s/d 6**: `guru1@sekolah.id` s/d `guru6@sekolah.id` / `guru123` (Hanya kelas masing-masing).
