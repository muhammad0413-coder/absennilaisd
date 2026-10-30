import React, { useState, useEffect } from 'react';
import { Database, FileSpreadsheet, Server, HardDrive, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { isFirebaseConfigured } from '../../services/firebase/firebase';
import { isAppsScriptConfigured, testAppsScriptConnection } from '../../services/apps-script/appsScriptApi';
import { SystemSyncStatus } from '../../types';
import { Modal } from './Modal';

export const ConnectionStatusBanner: React.FC = () => {
  const [status, setStatus] = useState<SystemSyncStatus | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await testAppsScriptConnection();
      setStatus(res);
    } catch {
      // Ignored
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const hasIssues = !isFirebaseConfigured || !isAppsScriptConfigured;

  return (
    <>
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 gap-2 print:hidden">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">Status Sistem:</span>

          {/* Firebase Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isFirebaseConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Database className="w-3.5 h-3.5" />
            <span>Firebase: {isFirebaseConfigured ? 'Terhubung' : 'Demo Mode (Belum Diisi)'}</span>
          </div>

          {/* Google Sheets Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isAppsScriptConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets: {isAppsScriptConfigured ? 'Aktif' : 'Menunggu Apps Script'}</span>
          </div>

          {/* Apps Script Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isAppsScriptConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            <Server className="w-3.5 h-3.5" />
            <span>Apps Script: {isAppsScriptConfigured ? 'Terhubung' : 'Belum Dikonfigurasi'}</span>
          </div>

          {/* Google Drive Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${isAppsScriptConfigured ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
            <HardDrive className="w-3.5 h-3.5" />
            <span>Google Drive: {isAppsScriptConfigured ? 'Siap' : 'Menunggu Apps Script'}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {hasIssues && (
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1 px-3 py-1 bg-school-navy text-white rounded-lg hover:bg-school-blue transition font-semibold text-xs shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Konfigurasi Eksternal</span>
            </button>
          )}
          <button
            onClick={checkStatus}
            disabled={checking}
            className="text-slate-500 hover:text-slate-800 underline text-xs disabled:opacity-50"
          >
            {checking ? 'Memeriksa...' : 'Periksa Status'}
          </button>
        </div>
      </div>

      {/* Guide Modal */}
      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Status Koneksi & Panduan Aktivasi Integrasi"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-slate-700 text-sm">
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Aplikasi Berjalan dalam Mode Siap Pakai / Demo</p>
              <p className="text-xs text-amber-800 mt-1">
                Seluruh fungsi (tambah siswa, absensi, input nilai, cetak rapor, rekap, export) <strong>berfungsi penuh</strong>. Untuk menghubungkan ke akun Google Cloud & Google Workspace Anda, ikuti 3 langkah berikut:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 border rounded-xl bg-slate-50">
              <h4 className="font-bold text-school-navy flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-school-navy text-white text-xs flex items-center justify-center">1</span>
                Koneksi Firebase
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Buka file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-school-blue">SETUP_FIREBASE.md</code>. Buat project di console.firebase.google.com, aktifkan Authentication & Firestore, lalu masukkan kredensial ke file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">.env</code>.
              </p>
            </div>

            <div className="p-3.5 border rounded-xl bg-slate-50">
              <h4 className="font-bold text-school-navy flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-school-navy text-white text-xs flex items-center justify-center">2</span>
                Koneksi Google Sheets & Drive
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Buka file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-school-blue">SETUP_GOOGLE_SHEETS.md</code> dan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-school-blue">SETUP_GOOGLE_DRIVE.md</code>. Buat Google Spreadsheet baru dengan nama "DATABASE SISTEM ABSENSI DAN NILAI SD".
              </p>
            </div>

            <div className="p-3.5 border rounded-xl bg-slate-50">
              <h4 className="font-bold text-school-navy flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-school-navy text-white text-xs flex items-center justify-center">3</span>
                Deploy Google Apps Script
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Buka file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-school-blue">SETUP_APPS_SCRIPT.md</code>. Salin kode dari folder <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">apps-script/</code> ke script.google.com, deploy sebagai Web App, lalu masukkan URL-nya ke <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">VITE_APPS_SCRIPT_URL</code>.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowGuideModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition text-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
