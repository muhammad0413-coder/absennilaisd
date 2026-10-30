# BUKU PANDUAN PENGGUNA (USER GUIDE)
## SISTEM INFORMASI ABSENSI, NILAI, DAN RAPOR SISWA SD

Dokumen ini berisi petunjuk operasional langkah demi langkah bagi setiap kelompok pengguna sistem: **Administrator**, **Guru Kelas**, **Kepala Sekolah**, dan **Siswa / Orang Tua**.

---

## 1. PANDUAN ADMINISTRATOR

Administrator memiliki hak akses tertinggi untuk mengelola seluruh sistem sekolah.

### 1.1 Masuk ke Sistem (Login)
1. Buka aplikasi web di browser.
2. Masukkan email administrator: `admin@sekolah.sch.id`.
3. Masukkan kata sandi (atau gunakan tombol klik cepat **Administrator**).
4. Klik tombol **Masuk ke Aplikasi**.

### 1.2 Mengelola Rombongan Belajar & Master Siswa
1. Pada menu navigasi sebelah kiri, klik **Data Siswa**.
2. Gunakan dropdown **Kelas** untuk memilih kelas 1 sampai 6, atau pilih *Semua Kelas*.
3. Untuk menambah siswa baru:
   - Klik tombol **+ Tambah Siswa**.
   - Isi Nama Lengkap, NIS, NISN, Jenis Kelamin, Kelas (1–6), Tempat Lahir, Tanggal Lahir, Nama Orang Tua, dan Alamat.
   - Klik **Simpan Data**.
4. Untuk mengubah data: Klik ikon **Edit** (pensil kuning) pada baris siswa.
5. Untuk mutasi / nonaktifkan: Klik ikon **Mutasi** (ikon pengguna merah), pilih status baru (*Nonaktif / Pindah / Lulus*), masukkan alasan mutasi, lalu konfirmasi.

### 1.3 Mengelola Akun Pengguna & Guru Kelas
1. Klik menu **Pengguna**.
2. Klik tombol **+ Tambah Pengguna Baru**.
3. Masukkan Nama Lengkap & Gelar guru, Email login, NIP, Peran (**Guru Kelas**), dan **Kelas Tugas Guru** (contoh: `1` untuk Wali Kelas 1, atau `1, 2` jika mengampu dua kelas).
4. Klik **Simpan Akun**.

### 1.4 Mengatur Identitas Sekolah & Kurikulum
1. Klik menu **Pengaturan**.
2. Pada tab **Identitas Sekolah & Kepala Sekolah**, lengkapi:
   - Nama Resmi Sekolah, NPSN, Alamat, Desa, Kecamatan, Kabupaten, Provinsi.
   - Nama Kepala Sekolah dan NIP Kepala Sekolah.
3. Pada tab **Tahun Pelajaran & Semester**, tentukan tahun ajaran aktif (contoh: `2026/2027`) dan semester aktif (*1* atau *2*).
4. Pada tab **Mata Pelajaran**, tambah atau kelola daftar mata pelajaran kurikulum dan KKM.
5. Pada tab **Bobot & Skala Penilaian**, tinjau bobot resmi (*Formatif 20%, Sumatif LM 30%, STS 25%, SAS 25%*).

### 1.5 Melakukan Sinkronisasi Data
1. Klik menu **Sinkronisasi**.
2. Periksa 4 Kartu Status (*Firebase, Google Sheets, Google Apps Script, Google Drive*).
3. Klik **Periksa Koneksi** untuk validasi diagnostik.
4. Klik **Sinkronkan Semua** untuk menjalankan pertukaran data dua arah menyeluruh.
5. Jika ada antrean yang terhambat, klik **Ulangi Data Gagal**.

---

## 2. PANDUAN GURU KELAS

Guru kelas hanya memiliki akses pada kelas yang ditugaskan oleh Administrator.

### 2.1 Mengisi Absensi Harian Siswa
1. Masuk menggunakan akun guru (contoh: `guru1@sekolah.sch.id`).
2. Klik menu **Absensi**.
3. Sistem secara otomatis memilih kelas tugas Anda.
4. Pilih tanggal pencatatan (default adalah tanggal hari ini).
5. **Fitur Cepat:** Jika seluruh siswa hadir, klik tombol **Hadir Semua** (1-klik).
6. Untuk siswa yang tidak hadir: Klik tombol status yang sesuai:
   - **Sakit (S)**: Masukkan keterangan sakit jika ada surat dokter.
   - **Izin (I)**: Masukkan keterangan keperluan izin.
   - **Alpa (A)**: Jika tidak ada pemberitahuan dari orang tua.
7. Klik tombol **Simpan Absensi**. Sistem akan menyimpan ke database dan memperbarui indikator menjadi *Sudah Tersimpan di Database*.
8. Untuk mencetak daftar hadir kelas harian: Klik tombol **Cetak A4**.

### 2.2 Melihat Rekapitulasi Absensi
1. Klik menu **Rekap Absensi**.
2. Pilih mode periode: **Semester**, **Bulanan**, atau **Rentang Tanggal**.
3. Sistem otomatis menghitung total hari belajar aktif, persentase kehadiran:
   $$\text{Persentase Kehadiran} = \frac{\text{Jumlah Hadir}}{\text{Total Hari Efektif}} \times 100\%$$
   *(Hari tanpa catatan tidak pernah dihitung sebagai alpa)*.
