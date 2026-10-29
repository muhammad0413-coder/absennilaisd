# PANDUAN PENGGUNA (USER GUIDE)
# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

---

## 1. CARA MASUK (LOGIN)

1. Buka aplikasi di peramban web HP, tablet, atau komputer.
2. Masukkan email dan kata sandi:
   - **Administrator**: `admin@sekolah.id` (Akses supervisi K1–K6, sinkronisasi, pengaturan).
   - **Kepala Sekolah**: `kepsek@sekolah.id` (Monitoring dan cetak laporan seluruh K1–K6).
   - **Guru Kelas**: `guru1@sekolah.id` s/d `guru6@sekolah.id` (Hanya kelas yang ditugaskan).
3. Klik tombol **Masuk ke Sistem →**.
4. Menu sidebar akan otomatis menyesuaikan peran dan hak akses akun Anda.

---

## 2. PENGELOLAAN DATA INDUK SISWA (GOOGLE SHEETS)

Sesuai ketentuan arsitektur keamanan:
> **PENTING:** Website tidak menyediakan form tambah, edit, atau hapus data induk siswa. Seluruh data induk siswa dikelola satu pintu oleh Administrator melalui Google Sheets.

1. Buka Google Spreadsheet bernama **`SISTEM ABSENSI DAN NILAI SD`**.
2. Pilih sheet **`Data_Siswa`**.
3. Masukkan data siswa pada baris yang tersedia:
   - `ID_Siswa`: ID unik (contoh: `STD_1001`).
   - `NIS`: Nomor Induk Siswa (format teks agar angka 0 di depan tidak hilang).
   - `NISN`: Nomor Induk Siswa Nasional.
   - `Nama_Lengkap`: Nama lengkap siswa.
   - `Jenis_Kelamin`: Laki-laki / Perempuan.
   - `Tempat_Lahir` & `Tanggal_Lahir`: Format YYYY-MM-DD.
   - `Nama_Orang_Tua`: Nama wali murid.
   - `Alamat`: Alamat tempat tinggal.
   - `Kelas`: Bernilai `1`, `2`, `3`, `4`, `5`, atau `6`.
   - `Tahun_Pelajaran`: Contoh `2026/2027`.
   - `Status_Siswa`: `Aktif`, `Pindah`, atau `Lulus`.
4. Setelah data selesai diisi di Google Sheets, buka menu **Sinkronisasi Data** di website, lalu klik **📥 Sinkronkan Data Siswa (Sheets → Firebase)**.
5. Seluruh data siswa akan langsung tampil di website pada menu **Data Siswa**.

---

## 3. CARA MENGISI ABSENSI HARIAN (GURU KELAS)

1. Masuk sebagai Guru Kelas atau Administrator.
2. Buka menu **Absensi Harian** dari sidebar navigasi.
3. Pilih tingkat kelas (otomatis terkunci untuk Guru Kelas).
4. Pilih tanggal presensi (otomatis terisi hari ini).
5. Klik **Muat Data Siswa**.
6. Pada tabel siswa:
   - Klik status kehadiran per siswa: **Hadir** (hijau), **Sakit** (biru), **Izin** (kuning), atau **Alpa** (merah).
   - Gunakan tombol **✓ Hadir Semua** untuk mengatur semua siswa hadir dalam 1 detik, lalu cukup ubah siswa yang berhalangan.
   - Tambahkan keterangan jika siswa sakit atau izin (misal: *Demam tinggi*).
7. Klik tombol **💾 Simpan Data Presensi Siswa Sekarang**.
8. Data langsung tersimpan di Cloud Firestore dan salinannya dikirimkan ke Google Sheets pada sheet `Data_Absensi`.

---

## 4. CARA MELIHAT REKAP ABSENSI

