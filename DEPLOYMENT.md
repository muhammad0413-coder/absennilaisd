# PANDUAN DEPLOYMENT GITHUB & VERCEL (DEPLOYMENT.md)
## SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD

Panduan ini mendokumentasikan langkah publikasi aplikasi dari repositori lokal ke **GitHub** dan hosting produksi di **Vercel** hingga dapat diakses secara online dari ponsel, tablet, laptop, dan komputer guru.

---

## BAGIAN 1. MENGUNGGAH KE GITHUB

### 1.1 Verifikasi Kebersihan Berkas (.gitignore)
Pastikan berkas `.gitignore` telah memblokir direktori `node_modules/`, `dist/`, `.env`, dan berkas lokal:
```bash
# Periksa status git
git status
```

### 1.2 Menyiapkan Commit Pertama
Buka terminal PowerShell pada direktori proyek (`d:\VIVTA LUSIANA\absen`):
```powershell
# Menambahkan semua berkas proyek
git add .

# Membuat commit awal
git commit -m "feat: inisialisasi sistem informasi absensi dan nilai sd siap produksi"
```

### 1.3 Membuat Repositori di GitHub
1. Buka [GitHub](https://github.com/) dan masuk ke akun Anda.
2. Klik tombol hijau **New** (Buat Repositori Baru).
3. Beri nama repositori: `sistem-absensi-nilai-sd`.
4. Pilih visibilitas: **Private** (disarankan) atau **Public**.
5. *Jangan centang Add a README* (karena proyek lokal sudah memiliki README lengkap).
6. Klik **Create repository**.

### 1.4 Menghubungkan dan Push ke GitHub
Salin perintah dari halaman repositori GitHub Anda:
```powershell
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/sistem-absensi-nilai-sd.git
git push -u origin main
```

Setiap kali Anda membuat perubahan kode di masa mendatang, cukup jalankan:
```powershell
git add .
git commit -m "update: penjelasan perubahan"
git push
```

---

## BAGIAN 2. DEPLOYMENT KE VERCEL

Vercel menyediakan hosting cepat, CDN global, sertifikat SSL HTTPS otomatis, dan integrasi Continuous Deployment (setiap `git push` otomatis ter-deploy ulang).

### 2.1 Menghubungkan Repositori di Vercel
1. Buka peramban dan kunjungi [Vercel Dashboard](https://vercel.com/).
2. Masuk menggunakan akun GitHub Anda (*Continue with GitHub*).
3. Klik tombol **Add New...** di kanan atas > pilih **Project**.
4. Pada daftar repositori GitHub yang muncul, cari `sistem-absensi-nilai-sd`, lalu klik tombol **Import**.

### 2.2 Mengonfigurasi Build Settings
Vercel akan mendeteksi Vite secara otomatis:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Memasukkan Environment Variables di Vercel
Buka bagian **Environment Variables** sebelum mengklik deploy. Masukkan seluruh variabel berikut:

| Key | Value (Contoh) |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyYourApiKey...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `sd-siakad-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `sd-siakad-app` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `sd-siakad-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:abcdef...` |
| `VITE_APPS_SCRIPT_URL` | `https://script.google.com/macros/s/AKfycbx.../exec` |
| `VITE_API_SECRET_KEY` | `sd_secret_sync_key_change_in_production` |

### 2.4 Klik Tombol Deploy
1. Klik tombol **Deploy**.
2. Vercel akan menjalankan instalasi paket dan `npm run build` dalam waktu sekitar 30–60 detik.
3. Setelah selesai, layar perayaan confetti akan muncul dengan pesan:
   **Congratulations! Your project has been deployed.**
4. Klik tautan domain yang diberikan (contoh: `https://sistem-absensi-nilai-sd.vercel.app`).

---

## BAGIAN 3. PENGUJIAN AKHIR SITUS ONLINE

1. **Uji Responsivitas Perangkat**:
   - Buka URL Vercel melalui browser ponsel Android/iPhone: pastikan menu samping otomatis menjadi drawer navigasi mobile dan tabel dapat digeser horizontal dengan nyaman.
   - Buka melalui laptop atau komputer desktop: pastikan sidebar kiri tampil kokoh dan layout lebar.
2. **Uji Login Multi-Peran**:
   - Uji login sebagai Administrator, Guru Kelas, dan Kepala Sekolah.
3. **Uji Portal Siswa**:
   - Buka menu *Portal Siswa / Orang Tua*, masukkan NIS dan PIN, verifikasi data terbuka dengan benar.
4. **Uji Cetak Rapor**:
   - Klik tombol Cetak Rapor dan pastikan pratinjau cetak A4 rapi tanpa tombol-tombol antarmuka.
