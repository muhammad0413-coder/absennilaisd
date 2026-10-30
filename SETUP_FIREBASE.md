# PANDUAN LENGKAP PENGATURAN FIREBASE (SETUP_FIREBASE.md)
## SISTEM INFORMASI ABSENSI DAN NILAI SISWA SD

Panduan teknis ini menjelaskan langkah demi langkah aktivasi Firebase Authentication dan Cloud Firestore untuk sistem informasi sekolah.

---

## 1. Membuat Proyek Firebase Baru

1. Buka browser dan kunjungi [Firebase Console](https://console.firebase.google.com/).
2. Masuk menggunakan akun Google Anda.
3. Klik tombol **Tambahkan Proyek** (*Add Project*).
4. Masukkan nama proyek: contoh `sd-siakad-absensi-nilai`.
5. Google Analytics bersifat opsional (dapat dinonaktifkan atau diaktifkan).
6. Klik **Buat Proyek** dan tunggu beberapa saat hingga proyek siap.

---

## 2. Mengaktifkan Firebase Authentication

1. Di menu bilah kiri Firebase Console, klik **Build** lalu pilih **Authentication**.
2. Klik tombol **Mulai** (*Get Started*).
3. Pada tab **Sign-in method**, pilih penyedia **Email/Sandi** (*Email/Password*).
4. Aktifkan toggle **Email/Sandi** menjadi **Enabled** (opsi Email link tanpa sandi dibiarkan nonaktif).
5. Klik **Simpan** (*Save*).
6. Buka tab **Users** dan klik **Tambahkan Pengguna** (*Add user*) untuk membuat akun awal:
   - Email: `admin@sekolah.sch.id`
   - Sandi: (buat sandi aman minimal 6 karakter, contoh: `AdminSekolah2026!`)
   - Anda juga dapat menambahkan akun guru sesuai kebutuhan: `guru1@sekolah.sch.id`, `guru2@sekolah.sch.id`, dst.

---

## 3. Membuat Basis Data Cloud Firestore

1. Di menu bilah kiri, klik **Build** lalu pilih **Firestore Database**.
2. Klik tombol **Buat Database** (*Create database*).
3. Pilih **Lokasi Database** (*Location*): Pilih lokasi terdekat untuk latensi terbaik di Indonesia, disarankan **asia-southeast2 (Jakarta)** atau `asia-southeast1 (Singapura)`.
4. Pada pilihan aturan keamanan, pilih **Mulai dalam mode produksi** (*Start in production mode*).
5. Klik **Selesai** (*Create*).

---

## 4. Memasang Aturan Keamanan (Firestore Security Rules)

Aplikasi telah dilengkapi aturan keamanan tingkat produksi pada file `firestore.rules`.

1. Di halaman Cloud Firestore Console, klik tab **Aturan** (*Rules*).
2. Salin seluruh isi berkas `firestore.rules` dari folder proyek aplikasi Anda:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    function isAdmin() {
      return isAuthenticated() && (
        getUserData().role == 'admin' ||
        request.auth.token.role == 'admin'
      );
    }
    function isTeacher() {
      return isAuthenticated() && (
        getUserData().role == 'guru' ||
        request.auth.token.role == 'guru'
      );
    }
    function isPrincipal() {
      return isAuthenticated() && (
        getUserData().role == 'kepsek' ||
        request.auth.token.role == 'kepsek'
      );
    }
    function isTeacherAssignedToClass(targetClass) {
      return isTeacher() && (
        targetClass in getUserData().assignedClasses
      );
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin() || isPrincipal());
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (
        isAuthenticated() && request.auth.uid == userId &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'assignedClasses', 'active'])
      );
    }

    match /students/{studentId} {
      allow read: if isAdmin() || isPrincipal() || (
        isTeacher() && isTeacherAssignedToClass(resource.data.class)
      );
      allow create: if isAdmin() || (
        isTeacher() && isTeacherAssignedToClass(request.resource.data.class)
      );
      allow update: if isAdmin() || (
        isTeacher() && isTeacherAssignedToClass(resource.data.class) &&
        isTeacherAssignedToClass(request.resource.data.class)
      );
      allow delete: if isAdmin();
    }

    match /attendance/{attendanceId} {
      allow read: if isAdmin() || isPrincipal() || (
        isTeacher() && isTeacherAssignedToClass(resource.data.class)
      );
      allow create: if isAdmin() || (
        isTeacher() && isTeacherAssignedToClass(request.resource.data.class)
      );
      allow update: if isAdmin() || (
        isTeacher() && isTeacherAssignedToClass(resource.data.class) &&
        isTeacherAssignedToClass(request.resource.data.class)
      );
      allow delete: if isAdmin();
    }

    match /grades/{gradeId} {
      allow read: if isAdmin() || isPrincipal() || (
        isTeacher() && isTeacherAssignedToClass(resource.data.class)
      );
      allow create: if isAdmin() || (
        isTeacher() && isTeacherAssignedToClass(request.resource.data.class)
      );
      allow update: if isAdmin() || (
        isTeacher() && isTeacherAssignedToClass(resource.data.class) &&
        isTeacherAssignedToClass(request.resource.data.class)
      );
      allow delete: if isAdmin();
    }

    match /schoolProfile/{profileId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /syncJobs/{jobId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

    match /auditLogs/{logId} {
      allow read: if isAdmin() || isPrincipal();
      allow create: if isAuthenticated();
      allow update, delete: if false;
    }

    match /studentPortalAccess/{accessId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```
3. Tempelkan ke editor aturan di Firestore Console.
4. Klik tombol **Publikasikan** (*Publish*).

---

## 5. Memasang Indeks Gabungan (Composite Indexes)

Untuk mempercepat kueri gabungan (filter kelas + pengurutan nama atau tanggal):
1. Buka tab **Indeks** (*Indexes*) di Firestore Console.
2. Anda dapat menambahkan indeks manual sesuai definisi `firestore.indexes.json`:
   - Koleksi: `students` | Field: `class` (ASC), `status` (ASC), `name` (ASC)
   - Koleksi: `attendance` | Field: `class` (ASC), `date` (DESC)
   - Koleksi: `grades` | Field: `class` (ASC), `subject` (ASC), `assessmentType` (ASC)
3. Atau melalui Firebase CLI: `firebase deploy --only firestore:indexes`.

---

## 6. Mengambil Konfigurasi Firebase Web SDK

1. Klik ikon roda gigi (Pengaturan Proyek / *Project Settings*) di kiri atas.
2. Pada tab **General**, gulir ke bawah ke bagian **Aplikasi Anda** (*Your apps*).
3. Klik ikon web **</>** untuk mendaftarkan aplikasi web.
4. Masukkan nama aplikasi: `Sistem Informasi Sekolah SD Web`.
5. Klik **Daftarkan aplikasi** (*Register app*).
6. Salin objek `firebaseConfig`:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 7. Memasukkan Konfigurasi ke Environment Variables

Buka berkas `.env` di komputer Anda, lalu isi variabel berikut:

```env
VITE_FIREBASE_API_KEY=AIzaSy...ContohKunciAnda...
VITE_FIREBASE_AUTH_DOMAIN=sd-siakad-absensi-nilai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sd-siakad-absensi-nilai
VITE_FIREBASE_STORAGE_BUCKET=sd-siakad-absensi-nilai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

Simpan berkas `.env` dan jalankan ulang `npm run dev`. Status Firebase di bilah atas aplikasi akan langsung berubah menjadi **Terhubung**.
