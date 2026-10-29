# PANDUAN DEPLOYMENT GITHUB & VERCEL (DEPLOYMENT.md)
# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

---

## 1. PUSH KODE KE GITHUB REPOSITORY

### Langkah A: Inisialisasi dan Commit
Jika Anda melakukan perubahan kode lokal:
```bash
git add .
git commit -m "feat: implement sistem absensi dan nilai sd kelas 1-6"
```

### Langkah B: Buat Repository di GitHub
1. Buka [GitHub](https://github.com/) dan login ke akun Anda.
2. Klik tombol **New** untuk membuat repository baru.
3. Beri nama: `sd-absensi-penilaian`.
4. Pilih opsi **Private** (Direkomendasikan untuk keamanan konfigurasi sekolah).
5. Jangan centang *Add a README file* (karena proyek lokal sudah memiliki file lengkap).
6. Klik **Create repository**.

### Langkah C: Hubungkan dan Push ke GitHub
Salin URL repository Anda dari GitHub, lalu jalankan perintah berikut di terminal:
```bash
git branch -M main
git remote add origin https://github.com/USERNAME/sd-absensi-penilaian.git
git push -u origin main
```

---

## 2. DEPLOYMENT KE VERCEL

### Langkah A: Impor Repository di Vercel
1. Buka [Vercel Dashboard](https://vercel.com/) dan login (dapat menggunakan akun GitHub Anda).
2. Klik tombol **Add New... > Project**.
3. Di daftar repository, temukan `sd-absensi-penilaian`, lalu klik **Import**.

### Langkah B: Konfigurasi Proyek
Vercel akan otomatis mendeteksi:
- **Framework Preset**: `Vite`
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Langkah C: Menambahkan Environment Variables
Sebelum menekan tombol Deploy, buka bagian **Environment Variables** dan tambahkan variabel berikut dari file `.env`:

| Key Variabel | Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `VITE_GAS_API_URL` | URL Web App Google Apps Script | `https://script.google.com/macros/s/.../exec` |
| `VITE_FIREBASE_API_KEY` | Firebase API Key Web | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `sd-absensi-penilaian.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID Firebase | `sd-absensi-penilaian` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage Bucket Firebase | `sd-absensi-penilaian.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | App ID Firebase Web | `1:123456789012:web:abcdef` |

### Langkah D: Klik Deploy
Klik tombol **Deploy**. Vercel akan mengompilasi bundel Vite dalam waktu ~30 detik dan memberikan URL produksi resmi (contoh: `https://sd-absensi-penilaian.vercel.app`).

---

## 3. PENGATURAN DOMAIN KUSTOM SEKOLAH (OPSIONAL)

Jika sekolah memiliki domain resmi (contoh: `absen.sdnharapanbangsa.sch.id`):
1. Di Vercel Dashboard, buka tab **Settings > Domains**.
2. Masukkan subdomain sekolah Anda.
3. Tambahkan DNS Record CNAME yang diberikan Vercel pada panel domain sekolah.
4. Sertifikat SSL HTTPS akan otomatis aktif secara gratis.

---

## 4. CARA MENGUJI VERSI PRODUKSI

1. Buka URL Vercel di browser laptop dan smartphone Android.
2. Uji alur login:
   - Coba login menggunakan akun Guru Kelas 1: periksa bahwa menu yang tampil hanya Kelas 1.
   - Coba login menggunakan akun Administrator: periksa seluruh akses Kelas 1–6 dan sinkronisasi data.
3. Buka menu **Cetak Laporan** dan jalankan cetak untuk memastikan format Kop Surat dan tanda tangan tampil rapi tanpa terpotong.
4. Pada HP Android, buka menu peramban Chrome dan pilih **Add to Home screen** (Tambahkan ke Layar Utama) untuk menguji instalasi PWA.

---

## 5. CARA MEMPERBARUI APLIKASI (CONTINUOUS DEPLOYMENT)

Vercel terhubung secara otomatis dengan GitHub:
Setiap kali Anda melakukan `git push` ke cabang `main`:
```bash
git add .
git commit -m "fix: update tampilan dan sinkronisasi"
git push origin main
```
Vercel akan otomatis melakukan proses *rebuild* dan pembaruan aplikasi langsung online tanpa *downtime*.
