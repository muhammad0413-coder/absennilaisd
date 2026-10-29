# PANDUAN PENYIAPAN GOOGLE SHEETS & BACKEND API (SETUP_GOOGLE_SHEETS.md)
# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

---

## 1. MEMBUAT GOOGLE SPREADSHEET UTAMA

1. Buka [Google Sheets](https://sheets.google.com/) menggunakan akun Google sekolah.
2. Buat spreadsheet baru dan beri nama:
   **`SISTEM ABSENSI DAN NILAI SD`**

---

## 2. STRUKTUR 6 SHEET RESMI

Spreadsheet ini menggunakan 6 sheet terpisah:

### Sheet 1: `Data_Siswa`
Sumber data induk siswa yang diisi dan diperbarui secara manual oleh Administrator.
Header (Baris 1):
`ID_Siswa`, `NIS`, `NISN`, `Nama_Lengkap`, `Jenis_Kelamin`, `Tempat_Lahir`, `Tanggal_Lahir`, `Nama_Orang_Tua`, `Alamat`, `Kelas`, `Tahun_Pelajaran`, `Status_Siswa`, `Updated_At`, `Sync_Status`.

*Ketentuan Pengisian:*
- `ID_Siswa`: ID unik dan permanen, contoh `STD_1001`.
- `NIS` & `NISN`: Wajib diisi sebagai teks (tambahkan tanda petik satu `'` di depan jika diawali angka 0).
- `Kelas`: Hanya bernilai `1`, `2`, `3`, `4`, `5`, atau `6`.
- `Status_Siswa`: `Aktif`, `Pindah`, atau `Lulus`.

### Sheet 2: `Data_Absensi`
Tempat salinan data presensi harian yang dikirim dari website:
`ID_Absensi`, `Tanggal`, `Tahun_Pelajaran`, `Semester`, `Kelas`, `ID_Siswa`, `NIS`, `NISN`, `Nama_Siswa`, `Status_Absensi`, `Keterangan`, `Diinput_Oleh`, `Updated_At`, `Sync_Status`.

### Sheet 3: `Data_Nilai`
Tempat salinan data asesmen nilai siswa yang dikirim dari website:
`ID_Nilai`, `Tahun_Pelajaran`, `Semester`, `Kelas`, `ID_Siswa`, `NIS`, `NISN`, `Nama_Siswa`, `Mata_Pelajaran`, `Jenis_Asesmen`, `Lingkup_Materi`, `Nilai`, `Deskripsi`, `Diinput_Oleh`, `Updated_At`, `Sync_Status`.

### Sheet 4: `Pengaturan`
Menyimpan konfigurasi sekolah:
`Nama_Pengaturan`, `Nilai_Pengaturan`, `Updated_At`.

### Sheet 5: `Pengguna`
Menyimpan data staf dan penugasan kelas:
`User_ID`, `Nama`, `Email`, `Role`, `Kelas_Ditugaskan`, `Status`, `Updated_At`.

### Sheet 6: `Log_Sinkronisasi`
Menyimpan riwayat transaksi pertukaran data:
`ID_Log`, `Waktu`, `Jenis_Data`, `Arah_Sinkronisasi`, `Jumlah_Diproses`, `Jumlah_Berhasil`, `Jumlah_Gagal`, `Status`, `Pesan`.

---

## 3. PEMBUATAN OTOMATIS VIA GOOGLE APPS SCRIPT (1-KLIK)

Anda tidak perlu mengetik header di atas satu per satu! Skrip backend yang disertakan memiliki fungsi pembuat otomatis:

1. Di spreadsheet Anda, klik menu **Extensions > Apps Script** (Ekstensi > Apps Script).
2. Hapus kode default yang ada di file `Code.gs`.
3. Buka file [`backend/Code.gs`](backend/Code.gs) dari proyek ini, salin seluruh kodenya, lalu tempelkan ke editor Apps Script.
4. Di bilah atas editor Apps Script, pilih fungsi: **`setupDatabaseAndFolders`**.
5. Klik tombol **Run** (Jalankan).
6. Google akan meminta izin otorisasi (*Review permissions*). Klik akun Anda > *Advanced* > *Go to (unsafe)* > *Allow*.
7. Dalam beberapa detik, seluruh 6 sheet, header tebal berwarna biru navy, data contoh awal kelas 1–6, dan struktur folder Google Drive akan langsung terbuat secara sempurna!

---

## 4. DEPLOY APPS SCRIPT SEBAGAI WEB APP (API)

Agar website dapat menyinkronkan data dengan Google Sheets:

1. Pada editor Apps Script, klik tombol biru **Deploy > New deployment** di sudut kanan atas.
2. Klik ikon roda gigi di sebelah *Select type*, lalu pilih **Web app**.
3. Atur konfigurasi berikut:
   - **Description**: `API Absensi dan Nilai SD v1`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone` *(agar frontend Vercel dapat memanggil API)*
4. Klik **Deploy**.
5. Salin **Web app URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycbx.../exec`).
6. Masukkan URL tersebut ke file `.env` di komputer Anda:
   ```env
   VITE_GAS_API_URL="https://script.google.com/macros/s/AKfycbx.../exec"
   ```

---

## 5. MENGUJI KONEKSI & SINKRONISASI

1. Buka website absensi di browser lokal Anda.
2. Masuk sebagai Administrator (`admin@sekolah.id`).
3. Buka menu **Sinkronisasi Data**.
4. Periksa kartu status *Master Google Sheets*: indikator akan berubah menjadi **Live Terhubung**.
5. Klik tombol **📥 Sinkronkan Data Siswa (Sheets → Firebase)**.
6. Notifikasi sukses akan muncul dan tabel riwayat transaksi pada sheet `Log_Sinkronisasi` akan mencatat transaksi berhasil.
