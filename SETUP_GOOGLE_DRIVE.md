# PANDUAN PENGARSIPAN GOOGLE DRIVE (SETUP_GOOGLE_DRIVE.md)
# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

---

## 1. STRUKTUR FOLDER ARSIP RESMI

Sistem pengarsipan menggunakan Google Drive untuk menyimpan dokumen PDF dan laporan resmi yang diatur secara otomatis ke dalam hirarki folder berikut:

```text
Google Drive/
└── SISTEM SEKOLAH/
    ├── ABSENSI/
    │   └── 2026_2027/       # Arsip rekapitulasi presensi bulanan & semesteran
    ├── NILAI/
    │   └── 2026_2027/       # Arsip lembar penilaian per mapel & rapor siswa
    └── LAPORAN/
        └── 2026_2027/       # Arsip laporan kepala sekolah & dokumentasi akhir periode
```

---

## 2. PEMBUATAN OTOMATIS FOLDER DRIVE

Fungsi `setupDatabaseAndFolders()` di dalam file [`backend/Code.gs`](backend/Code.gs) secara otomatis membuat folder induk `SISTEM SEKOLAH` beserta subfolder kategori dan tahun pelajaran di akun Google Drive pemilik skrip saat pertama kali dijalankan.

Jika Anda ingin memeriksa foldernya secara langsung:
1. Buka [Google Drive](https://drive.google.com/).
2. Anda akan melihat folder baru bernama **`SISTEM SEKOLAH`**.
3. Di dalamnya terdapat subfolder `ABSENSI`, `NILAI`, dan `LAPORAN`.

---

## 3. MEKANISME KEAMANAN BERKAS DRIVE

- **Tidak Ada Akses Anonim Tanpa Izin**: Folder tidak dibuat publik untuk siapa saja di internet. Akses tulis hanya dikendalikan oleh backend Google Apps Script.
- **Pemberian Nama Berkas yang Unik**: Setiap berkas PDF atau laporan yang diunggah diberi penamaan unik berdasarkan jenis dokumen, kelas, dan waktu ekspor (contoh: `Rekap_Presensi_Kelas1_20261029.pdf`).
- **Pencatatan Metadata**: ID file Google Drive dan tautan pratinjau dicatat ke dalam log transaksi sistem.

---

## 4. CARA MENGUJI PENGARSIPAN DOKUMEN

1. Di website aplikasi, buka menu **Cetak Laporan**.
2. Pilih salah satu laporan (contoh: *Rekap Absensi Bulanan*).
3. Setelah dialog cetak terbuka, Anda dapat memilih **Save as PDF** untuk menyimpan berkas secara lokal.
4. Ketika integrasi backend Google Apps Script telah terhubung (`VITE_GAS_API_URL` terisi), fungsi `archiveDocument` di backend akan otomatis mengarsipkan dokumen ke folder Google Drive terkait.
