# PANDUAN PENGGUNA (USER GUIDE)
# SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD (KELAS 1 & KELAS 6)

Panduan operasional lengkap untuk **Siswa / Orang Tua Murid**, **Guru Kelas 1**, **Guru Kelas 6**, dan **Administrator Sekolah**.

---

## DAFTAR ISI
1. [Panduan Siswa & Orang Tua](#1-panduan-siswa--orang-tua)
   - [1.1 Memilih Kelas 1 atau Kelas 6](#11-memilih-kelas-1-atau-kelas-6)
   - [1.2 Melihat Jadwal & Pengumuman Kelas](#12-melihat-jadwal--pengumuman-kelas)
   - [1.3 Mengecek Nilai & Kehadiran Pribadi](#13-mengecek-nilai--kehadiran-pribadi)
2. [Panduan Guru Kelas (Kelas 1 & Kelas 6)](#2-panduan-guru-kelas-kelas-1--kelas-6)
   - [2.1 Masuk ke Akun Guru](#21-masuk-ke-akun-guru)
   - [2.2 Menambah Siswa Baru ke Kelas](#22-menambah-siswa-baru-ke-kelas)
   - [2.3 Menonaktifkan Siswa dari Kelas (Mekanisme Aman)](#23-menonaktifkan-siswa-dari-kelas-mekanisme-aman)
   - [2.4 Mengganti Foto Profil ke Google Drive](#24-mengganti-foto-profil-ke-google-drive)
   - [2.5 Mengisi Presensi Harian Siswa](#25-mengisi-presensi-harian-siswa)
   - [2.6 Menginput & Mempublikasikan Nilai Siswa](#26-menginput--mempublikasikan-nilai-siswa)
   - [2.7 Mencetak Laporan Resmi Format A4/F4](#27-mencetak-laporan-resmi-format-a4f4)
3. [Panduan Administrator Sekolah](#3-panduan-administrator-sekolah)
   - [3.1 Pusat Kontrol & Monitoring Kelas 1 & 6](#31-pusat-kontrol--monitoring-kelas-1--6)
   - [3.2 Memicu Sinkronisasi Manual Google Sheets ↔ Firestore](#32-memicu-sinkronisasi-manual-google-sheets--firestore)
   - [3.3 Mengatur Identitas Resmi Sekolah (Kop Surat)](#33-mengatur-identitas-resmi-sekolah-kop-surat)
   - [3.4 Memantau & Mengekspor Log Audit](#34-memantau--mengekspor-log-audit)

---

## 1. PANDUAN SISWA & ORANG TUA

Halaman awal aplikasi didesain khusus agar ramah anak (*kid-friendly*), bersih, dan mudah digunakan tanpa memerlukan pendaftaran akun yang rumit.

### 1.1 Memilih Kelas 1 atau Kelas 6
1. Buka aplikasi melalui peramban HP Android, tablet, atau laptop.
2. Pada halaman utama, klik salah satu kartu kelas:
   - **KELAS 1** (Fase A)
   - **KELAS 6** (Fase C)
3. Sistem akan langsung memuat informasi wali kelas, foto profil guru, nomor telepon yang dapat dihubungi, jadwal mingguan, dan pengumuman terkait.

### 1.2 Melihat Jadwal & Pengumuman Kelas
- **Jadwal Pelajaran**: Menampilkan mata pelajaran, hari, jam pelajaran, dan guru pengampu.
- **Pengumuman**: Menampilkan surat pemberitahuan kegiatan sekolah, libur, upacara, atau persiapan ujian.
- **Rekap Kehadiran Kelas Umum**: Menampilkan jumlah siswa yang hadir, sakit, izin, dan alpa secara transparan tanpa membuka rincian identitas pribadi siswa tertentu.

### 1.3 Mengecek Nilai & Kehadiran Pribadi
Untuk melindungi kerahasiaan capaian akademik, nilai rapor siswa tidak ditampilkan secara publik di halaman kelas.
1. Klik tombol **🔍 Cek Nilai & Absen Pribadi** di kartu guru kelas.
2. Masukkan **NIS (Nomor Induk Siswa)** ananda (misal: `1001` untuk kelas 1 atau `6001` untuk kelas 6).
3. *(Opsional)* Masukkan tanggal lahir untuk verifikasi ganda.
4. Klik **Periksa Nilai Saya →**.
5. Sistem akan menampilkan rincian nilai tugas/ulangan yang telah dipublikasikan sekolah dan rekapitulasi riwayat presensi ananda saja.

---

## 2. PANDUAN GURU KELAS (KELAS 1 & KELAS 6)

Guru kelas memiliki kewenangan penuh atas kelas yang menjadi tanggung jawabnya dan secara otomatis diisolasi dari kelas lain.

### 2.1 Masuk ke Akun Guru
1. Pada halaman siswa, klik ikon **🔒 Login Staf** di sudut kanan atas.
2. Masukkan email dan kata sandi guru:
   - Guru Kelas 1: `guru1@sekolah.id` / `guru123` *(atau akun resmi Firebase Anda)*
   - Guru Kelas 6: `guru6@sekolah.id` / `guru123`
3. Klik **Masuk ke Sistem →**. Anda akan langsung diarahkan ke Dashboard khusus kelas Anda.

### 2.2 Menambah Siswa Baru ke Kelas
1. Pada Dashboard Guru, klik tombol hijau **➕ Tambah Siswa Baru**.
2. Isi formulir pendaftaran:
   - **NIS (Nomor Induk Siswa)**: Wajib dan tidak boleh sama dengan siswa lain.
   - **NISN**: Nomor Induk Siswa Nasional (jika ada).
   - **Nama Lengkap Siswa**: Wajib.
   - **Kelas**: Otomatis terkunci pada kelas penugasan Anda (tidak dapat diubah guru).
   - **Jenis Kelamin**: Laki-laki atau Perempuan.
   - **Tempat & Tanggal Lahir**.
   - **Nama & Nomor WhatsApp Orang Tua / Wali**.
   - **Alamat Tinggal**.
3. Klik **Daftarkan Siswa →**.
4. Data langsung tersimpan di sistem, Google Sheets, dan Cloud Firestore.

### 2.3 Menonaktifkan Siswa dari Kelas (Mekanisme Aman)
Jika ada siswa yang pindah sekolah, mutasi, atau mengundurkan diri:
1. Pada tabel daftar siswa di Dashboard Guru, cari nama siswa terkait.
2. Klik tombol merah **🚫 Keluarkan**.
3. Muncul dialog konfirmasi penonaktifan aman:
   - Pilih alasan (misal: *Pindah Sekolah / Mutasi Keluar* atau *Mengundurkan Diri*).
   - Tuliskan rincian alasan atau nomor surat mutasi.
4. Klik **Konfirmasi Nonaktifkan Siswa**.
5. **Jaminan Keamanan Data**: Data siswa tidak dihapus dari database. Riwayat nilai rapor dan kehadiran historis tetap utuh dan tersimpan di Google Sheets. Siswa dapat diaktifkan kembali sewaktu-waktu dengan menekan tombol **♻️ Aktifkan Kembali**.

### 2.4 Mengganti Foto Profil ke Google Drive
1. Buka menu **Profil Saya & Foto** dari menu navigasi kiri.
2. Di bagian foto profil, klik **📷 Pilih Foto Baru**.
3. Pilih file gambar dari komputer/HP Anda (format JPG, PNG, atau WebP, maksimal 2 MB).
4. Pratinjau foto akan langsung tampil.
5. Klik tombol **☁️ Simpan ke Google Drive**.
6. Foto akan diunggah otomatis ke Google Drive subfolder `FOTO_GURU` dan URL berkas diperbarui di Google Sheets dan Cloud Firestore.

### 2.5 Mengisi Presensi Harian Siswa
1. Buka menu **Presensi & Kehadiran Siswa**.
2. Pilih tanggal presensi (otomatis terisi hari ini).
3. Pada tabel siswa:
   - Klik tombol status untuk setiap siswa: **Hadir** (hijau), **Sakit** (biru), **Izin** (kuning), atau **Alpa** (merah).
   - Atau gunakan tombol cepat **✓ Set Semua Hadir** untuk mengatur seluruh siswa menjadi Hadir dalam 1 detik, lalu cukup ubah siswa yang berhalangan hadir.
   - Tuliskan keterangan singkat jika siswa sakit atau izin (misal: *Demam tinggi*).
4. Klik tombol **💾 Simpan Presensi**.
5. Sistem memastikan tidak ada pencatatan ganda untuk siswa dan tanggal yang sama.

### 2.6 Menginput & Mempublikasikan Nilai Siswa
1. Buka menu **Penilaian Siswa**.
2. Klik tombol **➕ Input Nilai Siswa**.
3. Isi data asesmen:
   - Pilih siswa dari daftar siswa aktif kelas Anda.
   - Pilih Mata Pelajaran (Pancasila, B. Indonesia, Matematika, IPA, PJOK, Seni Budaya, B. Inggris).
   - Pilih Jenis Asesmen (*Formatif*, *Sumatif Lingkup Materi*, atau *Sumatif Akhir Semester*).
   - Masukkan nama tugas / ulangan (contoh: *Ulangan Harian Pecahan*).
   - Masukkan nilai angka (0 - 100).
   - Atur Status Publikasi:
     - **Draft**: Nilai hanya terlihat oleh Anda dan Admin.
     - **Dipublikasikan**: Nilai dapat dilihat oleh siswa/wali yang bersangkutan.
4. Klik **Simpan Nilai Siswa →**.
5. Untuk mempublikasikan nilai secara massal, centang kotak di sebelah nama nilai pada tabel, lalu klik **📢 Publikasikan Nilai Terpilih**.

### 2.7 Mencetak Laporan Resmi Format A4/F4
1. Buka halaman **Presensi** atau **Penilaian**.
2. Klik tombol **🖨️ Cetak Lembar Absensi** atau **🖨️ Cetak Rekap Nilai**.
3. Kotak dialog cetak peramban (*Print Preview*) akan otomatis terbuka:
   - Sidebar, bilah tombol, dan navigasi HP otomatis disembunyikan.
   - Di bagian atas, otomatis tercetak **KOP SURAT RESMI SEKOLAH** lengkap dengan nama sekolah, NPSN, dan alamat.
   - Di bagian bawah, otomatis tersedia **KOLOM TANDA TANGAN** Kepala Sekolah dan Guru Kelas.
4. Pilih printer tujuan atau pilih **Save as PDF** untuk menyimpan berkas ke perangkat Anda.

---

## 3. PANDUAN ADMINISTRATOR SEKOLAH

Administrator memiliki akses supervisi tertinggi untuk mengontrol seluruh data sekolah di Kelas 1 dan Kelas 6.

### 3.1 Pusat Kontrol & Monitoring Kelas 1 & 6
1. Masuk menggunakan akun admin: `admin@sekolah.id` / `admin123`.
2. Dashboard Admin menampilkan:
   - Total siswa aktif Kelas 1 dan Kelas 6.
   - Total presensi hari ini untuk seluruh sekolah.
   - Status kesehatan sinkronisasi Google Sheets dan Firestore.
   - Log 5 aktivitas terakhir yang dilakukan oleh seluruh pengguna.

### 3.2 Memicu Sinkronisasi Manual Google Sheets ↔ Firestore
1. Klik tombol **🔄 Sinkronkan Sekarang** pada banner dashboard admin atau buka menu **Sinkronisasi Data**.
2. Sistem akan memvalidasi keutuhan 11 Sheet master Google Sheets dan menyinkronkan seluruh perubahan ke Cloud Firestore.
3. Waktu selesai dan status sinkronisasi akan dicatat di Sheet `STATUS_SINKRONISASI`.

### 3.3 Mengatur Identitas Resmi Sekolah (Kop Surat)
1. Buka menu **Pengaturan Sistem**.
2. Ubah data resmi sekolah sesuai kebutuhan:
   - Nama Resmi Sekolah (contoh: `SD NEGERI HARAPAN BANGSA`).
   - NPSN.
   - Alamat Lengkap.
   - Nama Kepala Sekolah dan NIP resmi.
   - Tahun Ajaran Aktif dan Semester Aktif (Ganjil/Genap).
   - Pengaturan apakah rekap umum absensi boleh ditampilkan di halaman siswa.
3. Klik **💾 Simpan Pengaturan Sekolah**. Seluruh kop surat cetak akan langsung terupdate secara otomatis!

### 3.4 Memantau & Mengekspor Log Audit
1. Buka menu **Log Aktivitas**.
2. Admin dapat melihat seluruh riwayat operasi: siapa pengguna yang melakukan aksi, peran (*role*), jenis data yang diubah, dan waktu pastinya.
3. Klik tombol **📥 Ekspor Log CSV** untuk mengunduh rekapitulasi audit trail ke format Microsoft Excel / spreadsheet.
