# PANDUAN KONFIGURASI FIREBASE (SETUP_FIREBASE.md)
# SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6

---

## 1. MEMBUAT PROYEK FIREBASE

1. Buka [Firebase Console](https://console.firebase.google.com/) menggunakan akun Google Anda.
2. Klik tombol **Add project** (Tambah Proyek).
3. Masukkan nama proyek: `sd-absensi-penilaian` (atau nama pilihan Anda).
4. *(Opsional)* Google Analytics dapat dinonaktifkan atau diaktifkan sesuai kebutuhan sekolah.
5. Klik **Create project** dan tunggu proses inisialisasi selesai.

---

## 2. MENGAKTIFKAN FIREBASE AUTHENTICATION

1. Di menu sidebar kiri Firebase Console, pilih **Build > Authentication**.
2. Klik tombol **Get started**.
3. Di tab **Sign-in method**, pilih penyedia **Email/Password**.
4. Aktifkan sakelar **Email/Password** (Biarkan Email link/passwordless nonaktif).
5. Klik **Save**.
6. Di tab **Users**, Anda dapat menambahkan akun awal staf:
   - `admin@sekolah.id`
   - `kepsek@sekolah.id`
   - `guru1@sekolah.id` s/d `guru6@sekolah.id`

---

## 3. MEMBUAT DATABASE CLOUD FIRESTORE

1. Di menu sidebar kiri, pilih **Build > Firestore Database**.
2. Klik tombol **Create database**.
3. Pilih lokasi server database (Disarankan: `asia-southeast2` Jakarta untuk kecepatan akses maksimal di Indonesia).
4. Pada opsi aturan keamanan awal, pilih **Start in production mode**.
5. Klik **Create** dan tunggu database selesai dibuat.

---

## 4. MEMASANG ATURAN KEAMANAN (FIRESTORE SECURITY RULES)

Aturan keamanan sangat penting untuk memastikan Guru Kelas 1 tidak dapat mengubah data Kelas 2–6, Kepala Sekolah hanya memiliki akses monitoring, dan data siswa terlindungi.

1. Buka tab **Rules** pada Firestore Database Anda.
2. Salin seluruh isi dari berkas [`firestore.rules`](firestore.rules) di proyek ini.
3. Tempelkan ke editor Rules di Firebase Console:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isAuthenticated() { return request.auth != null; }
       function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
       function isAdmin() { return isAuthenticated() && (request.auth.token.role == 'admin' || getUserData().role == 'admin'); }
       function isHeadmaster() { return isAuthenticated() && (request.auth.token.role == 'kepala_sekolah' || getUserData().role == 'kepala_sekolah'); }
       function isTeacher() { return isAuthenticated() && (request.auth.token.role == 'guru' || getUserData().role == 'guru'); }
       function getTeacherClass() { return getUserData().kelas_ditugaskan; }
       function isTeacherForClass(kelasId) { return isTeacher() && getTeacherClass() == kelasId; }

       match /users/{userId} {
         allow read: if isAuthenticated();
         allow write: if isAdmin();
       }
       match /students/{studentId} {
         allow read: if isAuthenticated();
         allow write: if isAdmin();
       }
       match /attendance/{attendanceId} {
         allow read: if isAuthenticated();
         allow create, update: if isAdmin() || isTeacherForClass(request.resource.data.Kelas);
         allow delete: if isAdmin();
       }
       match /grades/{gradeId} {
         allow read: if isAuthenticated();
         allow create, update: if isAdmin() || isTeacherForClass(request.resource.data.Kelas);
         allow delete: if isAdmin();
       }
       match /settings/{settingId} {
         allow read: if isAuthenticated();
         allow write: if isAdmin();
       }
       match /syncJobs/{jobId} { allow read, write: if isAdmin(); }
       match /auditLogs/{logId} {
         allow read: if isAdmin() || isHeadmaster();
         allow create: if isAuthenticated();
         allow update, delete: if false;
       }
     }
   }
   ```
4. Klik tombol **Publish**.

---

## 5. MENGAMBIL KONFIGURASI WEB APP KE .ENV

1. Buka **Project Settings** (ikon roda gigi di sudut kiri atas) > tab **General**.
2. Gulir ke bawah ke bagian **Your apps**, lalu klik ikon Web (`</>`).
3. Beri nama aplikasi: `SD Absensi Web`, lalu klik **Register app**.
4. Firebase akan menampilkan objek konfigurasi `firebaseConfig`:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "sd-absensi-penilaian.firebaseapp.com",
     projectId: "sd-absensi-penilaian",
     storageBucket: "sd-absensi-penilaian.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Buka file `.env` di komputer Anda, lalu masukkan nilai tersebut:
   ```env
   VITE_FIREBASE_API_KEY="AIzaSy..."
   VITE_FIREBASE_AUTH_DOMAIN="sd-absensi-penilaian.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="sd-absensi-penilaian"
   VITE_FIREBASE_STORAGE_BUCKET="sd-absensi-penilaian.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="..."
   VITE_FIREBASE_APP_ID="1:...:web:..."
   ```

Setelah file `.env` disimpan dan server di-restart (`npm run dev`), sistem akan langsung terhubung secara live ke Firebase!
