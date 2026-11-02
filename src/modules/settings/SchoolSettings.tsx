import React, { useState } from 'react';
import {
  Settings,
  Building,
  Calendar,
  BookOpen,
  Sliders,
  Save,
  Plus,
  Trash2,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import { SchoolProfile, SubjectConfig } from '../../types';

export const SchoolSettings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { schoolProfile, subjects, updateProfile, updateSubjects } = useSchool();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'identity' | 'academic' | 'subjects' | 'sheets'>('identity');

  // School Identity form state
  const [profileForm, setProfileForm] = useState<SchoolProfile>(() => ({
    id: schoolProfile?.id || 'school_main',
    name: schoolProfile?.name || 'SEKOLAH DASAR NEGERI KESILIR 02',
    npsn: schoolProfile?.npsn || '20523825',
    address: schoolProfile?.address || 'JL. Ambulu No. 91 Kesilir Wuluhan Kode Pos 68162',
    village: schoolProfile?.village || 'Kesilir',
    subdistrict: schoolProfile?.subdistrict || 'Kecamatan Wuluhan',
    regency: schoolProfile?.regency || 'Kabupaten Jember',
    province: schoolProfile?.province || 'Jawa Timur',
    logoUrl: '/logo_sd.png',
    logoKiriUrl: '/logo_jember.png',
    logoKananUrl: '/logo_sd.png',
    kopLine1: schoolProfile?.kopLine1 || 'PEMERINTAH KABUPATEN JEMBER',
    kopLine2: schoolProfile?.kopLine2 || 'DINAS PENDIDIKAN',
    kopLine3: schoolProfile?.kopLine3 || 'SEKOLAH DASAR NEGERI KESILIR 02',
    kopLine4: schoolProfile?.kopLine4 || 'KECAMATAN WULUHAN',
    kopLine5: schoolProfile?.kopLine5 || 'JL. Ambulu No. 91 Kesilir Wuluhan Kode Pos 68162',
    principalName: schoolProfile?.principalName || 'Abdullah Mahsar, S.Pd',
    principalNip: schoolProfile?.principalNip || '198306012014121000',
    academicYear: schoolProfile?.academicYear || '2026/2027',
    activeSemester: schoolProfile?.activeSemester || '1',
    spreadsheetUrl: schoolProfile?.spreadsheetUrl || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit',
  }));

  // Subjects state
  const [subjectList, setSubjectList] = useState<SubjectConfig[]>(subjects);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubKkm, setNewSubKkm] = useState(75);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      showToast('success', 'Profil Disimpan', 'Identitas resmi SDN Kesilir 02 berhasil disimpan.');
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan', err.message);
    }
  };

  const handleAddSubject = () => {
    if (!newSubName.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama mata pelajaran tidak boleh kosong');
      return;
    }
    const newSub: SubjectConfig = {
      id: 'sub_' + Date.now().toString(36),
      name: newSubName.trim(),
      code: newSubCode.trim().toUpperCase() || newSubName.substring(0, 4).toUpperCase(),
      kkm: Number(newSubKkm) || 75,
      classes: ['1', '2', '3', '4', '5', '6'],
      active: true,
    };
    const updated = [...subjectList, newSub];
    setSubjectList(updated);
    updateSubjects(updated);
    setNewSubName('');
    setNewSubCode('');
    showToast('success', 'Mata Pelajaran Ditambahkan', `Mapel ${newSub.name} berhasil ditambahkan.`);
  };

  const handleToggleSubject = (id: string) => {
    const updated = subjectList.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setSubjectList(updated);
    updateSubjects(updated);
  };

  const handleDeleteSubject = (id: string) => {
    const updated = subjectList.filter(s => s.id !== id);
    setSubjectList(updated);
    updateSubjects(updated);
    showToast('info', 'Mata Pelajaran Dihapus', 'Mata pelajaran berhasil dihapus dari daftar.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Sekolah & Database</h2>
        <p className="text-xs text-slate-500">
          Kelola profil resmi SDN Kesilir 02, Kop Surat, tautan Google Spreadsheet, dan mata pelajaran
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'identity' ? 'bg-school-navy text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <Building className="w-4 h-4" />
          <span>Kop Surat & Kepala Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'sheets' ? 'bg-school-navy text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Tautan Google Spreadsheet</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'academic' ? 'bg-school-navy text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tahun Pelajaran & Semester</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'subjects' ? 'bg-school-navy text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Mata Pelajaran</span>
        </button>
      </div>

      {/* Tab 1: Identitas & Kop Surat */}
      {activeTab === 'identity' && (
        <form onSubmit={handleSaveIdentity} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <strong>Format Kop Surat Resmi:</strong> Baris di bawah ini akan tercetak otomatis pada bagian atas setiap dokumen cetak F4 Portrait dan Landscape dengan Logo Jember di sebelah kiri dan Logo SD di sebelah kanan.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Kop Baris 1 (Pemerintah Kabupaten)</label>
              <input
                type="text"
                value={profileForm.kopLine1}
                onChange={e => setProfileForm({ ...profileForm, kopLine1: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border font-bold uppercase"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Kop Baris 2 (Dinas)</label>
              <input
                type="text"
                value={profileForm.kopLine2}
                onChange={e => setProfileForm({ ...profileForm, kopLine2: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border font-bold uppercase"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Kop Baris 3 (Nama Sekolah Lengkap)</label>
              <input
                type="text"
                value={profileForm.kopLine3}
                onChange={e => setProfileForm({ ...profileForm, kopLine3: e.target.value, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border font-extrabold uppercase text-school-navy"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Kop Baris 4 (Kecamatan)</label>
              <input
                type="text"
                value={profileForm.kopLine4}
                onChange={e => setProfileForm({ ...profileForm, kopLine4: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border font-bold uppercase"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Kop Baris 5 (Alamat Jalan & Kode Pos)</label>
              <input
                type="text"
                value={profileForm.kopLine5}
                onChange={e => setProfileForm({ ...profileForm, kopLine5: e.target.value, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border"
                required
              />
            </div>

            <div className="pt-3 border-t md:col-span-2">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Kepala Sekolah (Pejabat Penandatangan)</h4>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                value={profileForm.principalName}
                onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={profileForm.principalNip}
                onChange={e => setProfileForm({ ...profileForm, principalNip: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="px-5 py-2.5 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas Sekolah</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Tautan Google Spreadsheet Master */}
      {activeTab === 'sheets' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-2xl text-xs">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">Tautan Google Spreadsheet Master</h4>
            <p className="text-slate-500">
              Sertakan tautan Google Spreadsheet Anda agar Administrator dapat membuka dan mengedit data langsung di spreadsheet.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">URL Google Spreadsheet</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={profileForm.spreadsheetUrl || ''}
                onChange={e => setProfileForm({ ...profileForm, spreadsheetUrl: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/ID_SPREADSHEET/edit"
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
              />
              {profileForm.spreadsheetUrl && (
                <a
                  href={profileForm.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1.5 transition"
                >
                  <span>Buka Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveIdentity}
              type="button"
              className="px-5 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Tautan Spreadsheet</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Akademik */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran Aktif</label>
            <input
              type="text"
              value={profileForm.academicYear}
              onChange={e => setProfileForm({ ...profileForm, academicYear: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border font-bold text-school-navy"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester Aktif</label>
            <select
              value={profileForm.activeSemester}
              onChange={e => setProfileForm({ ...profileForm, activeSemester: e.target.value as '1' | '2' })}
              className="w-full px-3 py-2 rounded-xl border font-semibold bg-white"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>

          <div className="pt-3">
            <button
              onClick={handleSaveIdentity}
              type="button"
              className="px-5 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Akademik</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Mata Pelajaran */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-end text-xs">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
              <input
                type="text"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                placeholder="Contoh: Matematika"
                className="w-full px-3 py-2 rounded-xl border"
              />
            </div>
            <div className="w-28">
              <label className="block font-semibold text-slate-700 mb-1">Kode Mapel</label>
              <input
                type="text"
                value={newSubCode}
                onChange={e => setNewSubCode(e.target.value)}
                placeholder="MAT"
                className="w-full px-3 py-2 rounded-xl border uppercase"
              />
            </div>
            <div className="w-24">
              <label className="block font-semibold text-slate-700 mb-1">KKM / KKMTP</label>
              <input
                type="number"
                value={newSubKkm}
                onChange={e => setNewSubKkm(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border text-center font-bold"
              />
            </div>
            <button
              onClick={handleAddSubject}
              className="px-4 py-2 bg-school-navy text-white font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1 shadow-sm h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4 w-28">Kode</th>
                  <th className="py-3 px-4">Nama Mata Pelajaran</th>
                  <th className="py-3 px-4 text-center w-24">KKM</th>
                  <th className="py-3 px-4 text-center w-28">Status</th>
                  <th className="py-3 px-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectList.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-school-navy">{sub.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{sub.name}</td>
                    <td className="py-3 px-4 text-center font-bold">{sub.kkm}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleSubject(sub.id)}
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] border ${sub.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
                      >
                        {sub.active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteSubject(sub.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        title="Hapus Mata Pelajaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
