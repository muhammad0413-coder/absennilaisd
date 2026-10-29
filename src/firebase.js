/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * FIREBASE INITIALIZATION & SAFETY LAYER (src/firebase.js)
 * ==============================================================================
 */

import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

// Ambil konfigurasi dari Environment Variables (.env atau Vercel)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Cek apakah konfigurasi Firebase valid (bukan placeholder kosong)
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("XXXXXXXX") &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("sd-absensi-penilaian")
);

let app = null;
let auth = null;
let db = null;

try {
  if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("[Firebase] Inisialisasi Firebase Auth & Firestore Berhasil.");
  } else {
    console.warn("[Firebase] Konfigurasi Firebase asli belum diisi di .env. Berjalan dalam mode Terisolasi / Demo.");
  }
} catch (error) {
  console.error("[Firebase] Error saat inisialisasi Firebase:", error);
}

export { 
  app, 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  fbSignOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updatePassword,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
};
