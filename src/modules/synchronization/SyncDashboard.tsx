import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Database,
  FileSpreadsheet,
  Server,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ShieldAlert,
  ArrowRightLeft,
  ListOrdered,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  testAppsScriptConnection,
  callAppsScript,
} from '../../services/apps-script/appsScriptApi';
import {
  syncStudentsFromSheets,
  syncAttendanceToSheets,
  syncGradesToSheets,
  syncAllEntities,
  SyncExecutionResult,
} from '../../services/sync/syncManager';
import { SystemSyncStatus } from '../../types';
import { formatDateTimeIndo } from '../../utils/formatters';

export const SyncDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotification();

  const [systemStatus, setSystemStatus] = useState<SystemSyncStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingStudents, setSyncingStudents] = useState(false);
  const [syncingAttendance, setSyncingAttendance] = useState(false);
  const [syncingGrades, setSyncingGrades] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const [lastResults, setLastResults] = useState<SyncExecutionResult[]>([]);

  const fetchStatus = async () => {
    setChecking(true);
    try {
      const res = await testAppsScriptConnection();
      setSystemStatus(res);
    } catch (e: any) {
      showToast('error', 'Gagal Memeriksa Koneksi', e.message);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSyncStudents = async () => {
    setSyncingStudents(true);
    try {
      const res = await syncStudentsFromSheets();
      setLastResults(prev => [res, ...prev.slice(0, 9)]);
      if (res.status === 'BERHASIL') {
        showToast('success', 'Sinkronisasi Siswa Selesai', res.message);
      } else if (res.status === 'SEBAGIAN') {
        showToast('warning', 'Sinkronisasi Sebagian', res.message);
      } else {
        showToast('error', 'Sinkronisasi Siswa Gagal', res.message);
      }
      fetchStatus();
    } catch (err: any) {
      showToast('error', 'Error Eksekusi', err.message);
    } finally {
      setSyncingStudents(false);
    }
  };

  const handleSyncAttendance = async () => {
    setSyncingAttendance(true);
    try {
      // Sync classes 1 through 6 for today
      const today = new Date().toISOString().slice(0, 10);
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let c = 1; c <= 6; c++) {
        const res = await syncAttendanceToSheets(String(c), today);
        totalSuccess += res.successCount;
        totalFailed += res.failedCount;
      }

      const summaryResult: SyncExecutionResult = {
        type: 'Absensi (Semua Kelas)',
        total: totalSuccess + totalFailed,
        successCount: totalSuccess,
        failedCount: totalFailed,
        errors: [],
        status: totalFailed === 0 ? 'BERHASIL' : totalSuccess > 0 ? 'SEBAGIAN' : 'GAGAL',
        message: `Sinkronisasi Absensi: ${totalSuccess} sukses, ${totalFailed} gagal.`,
        timestamp: new Date().toISOString(),
      };

      setLastResults(prev => [summaryResult, ...prev.slice(0, 9)]);
      showToast(summaryResult.status === 'BERHASIL' ? 'success' : 'warning', 'Sinkronisasi Absensi', summaryResult.message);
      fetchStatus();
    } catch (err: any) {
      showToast('error', 'Error Eksekusi', err.message);
    } finally {
      setSyncingAttendance(false);
    }
  };

  const handleSyncGrades = async () => {
    setSyncingGrades(true);
    try {
      // Sync classes 1 through 6
      let totalSuccess = 0;
      let totalFailed = 0;

      for (let c = 1; c <= 6; c++) {
        const res = await syncGradesToSheets(String(c), 'Matematika');
        totalSuccess += res.successCount;
        totalFailed += res.failedCount;
      }

      const summaryResult: SyncExecutionResult = {
        type: 'Nilai (Semua Kelas)',
        total: totalSuccess + totalFailed,
        successCount: totalSuccess,
        failedCount: totalFailed,
        errors: [],
        status: totalFailed === 0 ? 'BERHASIL' : totalSuccess > 0 ? 'SEBAGIAN' : 'GAGAL',
        message: `Sinkronisasi Nilai: ${totalSuccess} sukses, ${totalFailed} gagal.`,
        timestamp: new Date().toISOString(),
      };

      setLastResults(prev => [summaryResult, ...prev.slice(0, 9)]);
      showToast(summaryResult.status === 'BERHASIL' ? 'success' : 'warning', 'Sinkronisasi Nilai', summaryResult.message);
      fetchStatus();
    } catch (err: any) {
      showToast('error', 'Error Eksekusi', err.message);
    } finally {
      setSyncingGrades(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await handleSyncStudents();
      await handleSyncAttendance();
      await handleSyncGrades();
      showToast('success', 'Sinkronisasi Menyeluruh Selesai', 'Seluruh antrean data telah diproses.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const res = await callAppsScript('retryFailedSync');
      if (res.success) {
        showToast('success', 'Percobaan Ulang Selesai', `Data berhasil dipulihkan: ${res.data?.resolved || 0}`);
      } else {
        showToast('info', 'Antrean Bersih', res.message || 'Tidak ada data antrean gagal.');
      }
      fetchStatus();
    } catch (e: any) {
      showToast('error', 'Gagal Retry Antrean', e.message);
    } finally {
      setRetrying(false);
    }
  };

  // Status Card Helper
  const renderPillarCard = (
    name: string,
    icon: any,
    statusObj?: { connected: boolean; status: string; message?: string }
  ) => {
    const Icon = icon;
    const isOk = statusObj?.connected;
    const statusText = statusObj?.status || 'BELUM_TERHUBUNG';

    const bgBadge = isOk
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : statusText === 'MENUNGGU'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-school-navy">
            <Icon className="w-5 h-5 text-school-blue" />
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${bgBadge}`}>
            {statusText}
          </span>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {statusObj?.message || (isOk ? 'Layanan berjalan normal dan siap menerima transaksi' : 'Menunggu konfigurasi kredensial')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pusat Sinkronisasi Dua Arah</h2>
          <p className="text-xs text-slate-500">
            Monitoring koneksi Firebase, Google Sheets, Apps Script, dan Google Drive
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={checking}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Memeriksa...' : 'Periksa Koneksi'}</span>
          </button>

          <button
            onClick={handleRetryFailed}
            disabled={retrying}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-600 ${retrying ? 'animate-spin' : ''}`} />
            <span>Ulangi Data Gagal</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="px-4 py-2 bg-school-navy text-white font-semibold text-xs rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <ArrowRightLeft className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
            <span>{syncingAll ? 'Menyinkronkan...' : 'Sinkronkan Semua'}</span>
          </button>
        </div>
      </div>

      {/* 4 Pillars Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderPillarCard('1. Firebase Firestore', Database, systemStatus?.services?.firebase)}
        {renderPillarCard('2. Google Sheets', FileSpreadsheet, systemStatus?.services?.sheets)}
        {renderPillarCard('3. Google Apps Script', Server, systemStatus?.services?.appsScript)}
        {renderPillarCard('4. Google Drive', HardDrive, systemStatus?.services?.googleDrive)}
      </div>

      {/* Granular Sync Actions Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm md:text-base">Aksi Sinkronisasi Parsial</h3>
          <p className="text-xs text-slate-500">
            Jalankan sinkronisasi entitas tertentu secara manual sesuai kebutuhan data
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Sync Students */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Master Siswa (1–6)</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Arah: Google Sheets &rarr; Apps Script &rarr; Firebase
              </p>
            </div>
            <button
              onClick={handleSyncStudents}
              disabled={syncingStudents}
              className="w-full py-2 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl hover:bg-school-navy hover:text-white transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingStudents ? 'animate-spin' : ''}`} />
              <span>{syncingStudents ? 'Menyinkronkan...' : 'Sinkronkan Siswa'}</span>
            </button>
          </div>

          {/* Sync Attendance */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Catatan Absensi Harian</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Arah: Firebase Firestore &rarr; Google Sheets (Data_Absensi)
              </p>
            </div>
            <button
              onClick={handleSyncAttendance}
              disabled={syncingAttendance}
              className="w-full py-2 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl hover:bg-school-navy hover:text-white transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingAttendance ? 'animate-spin' : ''}`} />
              <span>{syncingAttendance ? 'Menyinkronkan...' : 'Sinkronkan Absensi'}</span>
            </button>
          </div>

          {/* Sync Grades */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3 flex flex-col justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Catatan Nilai Asesmen</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Arah: Firebase Firestore &rarr; Google Sheets (Data_Nilai)
              </p>
            </div>
            <button
              onClick={handleSyncGrades}
              disabled={syncingGrades}
              className="w-full py-2 bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl hover:bg-school-navy hover:text-white transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGrades ? 'animate-spin' : ''}`} />
              <span>{syncingGrades ? 'Menyinkronkan...' : 'Sinkronkan Nilai'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Execution History & Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-school-navy" />
            <h3 className="font-bold text-slate-800 text-sm">Riwayat & Log Hasil Sinkronisasi</h3>
          </div>
          <span className="text-[11px] text-slate-400">Menampilkan hasil eksekusi aktual</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4 text-center">Total Data</th>
                <th className="py-3 px-4 text-center">Berhasil</th>
                <th className="py-3 px-4 text-center">Gagal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Pesan Sistem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lastResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada eksekusi sinkronisasi pada sesi ini. Klik salah satu tombol di atas untuk memulai.
                  </td>
                </tr>
              ) : (
                lastResults.map((item, idx) => {
                  const badge = {
                    BERHASIL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    SEBAGIAN: 'bg-amber-50 text-amber-700 border-amber-200',
                    GAGAL: 'bg-rose-50 text-rose-700 border-rose-200',
                  }[item.status];

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{formatDateTimeIndo(item.timestamp)}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.type}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{item.total}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{item.successCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{item.failedCount}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${badge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{item.message}</div>
                        {item.errors.length > 0 && (
                          <div className="text-[10px] text-rose-600 mt-0.5">
                            {item.errors[0]}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
