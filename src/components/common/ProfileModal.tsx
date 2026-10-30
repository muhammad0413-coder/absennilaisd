import React, { useState } from 'react';
import { Camera, Lock, User, Save, Upload, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Modal } from './Modal';
import { callAppsScript } from '../../services/apps-script/appsScriptApi';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfileState, resetPassword } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [nip, setNip] = useState(user?.nip || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama tidak boleh kosong');
      return;
    }

    try {
      updateProfileState({ name: name.trim(), nip: nip.trim() });
      showToast('success', 'Profil Disimpan', 'Informasi profil berhasil diperbarui.');
      onClose();
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan', err.message);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('error', 'Format Tidak Didukung', 'Hanya gambar JPG, PNG, atau WEBP yang diizinkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Ukuran Terlalu Besar', 'Maksimal ukuran foto adalah 5MB');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        // Send to Apps Script to store in Google Drive
        const res = await callAppsScript('uploadProfilePhoto', {
          fileBase64: base64Data,
          fileName: file.name,
          mimeType: file.type,
        });

        if (res.success && res.data?.photoUrl) {
          updateProfileState({ photoURL: res.data.photoUrl });
          showToast('success', 'Foto Terunggah', 'Foto profil berhasil disimpan ke Google Drive.');
        } else {
          // Preview locally if Apps script not yet configured
          const localUrl = URL.createObjectURL(file);
          updateProfileState({ photoURL: localUrl });
          showToast('info', 'Foto Disimpan Lokal', 'Foto diterapkan (Hubungkan Apps Script untuk menyimpan permanen di Google Drive).');
        }
      } catch (err: any) {
        showToast('error', 'Gagal Unggah Foto', err.message);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await resetPassword(user.email);
      showToast('success', 'Tautan Terkirim', `Tautan reset kata sandi telah dikirim ke email: ${user.email}`);
    } catch (err: any) {
      showToast('error', 'Gagal Mengirim', err.message);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil Pengguna Saya" maxWidth="md">
      <form onSubmit={handleSaveProfile} className="space-y-5">
        {/* Profile Photo Upload Section */}
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative group">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-school-navy text-white text-2xl font-bold flex items-center justify-center border-4 border-slate-100 shadow-md">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-school-lightBlue text-white flex items-center justify-center cursor-pointer shadow hover:bg-school-blue transition">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {uploadingPhoto ? 'Mengunggah ke Drive...' : 'Klik ikon kamera untuk ganti foto (Maks 5MB)'}
          </p>
        </div>

        {/* Input Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-school-lightBlue focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">NIP (Nomor Induk Pegawai)</label>
            <input
              type="text"
              value={nip}
              onChange={e => setNip(e.target.value)}
              placeholder="Contoh: 19850314 200902 2 003"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-school-lightBlue focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email (Akun Login)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Peran Akses</label>
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 capitalize">
                {user?.role}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kelas Ditugaskan</label>
              <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                {user?.assignedClasses && user.assignedClasses.length > 0
                  ? `Kelas ${user.assignedClasses.join(', ')}`
                  : 'Semua Kelas'}
              </div>
            </div>
          </div>
        </div>

        {/* Password Reset Section */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-xs font-bold text-slate-800">Ubah Kata Sandi</p>
              <p className="text-[11px] text-slate-500">Kirim email tautan ganti kata sandi Firebase</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSendResetPassword}
            disabled={sendingReset}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg transition disabled:opacity-50"
          >
            {sendingReset ? 'Mengirim...' : 'Kirim Reset'}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 text-xs transition"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-school-navy text-white font-semibold rounded-xl hover:bg-school-blue text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
