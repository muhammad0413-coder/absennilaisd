# PANDUAN PENGATURAN GOOGLE SHEETS (SETUP_GOOGLE_SHEETS.md)
## SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD

Google Sheets bertindak sebagai basis data induk (*master database*), tempat administrator memasukkan data awal siswa secara massal, serta pengarsipan data historis jangka panjang.

---

## 1. Membuat Spreadsheet Master

1. Buka [Google Sheets](https://sheets.google.com/).
2. Buat Spreadsheet Baru (*Blank spreadsheet*).
3. Beri nama spreadsheet tepat:
   ```text
   DATABASE SISTEM ABSENSI DAN NILAI SD
   ```
4. Salin **Spreadsheet ID** dari bilah alamat peramban (URL):
   - Contoh URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - ID Spreadsheet adalah rangkaian karakter acak di antara `/d/` dan `/edit`:
     `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
5. Simpan ID ini untuk dimasukkan ke Google Apps Script (lihat `SETUP_APPS_SCRIPT.md`).

---

## 2. Inisialisasi Otomatis 9 Lembar Kerja (Sheet)

Anda **TIDAK PERLU** membuat ke-9 sheet secara manual dengan mengetik kolom satu per satu. Sistem Google Apps Script telah diprogram untuk membuat seluruh sheet, nama kolom, lebar kolom, dan pewarnaan header secara otomatis.

1. Ikuti panduan deployment Google Apps Script di `SETUP_APPS_SCRIPT.md`.
2. Pada editor Apps Script, pilih fungsi `initializeDatabase()` lalu klik **Run** (Jalankan).
3. Berikan izin akses saat diminta (*Review permissions*).
4. Google Apps Script akan secara otomatis membuat 9 lembar kerja berikut tanpa menghapus data lama:

| No. | Nama Sheet | Tujuan & Peran |
|---|---|---|
| 1 | `Data_Siswa` | Master data siswa kelas 1–6 (17 kolom) |
| 2 | `Data_Guru` | Data pendidik dan penugasan kelas (10 kolom) |
| 3 | `Data_Absensi` | Catatan kehadiran harian siswa (14 kolom) |
| 4 | `Data_Nilai` | Catatan nilai asesmen formatif & sumatif (16 kolom) |
| 5 | `Pengaturan` | Parameter global sekolah dan kurikulum (4 kolom) |
| 6 | `Pengguna` | Hak akses akun pengguna sistem (7 kolom) |
| 7 | `Log_Sinkronisasi` | Catatan audit pertukaran data dua arah (9 kolom) |
| 8 | `Log_Aktivitas` | Audit trail perubahan data oleh pengguna (8 kolom) |
| 9 | `Antrean_Sinkronisasi` | Antrean transaksi tertunda & penanganan konflik (10 kolom) |

---

## 3. Rincian Kolom Sheet Master

### Sheet 1: `Data_Siswa`
Kolom (A s.d Q):
1. `ID_Siswa` (Teks unik, contoh: `SD-1-1001`)
2. `NIS` (Nomor Induk Siswa - format Teks)
3. `NISN` (10 digit NISN - format Teks)
4. `Nama_Lengkap` (Wajib diisi)
5. `Jenis_Kelamin` (*Laki-laki* atau *Perempuan*)
6. `Tempat_Lahir`
7. `Tanggal_Lahir` (Format: `YYYY-MM-DD`, contoh: `2019-03-15`)
8. `Nama_Orang_Tua`
9. `Alamat`
10. `Kelas` (Angka `1`, `2`, `3`, `4`, `5`, atau `6`)
11. `Tahun_Pelajaran` (contoh: `2026/2027`)
12. `Status_Siswa` (*Aktif*, *Pindah*, *Lulus*, *Nonaktif*)
13. `Foto_URL`
14. `Created_At` (Tanggal input)
15. `Updated_At` (Tanggal pembaruan terakhir)
16. `Updated_By` (Nama admin / guru pengubah)
17. `Sync_Status` (*synced* / *pending*)

### Sheet 2: `Data_Guru`
Kolom (A s.d J):
1. `User_ID`, 2. `Nama_Guru`, 3. `Email`, 4. `NIP`, 5. `Foto_URL`, 6. `Kelas_Ditugaskan` (contoh: `1` atau `1, 2`), 7. `Role` (`guru`/`admin`/`kepsek`), 8. `Status` (`Aktif`/`Nonaktif`), 9. `Created_At`, 10. `Updated_At`.

### Sheet 3: `Data_Absensi`
Kolom (A s.d N):
1. `ID_Absensi`, 2. `Tanggal`, 3. `Tahun_Pelajaran`, 4. `Semester`, 5. `Kelas`, 6. `ID_Siswa`, 7. `NIS`, 8. `NISN`, 9. `Nama_Siswa`, 10. `Status_Absensi` (*Hadir, Sakit, Izin, Alpa*), 11. `Keterangan`, 12. `Diinput_Oleh`, 13. `Updated_At`, 14. `Sync_Status`.

### Sheet 4: `Data_Nilai`
Kolom (A s.d P):
1. `ID_Nilai`, 2. `Tahun_Pelajaran`, 3. `Semester`, 4. `Kelas`, 5. `ID_Siswa`, 6. `NIS`, 7. `NISN`, 8. `Nama_Siswa`, 9. `Mata_Pelajaran`, 10. `Jenis_Asesmen`, 11. `Lingkup_Materi`, 12. `Nilai`, 13. `Deskripsi`, 14. `Diinput_Oleh`, 15. `Updated_At`, 16. `Sync_Status`.

---

## 4. Validasi Data yang Wajib Diterapkan di Sheet

Untuk memastikan tidak ada kesalahan input manual oleh admin:
1. **NIS dan NISN**: Atur format angka kolom B dan C sebagai **Format > Plain text** (Teks biasa) agar awalan angka nol (0) tidak hilang.
2. **Kelas**: Pasang validasi data (*Data > Data validation*):
   - Kriteria: *List of items*: `1, 2, 3, 4, 5, 6`.
3. **Status Siswa**:
   - Kriteria: *List of items*: `Aktif, Pindah, Lulus, Nonaktif`.
4. **Jenis Kelamin**:
   - Kriteria: *List of items*: `Laki-laki, Perempuan`.

---

## 5. Alur Input Siswa Manual oleh Administrator

1. Administrator membuka spreadsheet pada sheet `Data_Siswa`.
2. Masukkan baris data siswa baru (Kelas 1 sampai 6).
3. Buka aplikasi web, masuk sebagai Administrator, buka menu **Sinkronisasi**.
4. Klik tombol **Sinkronkan Siswa**.
5. Sistem Apps Script akan membaca baris di Google Sheets dan menyimpannya langsung ke database Firestore. Siswa baru langsung muncul di aplikasi!