4. Anda dapat mengunduh rekap dalam format **Excel (.xlsx)** atau **CSV**, serta mencetak langsung via **Cetak A4**.

### 2.3 Menginput Nilai Asesmen
1. Klik menu **Input Nilai**.
2. Pilih parameter penilaian:
   - **Mata Pelajaran** (contoh: *Matematika*).
   - **Jenis Asesmen**: *Formatif*, *Sumatif Lingkup Materi*, *Sumatif Tengah Semester (STS)*, atau *Sumatif Akhir Semester (SAS)*.
   - **Lingkup Materi / Bab**: Tulis topik (contoh: *Bab 1 Bilangan Cacah*).
   - **Semester**: *Semester 1* atau *Semester 2*.
3. Masukkan angka nilai pada kolom **Nilai (0–100)**.
4. Klik tombol **Deskripsi Otomatis** untuk menghasilkan narasi capaian kompetensi otomatis berdasarkan skala skor yang diisi. Anda juga dapat menyunting deskripsi secara manual.
5. Klik **Simpan Semua Nilai**.

### 2.4 Memeriksa Rekap Nilai & Leger
1. Klik menu **Rekap Nilai**.
2. Pilih mata pelajaran dan semester yang ingin dianalisis.
3. Tinjau nilai masing-masing komponen asesmen, Nilai Akhir (NA), dan Predikat (A/B/C/D).
4. Klik **Excel** atau **Cetak A4** untuk arsip fisik nilai.

### 2.5 Mengelola dan Mencetak Rapor Siswa
1. Klik menu **Rapor Siswa**.
2. Pilih semester aktif.
3. Gunakan navigasi panah (*Siswa Sebelumnya / Siswa Selanjutnya*) untuk meninjau rapor masing-masing anak.
4. Isi atau sesuaikan **Catatan Wali Kelas** pada kotak teks yang disediakan.
5. **Opsi Cetak:**
   - Klik **Cetak Siswa Ini** untuk mencetak rapor 1 siswa.
   - Klik **Cetak 1 Kelas** untuk mencetak seluruh buku rapor siswa dalam satu kelas sekaligus dengan jeda halaman rapi (*page break* otomatis).
6. Klik **Arsip ke Drive** untuk menyimpan salinan dokumen ke Google Drive.

### 2.6 Mengubah Profil Pribadi Guru
1. Klik foto profil atau nama Anda di pojok kanan atas Header.
2. Unggah foto profil baru dengan mengklik ikon kamera pada avatar.
3. Ubah nama tampilan atau NIP.
4. Jika ingin mengubah kata sandi, klik tombol **Kirim Reset** di bawah menu Ubah Kata Sandi.
5. Klik **Simpan Perubahan**.

---

## 3. PANDUAN KEPALA SEKOLAH

Kepala sekolah bertindak sebagai pemantau mutu akademik seluruh rombel sekolah.

### 3.1 Memantau Dashboard Sekolah
1. Masuk dengan akun `kepsek@sekolah.sch.id`.
2. Pada layar Dashboard, pantau:
   - Jumlah siswa aktif dan grafik rombel kelas 1–6.
   - Kehadiran siswa hari ini di seluruh sekolah.
   - Diagram persentase ketidakhadiran (Sakit, Izin, Alpa).

### 3.2 Memantau Ketuntasan Nilai & Kehadiran Kelas
1. Buka menu **Rekap Absensi** dan pilih kelas yang ingin dievaluasi (Kelas 1 sampai 6).
2. Buka menu **Rekap Nilai** untuk melihat ketercapaian nilai per mata pelajaran antar tingkat kelas.
3. Buka menu **Cetak Laporan** untuk mencetak *Laporan Eksekutif Monitoring Sekolah*.

---

## 4. PANDUAN PORTAL SISWA & ORANG TUA

Portal mandiri bagi wali murid dan siswa untuk memantau hasil belajar secara transparan dari gawai/HP masing-masing.

### 4.1 Membuka Portal
1. Di halaman login utama, klik tombol **PORTAL SISWA / ORANG TUA** di pojok kanan atas.
   *(Atau buka langsung tautan URL dengan parameter `?portal=true`).*

### 4.2 Masuk ke Akun Siswa
1. Pilih **Kelas** siswa (contoh: *Kelas 1*).
2. Masukkan **NIS** atau **NISN** siswa (contoh: `1001` atau `0151234561`).
3. Masukkan **PIN Pribadi / Tanggal Lahir** siswa dalam format `YYYY-MM-DD` (contoh: `2019-03-15`) atau 4 digit nomor NIS/NISN.
4. Klik **Buka Hasil Belajar Saya**.

### 4.3 Fitur yang Dapat Dilihat Siswa
1. **Identitas Siswa**: Nama lengkap, NIS, NISN, nama orang tua, dan rombel aktif.
2. **Statistik Kehadiran Pribadi**: Kotak ringkasan Hadir, Sakit, Izin, Alpa, dan persentase kehadiran semester berjalan.
3. **Capaian Nilai Mata Pelajaran**: Nilai Akhir (NA), predikat huruf, dan narasi deskripsi capaian kompetensi setiap mata pelajaran.
4. **Cetak Mandiri**: Klik tombol **Cetak Rapor Saya** untuk mencetak atau menyimpan dokumen hasil belajar dalam bentuk file PDF.
