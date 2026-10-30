# PANDUAN PENGATURAN GOOGLE APPS SCRIPT (SETUP_APPS_SCRIPT.md)
## SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD

Google Apps Script bertindak sebagai backend penghubung (*middleware engine*) yang mengamankan komunikasi antara antarmuka web, Firebase Cloud Firestore, Google Sheets, dan Google Drive.

Seluruh kode sumber Apps Script yang telah selesai dibangun dan siap dideploy berada pada folder:
`apps-script/`

---

## 1. Membuat Proyek Google Apps Script

1. Buka peramban dan kunjungi [Google Apps Script Dashboard](https://script.google.com/).
2. Pastikan Anda masuk menggunakan akun Google pemilik Google Spreadsheet.
3. Klik tombol **+ Proyek Baru** (*New Project*).
4. Beri nama proyek di bagian kiri atas:
   ```text
   BACKEND SISTEM INFORMASI ABSENSI DAN NILAI SD
   ```

---

## 2. Mengunggah / Menyalin Berkas Kode

Pada proyek Apps Script baru, buat berkas-berkas dengan mengklik ikon **+** di sebelah *Files* > **Script**, lalu salin isi dari masing-masing berkas di folder `apps-script/` proyek ini:

1. `Config.gs` (Konfigurasi dan konstanta sheet)
2. `Authentication.gs` (Verifikasi Firebase ID Token dan RBAC)
3. `SpreadsheetService.gs` (Operasi baca/tulis sheet dengan LockService)
4. `StudentService.gs` (CRUD siswa dan validasi kelas binaan guru)
5. `AttendanceService.gs` (Penerimaan absensi massal dan kalkulasi rekap)
6. `GradeService.gs` (Input nilai 0–100 dan kalkulasi rapor)
7. `DriveService.gs` (Hierarki folder dan unggah foto profil / arsip)
8. `FirebaseService.gs` (Firestore REST API bridge)
9. `SyncService.gs` (Mesin sinkronisasi dua arah dan antrean retry)
10. `ValidationService.gs` (Validasi skema dan masukan data)
11. `LogService.gs` (Pencatatan riwayat audit dan log sinkronisasi)
12. `ApiRouter.gs` (Dispatcher routing aksi dan response JSON standar)
13. `Code.gs` (Titik masuk `doGet` dan `doPost`)

### Mengatur Manifest `appsscript.json`:
1. Klik menu **Project Settings** (ikon roda gigi) di bilah kiri Apps Script.
2. Centang opsi: **Show "appsscript.json" manifest file in editor**.
3. Kembali ke tab **Editor**, buka `appsscript.json`, lalu gantikan isinya dengan isi berkas `apps-script/appsscript.json`:
```json
{
  "timeZone": "Asia/Jakarta",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

---

## 3. Mengatur Properti Skrip (Script Properties)

Untuk menjaga keamanan kredensial agar tidak tertulis langsung di kode:

1. Di bilah menu kiri Apps Script, klik **Project Settings** (ikon roda gigi).
2. Gulir ke bawah ke bagian **Script Properties**.
3. Klik tombol **Add script property** dan tambahkan 4 properti berikut:

| Property (Key) | Nilai / Value | Keterangan |
|---|---|---|
| `SPREADSHEET_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUU...` | ID spreadsheet yang dibuat di `SETUP_GOOGLE_SHEETS.md` |
| `FIREBASE_PROJECT_ID` | `sd-siakad-absensi-nilai` | Project ID Firebase Anda |
| `FIREBASE_API_KEY` | `AIzaSy...` | Web API Key Firebase Anda |
| `API_SECRET_KEY` | `sd_secret_sync_key_change_in_production` | Kunci rahasia sinkronisasi backend |

4. Klik **Save script properties**.

---

## 4. Menjalankan Inisialisasi Database Pertama Kali

1. Kembali ke tab **Editor**.
2. Buka berkas `Code.gs`.
3. Pada dropdown fungsi di bagian atas editor, pilih `runInitialization`.
4. Klik tombol **Run** (Jalankan).
5. Muncul dialog otorisasi:
   - Klik **Review permissions** (Tinjau Izin).
   - Pilih akun Google Anda.
   - Klik **Advanced** (Lanjutan) lalu klik **Go to BACKEND SISTEM INFORMASI... (unsafe)**.
   - Klik **Allow** (Izinkan).
6. Periksa tab Execution Log:
   - Pesan `Inisialisasi Sheet: [...]` dan `Inisialisasi Drive: [...]` menandakan ke-9 Sheet dan folder Drive berhasil dibuat!

---

## 5. Melakukan Deployment sebagai Web App

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon roda gigi di sebelah *Select type*, lalu pilih **Web app**.
3. Isi parameter deployment:
   - **Description**: `Versi Produksi 1.0`
   - **Execute as**: **Me (emailanda@gmail.com)**
   - **Who has access**: **Anyone** *(Semua orang - request tetap diverifikasi oleh token otentikasi internal)*.
4. Klik tombol **Deploy**.
5. Salin **Web app URL** yang dihasilkan:
   - Format: `https://script.google.com/macros/s/AKfycbx.../exec`

---

## 6. Menghubungkan ke Aplikasi Frontend

1. Buka file `.env` di folder proyek aplikasi web Anda di komputer.
2. Perbarui variabel `VITE_APPS_SCRIPT_URL` dengan URL yang baru disalin:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbx.../exec
   ```
3. Simpan berkas `.env`.
4. Buka aplikasi web, klik menu **Sinkronisasi**, lalu klik **Periksa Koneksi**. Status Google Apps Script dan Google Sheets akan langsung berubah hijau: **TERHUBUNG**.
