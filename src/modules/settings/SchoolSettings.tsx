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
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import { SchoolProfile, SubjectConfig } from '../../types';

export const SchoolSettings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { schoolProfile, subjects, updateProfile, updateSubjects } = useSchool();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'identity' | 'academic' | 'subjects' | 'assessment'>('identity');

  // School Identity form state
  const [profileForm, setProfileForm] = useState<SchoolProfile>(() => ({
    id: schoolProfile?.id || 'school_main',
    name: schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH',
    npsn: schoolProfile?.npsn || '20210899',
    address: schoolProfile?.address || 'Jl. Pendidikan No. 45',
    village: schoolProfile?.village || 'Sukamaju',
    subdistrict: schoolProfile?.subdistrict || 'Sukamaju',
    regency: schoolProfile?.regency || 'Kabupaten Bandung',
    province: schoolProfile?.province || 'Jawa Barat',
    logoUrl: schoolProfile?.logoUrl || '/logo.svg',
    principalName: schoolProfile?.principalName || 'Drs. H. Mulyadi, M.Pd.',
    principalNip: schoolProfile?.principalNip || '19680512 199303 1 004',
    academicYear: schoolProfile?.academicYear || '2026/2027',
    activeSemester: schoolProfile?.activeSemester || '1',
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
      showToast('success', 'Profil Sekolah Disimpan', 'Identitas sekolah dan kepala sekolah diperbarui.');
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
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Konfigurasi Aplikasi</h2>
        <p className="text-xs text-slate-500">
          Kelola profil sekolah, tahun ajaran aktif, mata pelajaran, dan bobot penilaian asesmen
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'identity' ? 'bg-school-navy text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <Building className="w-4 h-4" />
          <span>Identitas Sekolah & Kepala Sekolah</span>
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

        <button
          onClick={() => setActiveTab('assessment')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${activeTab === 'assessment' ? 'bg-school-navy text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Bobot & Skala Penilaian</span>
        </button>
      </div>

      {/* Tab 1: Identitas Sekolah */}
      {activeTab === 'identity' && (
        <form onSubmit={handleSaveIdentity} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Sekolah</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-school-lightBlue"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NPSN</label>
              <input
                type="text"
                value={profileForm.npsn}
                onChange={e => setProfileForm({ ...profileForm, npsn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">URL Logo Sekolah</label>
              <input
                type="text"
                value={profileForm.logoUrl || ''}
                onChange={e => setProfileForm({ ...profileForm, logoUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Jalan</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan</label>
              <input
                type="text"
                value={profileForm.village}
                onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
              <input
                type="text"
                value={profileForm.subdistrict}
                onChange={e => setProfileForm({ ...profileForm, subdistrict: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={profileForm.regency}
                onChange={e => setProfileForm({ ...profileForm, regency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
              <input
                type="text"
                value={profileForm.province}
                onChange={e => setProfileForm({ ...profileForm, province: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div className="pt-2 border-t md:col-span-2">
              <h4 className="font-bold text-slate-800 text-sm mb-3">Identitas Kepala Sekolah</h4>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
              <input
                type="text"
                value={profileForm.principalName}
                onChange={e => setProfileForm({ ...profileForm, principalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={profileForm.principalNip}
                onChange={e => setProfileForm({ ...profileForm, principalNip: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="px-5 py-2.5 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil Sekolah</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Akademik */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-xl text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tahun Pelajaran Aktif</label>
            <input
              type="text"
              value={profileForm.academicYear}
              onChange={e => setProfileForm({ ...profileForm, academicYear: e.target.value })}
              placeholder="Contoh: 2026/2027"
              className="w-full px-3 py-2 rounded-xl border font-bold text-school-navy"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Format standar: TTTT/TTTT</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester Aktif</label>
            <select
              value={profileForm.activeSemester}
              onChange={e => setProfileForm({ ...profileForm, activeSemester: e.target.value as '1' | '2' })}
              className="w-full px-3 py-2 rounded-xl border font-semibold bg-white"
            >
              <option value="1">Semester 1 (Ganjil - Juli s.d Desember)</option>
              <option value="2">Semester 2 (Genap - Januari s.d Juni)</option>
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

      {/* Tab 3: Mata Pelajaran */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {/* Add Subject Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-end text-xs">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
              <input
                type="text"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                placeholder="Contoh: Bahasa Sunda / Informatika"
                className="w-full px-3 py-2 rounded-xl border"
              />
            </div>
            <div className="w-28">
              <label className="block font-semibold text-slate-700 mb-1">Kode Mapel</label>
              <input
                type="text"
                value={newSubCode}
                onChange={e => setNewSubCode(e.target.value)}
                placeholder="BSUN"
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

          {/* Subjects Table */}
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

      {/* Tab 4: Bobot Penilaian */}
      {activeTab === 'assessment' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 max-w-2xl text-xs text-slate-700">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Ketentuan Bobot Penilaian Asesmen</h4>
            <p className="text-slate-500 mt-0.5">Konfigurasi persentase komponen untuk kalkulasi Nilai Akhir (NA)</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800">1. Asesmen Formatif</span>
                <span className="text-[11px] text-slate-500">Penilaian proses selama pembelajaran</span>
              </div>
              <span className="font-bold text-school-navy text-sm px-3 py-1 bg-white rounded-lg border">20%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800">2. Sumatif Lingkup Materi (SLM)</span>
                <span className="text-[11px] text-slate-500">Penilaian ulangan harian / akhir bab</span>
              </div>
              <span className="font-bold text-school-navy text-sm px-3 py-1 bg-white rounded-lg border">30%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800">3. Sumatif Tengah Semester (STS)</span>
                <span className="text-[11px] text-slate-500">Asesmen evaluasi tengah semester</span>
              </div>
              <span className="font-bold text-school-navy text-sm px-3 py-1 bg-white rounded-lg border">25%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border flex items-center justify-between">
              <div>
                <span className="font-bold block text-slate-800">4. Sumatif Akhir Semester (SAS)</span>
                <span className="text-[11px] text-slate-500">Asesmen evaluasi akhir semester</span>
              </div>
              <span className="font-bold text-school-navy text-sm px-3 py-1 bg-white rounded-lg border">25%</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
            <p className="font-bold">Total Bobot: 100%</p>
            <p className="text-[11px] mt-0.5 text-emerald-800">
              Rumus aktif: <code>NA = (Formatif × 0.20) + (SLM × 0.30) + (STS × 0.25) + (SAS × 0.25)</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
