import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Users,
  CalendarCheck,
  GraduationCap,
  FileSpreadsheet,
  Building,
  Award,
  Download,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { formatDateIndo } from '../../utils/formatters';

interface PrintCenterProps {
  onNavigate: (tab: any) => void;
}

export const PrintCenter: React.FC<PrintCenterProps> = ({ onNavigate }) => {
  const { user, isAdmin, isTeacher, isPrincipal } = useAuth();
  const { schoolProfile } = useSchool();

  const printDocs = [
    {
      id: 'doc_students',
      title: '1. Daftar Siswa Rombel',
      desc: 'Daftar nama, NIS, NISN, status, dan rincian siswa kelas 1–6 lengkap dengan format cetak A4.',
      icon: Users,
      action: () => onNavigate('students'),
      color: 'blue',
    },
    {
      id: 'doc_attendance_daily',
      title: '2. Daftar Hadir Harian Siswa',
      desc: 'Form absensi harian kelas bertanggal lengkap dengan kolom status Hadir, Sakit, Izin, Alpa.',
      icon: CalendarCheck,
      action: () => onNavigate('attendance'),
      color: 'emerald',
    },
    {
      id: 'doc_attendance_recap',
      title: '3. Rekap Absensi Bulanan & Semester',
      desc: 'Rekapitulasi jumlah kehadiran, persentase kehadiran resmi, dan hari efektif sekolah.',
      icon: FileSpreadsheet,
      action: () => onNavigate('attendance-recap'),
      color: 'indigo',
    },
    {
      id: 'doc_grades_subject',
      title: '4. Nilai per Mata Pelajaran',
      desc: 'Daftar nilai asesmen formatif, sumatif lingkup materi, STS, dan SAS per mapel.',
      icon: GraduationCap,
      action: () => onNavigate('grades'),
      color: 'amber',
    },
    {
      id: 'doc_grades_recap',
      title: '5. Rekapitulasi Nilai Akhir (Leger)',
      desc: 'Tabel rekapitulasi nilai akhir (NA), predikat capaian, dan persentase kelengkapan.',
      icon: Award,
      action: () => onNavigate('grades-recap'),
      color: 'purple',
    },
    {
      id: 'doc_report_cards',
      title: '6. Rapor Hasil Belajar Siswa',
      desc: 'Cetak rapor resmi siswa individual atau seluruh rombongan belajar dalam satu kelas.',
      icon: FileText,
      action: () => onNavigate('report-cards'),
      color: 'rose',
    },
    {
      id: 'doc_principal_report',
      title: '7. Laporan Eksekutif Kepala Sekolah',
      desc: 'Ringkasan kehadiran seluruh rombel 1-6 dan monitoring ketuntasan input nilai guru.',
      icon: Building,
      action: () => window.print(),
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Printable Executive School Report */}
      <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-6">
        <h2 className="text-xl font-bold uppercase">{schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}</h2>
        <p className="text-xs">{schoolProfile?.address}</p>
        <p className="text-sm font-bold mt-2 uppercase">LAPORAN MONITORING & EVALUASI SEKOLAH</p>
        <p className="text-xs">Tahun Pelajaran: {schoolProfile?.academicYear} | Semester: {schoolProfile?.activeSemester} | Tanggal Cetak: {formatDateIndo(new Date())}</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pusat Cetak & Arsip Laporan</h2>
          <p className="text-xs text-slate-500">
            Akses langsung cetak format A4 portrait dan landscape sesuai standar administrasi sekolah
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Terpilih</span>
        </button>
      </div>

      {/* Grid of Printable Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {printDocs.map(doc => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-school-navy/5 text-school-navy flex items-center justify-center">
                  <Icon className="w-5 h-5 text-school-blue" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{doc.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{doc.desc}</p>
              </div>

              <button
                onClick={doc.action}
                className="w-full py-2 bg-slate-50 hover:bg-school-navy hover:text-white border border-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Buka & Cetak</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Executive Summary Sheet for Print Mode */}
      <div className="hidden print:block space-y-4 text-xs">
        <p className="font-bold">Ringkasan Administrasi Akademik Sekolah:</p>
        <p>1. Status rombongan belajar kelas 1 sampai 6 aktif berjalan normal.</p>
        <p>2. Seluruh absensi harian tersinkronisasi antara Firebase dan Google Sheets.</p>
        <p>3. Input nilai formatif dan sumatif lingkup materi tersimpan sesuai standar Kurikulum Merdeka.</p>

        <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
          <div>
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala Sekolah</p>
            <div className="h-16" />
            <p className="font-bold underline">{schoolProfile?.principalName || 'Drs. H. Mulyadi, M.Pd.'}</p>
            <p>NIP. {schoolProfile?.principalNip || '-'}</p>
          </div>
          <div>
            <p>Kota Bandung, {formatDateIndo(new Date())}</p>
            <p className="font-semibold">Administrator Sistem</p>
            <div className="h-16" />
            <p className="font-bold underline">{user?.name || 'Administrator'}</p>
            <p>NIP. {user?.nip || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
