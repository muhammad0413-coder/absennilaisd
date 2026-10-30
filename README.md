# Sistem Informasi Absensi, Nilai, dan Rapor Siswa SD (Kelas 1–6)

Aplikasi web modern, terintegrasi, dan *production-ready* untuk pengelolaan absensi harian, penilaian asesmen (Formatif, Sumatif Lingkup Materi, STS, SAS), cetak rapor Kurikulum Merdeka, serta sinkronisasi dua arah dengan Google Sheets dan Google Drive.

---

## 🌟 Fitur Utama

- **Multi-Peran & Hak Akses Ketat (RBAC)**:
  - **Administrator**: Kontrol penuh data master kelas 1–6, akun pengguna, guru wali kelas, mata pelajaran, identitas sekolah, sinkronisasi Google Workspace, dan audit trail.
  - **Guru Kelas**: Dibatasi hanya pada rombel kelas tugasnya (contoh: Guru Kelas 3 hanya dapat mengelola siswa Kelas 3). Input absensi massal ("Hadir Semua"), input nilai asesmen, pengisian catatan rapor, dan cetak laporan kelas.
  - **Kepala Sekolah**: Pemantauan *read-only* tingkat sekolah, statistik kehadiran harian, ketuntasan input nilai antar kelas, dan cetak rekap eksekutif.
  - **Portal Siswa / Orang Tua**: Portal publik aman dengan verifikasi Kelas + NIS/NISN + PIN/Tanggal Lahir. Bersifat *read-only* dan terisolasi murni ke data siswa bersangkutan (tidak dapat melihat siswa lain).
- **Integrasi Penuh 4 Pilar**:
  1. **Firebase Cloud Firestore**: Database operasional realtime cepat dan terenkripsi.
  2. **Google Sheets**: Master data induk 9 lembar kerja (*Data_Siswa, Data_Guru, Data_Absensi, Data_Nilai, Pengaturan, Pengguna, Log_Sinkronisasi, Log_Aktivitas, Antrean_Sinkronisasi*).
  3. **Google Apps Script**: API Router backend mandiri di folder `apps-script/` dengan `doGet`, `doPost`, LockService, dan verifikasi token.
  4. **Google Drive**: Penyimpanan berkas arsip rapor PDF, rekap nilai, dan foto profil guru dalam folder terstruktur (*SISTEM INFORMASI SEKOLAH/...*).
- **Mesin Cetak Standar Industri (@media print)**:
  - Cetak otomatis format kertas A4 portrait dan landscape dengan kop surat resmi sekolah, tanda tangan kepala sekolah, dan tanda tangan wali kelas.
  - Cetak rapor individual maupun cetak massal 1 kelas sekaligus dengan jeda halaman rapi (*page break*).
- **Ekspor Data**:
  - Ekspor ke berkas Excel (`.xlsx`) dan CSV dengan format UTF-8 BOM yang langsung rapi di Microsoft Excel.

---

## 🛠️ Arsitektur Teknologi

| Komponen | Teknologi |
|---|---|
| Editor & AI Agent | Google Antigravity |
| Framework Frontend | React 18 + TypeScript + Vite |
| Desain & Styling | Tailwind CSS v3 (Tema Navy: `#0F2B5C`, Blue: `#1E40AF`, Slate `#F8FAFC`) |
| Visualisasi Data | Recharts |
| Ikonografi | Lucide React |
| Autentikasi | Firebase Authentication (Email/Password) |
| Database Operasional | Firebase Cloud Firestore |
| Backend Eksternal | Google Apps Script (Web App Engine) |
| Master Data Induk | Google Spreadsheet (9 Sheets) |
| Arsip Berkas | Google Drive API |
| Ekspor File | SheetJS (`xlsx`) & CSV Engine |

---

## 📂 Struktur Direktori Proyek