1. Buka menu **Rekap Absensi**.
2. Pilih kelas dan periode (Bulan atau rentang Tanggal Mulai & Selesai).
3. Klik **Tampilkan Rekap**.
4. Sistem menghitung rekapitulasi kehadiran menggunakan rumus resmi:
   $$\text{Persentase Kehadiran} = \frac{\text{Jumlah Hadir}}{\text{Total Hari Pertemuan Efektif}} \times 100\%$$
   *Catatan: Hari tanpa catatan presensi tidak otomatis dianggap alpa.*
5. Anda dapat mengunduh rekap dalam format file spreadsheet dengan menekan **📥 Ekspor CSV** atau mencetak lembar resmi dengan menekan **🖨️ Cetak Rekap Presensi**.

---

## 5. CARA MENGINPUT NILAI SISWA (GURU KELAS)

1. Buka menu **Input Nilai**.
2. Pilih Kelas, Mata Pelajaran, Jenis Asesmen (*Formatif*, *Sumatif Lingkup Materi*, *Sumatif Tengah Semester*, atau *Sumatif Akhir Semester*), Semester, dan Tahun Pelajaran.
3. Tuliskan Nama Penilaian / Lingkup Materi (misal: *Operasi Bilangan Bulat*).
4. Klik **Muat Formulir Nilai**.
5. Masukkan nilai angka (skala valid 0–100) dan deskripsi capaian pada tabel.
   *Catatan: Baris siswa yang belum dinilai boleh dikosongkan dan tidak akan dihitung sebagai angka nol.*
6. Klik **💾 Simpan Seluruh Nilai ke Database & Google Sheets**.
7. Data tersimpan di Cloud Firestore dan salinannya tercatat di Google Sheets sheet `Data_Nilai`.

---

## 6. CARA MELIHAT REKAP NILAI SISWA

1. Buka menu **Rekap Nilai Siswa**.
2. Pilih Kelas, Mata Pelajaran, dan Semester.
3. Klik **Tampilkan Rekap**.
4. Sistem menghitung rata-rata capaian belajar siswa dan status ketuntasan berdasarkan batas KKM (default 75).
5. Klik **🖨️ Cetak Lembar Nilai** atau **📥 Ekspor CSV**.

---

## 7. PUSAT CETAK 9 LAPORAN RESMI (@media print)

Buka menu **Cetak Laporan** untuk mencetak salah satu dari 9 laporan resmi:
1. **Daftar Siswa per Kelas**
2. **Absensi Harian Kelas**
3. **Rekap Absensi Bulanan**
4. **Rekap Absensi Semester**
5. **Daftar Nilai per Mata Pelajaran**
6. **Rekap Nilai Siswa**
7. **Rekap Nilai per Kelas**
8. **Laporan Kepala Sekolah**
9. **Laporan Tahunan / Semester**

Setiap laporan otomatis menyertakan:
- **Kop Surat Resmi Sekolah** (Nama Sekolah, NPSN, Alamat, Garis Ganda).
- **Kolom Tanda Tangan** Kepala Sekolah dan Guru Kelas.
- Menyembunyikan sidebar, bilah tombol, dan navigasi HP.
- Siap dicetak langsung ke kertas **A4** atau disimpan sebagai **PDF** melalui dialog print browser.

---

## 8. SINKRONISASI DATA (ADMINISTRATOR)

1. Buka menu **Sinkronisasi Data**.
2. Tinjau status koneksi Google Sheets, Cloud Firestore, dan Google Drive.
3. Klik tombol aksi sesuai kebutuhan:
   - **📥 Sinkronkan Data Siswa**: Membaca data siswa terbaru dari Google Sheets `Data_Siswa` dan memperbarui database aplikasi.
   - **📤 Sinkronkan Absensi**: Mengirim salinan seluruh absensi ke sheet `Data_Absensi`.
   - **📤 Sinkronkan Nilai**: Mengirim salinan seluruh nilai ke sheet `Data_Nilai`.
   - **♻️ Ulangi Sinkronisasi Gagal**: Memeriksa dan memproses ulang transaksi yang sempat tertunda.
4. Riwayat transaksi tercatat transparan pada tabel log sinkronisasi.