```text
sistem-absensi-nilai-sd/
├── public/
│   ├── logo.svg
│   └── assets/
├── src/
│   ├── components/
│   │   └── common/           # Header, Sidebar, Modal, StatsCard, StatusBanner, ProfileModal
│   ├── contexts/             # AuthContext, NotificationContext, SchoolContext
│   ├── layouts/              # AppLayout
│   ├── modules/
│   │   ├── dashboard/        # Dynamic views (Admin, Guru, Kepsek)
│   │   ├── students/         # Student CRUD, filters, mutation, exports
│   │   ├── attendance/       # AttendanceDaily, AttendanceRecap
│   │   ├── grades/           # GradeInput, GradeRecap (Formula weighted averages)
│   │   ├── report-cards/     # ReportCardView (A4 Print layout, single/batch)
│   │   ├── reports/          # PrintCenter (Executive school reports)
│   │   ├── synchronization/  # 4 Pillars Status, sync triggers, retry queue
│   │   ├── users/            # User & teacher assignment management
│   │   ├── settings/         # School identity, subjects, weights, academic year
│   │   └── portal/           # StudentParentPortal (Independent secure PIN login)
│   ├── services/
│   │   ├── firebase/         # firebase.ts, authService.ts, firestoreService.ts
│   │   ├── apps-script/      # appsScriptApi.ts (HTTP Caller)
│   │   ├── export/           # excelExport.ts, csvExport.ts
│   │   └── sync/             # syncManager.ts (Two-way sync engine)
│   ├── types/                # index.ts (Full TypeScript models & interfaces)
│   ├── utils/                # calculations.ts, dateUtils.ts, formatters.ts
│   ├── styles/               # index.css (Tailwind & @media print CSS)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── apps-script/              # Google Apps Script Project Files (14 files)
│   ├── Code.gs
│   ├── Config.gs
│   ├── Authentication.gs
│   ├── SpreadsheetService.gs
│   ├── StudentService.gs
│   ├── AttendanceService.gs
│   ├── GradeService.gs
│   ├── FirebaseService.gs
│   ├── DriveService.gs
│   ├── SyncService.gs
│   ├── ValidationService.gs
│   ├── LogService.gs
│   ├── ApiRouter.gs
│   └── appsscript.json
├── firestore.rules           # Firestore Security Rules (Strict RBAC)
├── firestore.indexes.json    # Compound indexes for Firestore
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
├── USER_GUIDE.md
├── SETUP_FIREBASE.md
├── SETUP_GOOGLE_SHEETS.md
├── SETUP_APPS_SCRIPT.md
├── SETUP_GOOGLE_DRIVE.md
├── DEPLOYMENT.md
├── SECURITY.md
├── TEST_REPORT.md
└── implementation_plan.md
```

---

## 🚀 Panduan Memulai Cepat (Local Development)

### 1. Prasyarat
- Node.js versi 18+ atau 20+
- npm versi 9+

### 2. Instalasi Dependency
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
*(Aplikasi dilengkapi dengan mode fallback demo siap uji dengan data awal siswa kelas 1–6 sehingga dapat langsung dicoba tanpa harus menunggu setup akun eksternal).*

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 5. Kompilasi Produksi
```bash
npm run build
```

---

## 🔑 Akun Demo Pengujian Cepat

Pada halaman login, terdapat tombol akses cepat 1-klik untuk setiap peran:
- **Administrator**: `admin@sekolah.sch.id` (Akses ke semua kelas & menu pengaturan)
- **Guru Kelas 1**: `guru1@sekolah.sch.id` (Akses dibatasi hanya ke Kelas 1)
- **Guru Kelas 3**: `guru3@sekolah.sch.id` (Akses dibatasi hanya ke Kelas 3)
- **Kepala Sekolah**: `kepsek@sekolah.sch.id` (Akses monitoring & cetak rekap eksekutif)
- **Kata sandi demo**: `password123` (atau klik tombol cepat pada kartu login)
- **Portal Siswa**: Akses via tombol `PORTAL SISWA / ORANG TUA`, pilih Kelas 1, NIS `1001`, PIN: `2019-03-15` atau `1001`.
