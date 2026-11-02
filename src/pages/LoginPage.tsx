import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  School,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { useNotification } from '../contexts/NotificationContext';
import { Modal } from '../components/common/Modal';

interface LoginPageProps {
  onOpenStudentPortal: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenStudentPortal }) => {
  const { login, resetPassword } = useAuth();
  const { schoolProfile } = useSchool();
  const { showToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('error', 'Validasi Gagal', 'Email dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('success', 'Login Berhasil', `Selamat datang di ${schoolProfile?.name || 'SDN KESILIR 02'}!`);
    } catch (err: any) {
      showToast('error', 'Login Gagal', err.message || 'Kredensial tidak valid');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setSendingReset(true);
    try {
      await resetPassword(forgotEmail.trim());
      showToast('success', 'Email Terkirim', `Instruksi reset sandi dikirim ke ${forgotEmail}`);
      setIsForgotModalOpen(false);
    } catch (err: any) {
      showToast('error', 'Gagal Reset', err.message);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-school-navy via-slate-900 to-school-blue flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Bar Branding */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="/logo_sd.png"
            alt="Logo SD"
            className="w-12 h-12 object-contain drop-shadow"
          />
          <div>
            <h1 className="font-extrabold text-base md:text-lg text-white tracking-wide leading-tight">
              {schoolProfile?.name || 'SEKOLAH DASAR NEGERI KESILIR 02'}
            </h1>
            <p className="text-xs text-slate-300">
              Kecamatan Wuluhan, Kabupaten Jember
            </p>
          </div>
        </div>

        {/* Portal Siswa Shortcut */}
        <button
          onClick={onOpenStudentPortal}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5 shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5 text-school-sky" />
          <span>PORTAL SISWA / ORANG TUA</span>
        </button>
      </div>

      {/* Main Login Box */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 space-y-6">
          <div className="text-center space-y-3">
            <img
              src="/logo_sd.png"
              alt="Logo SD"
              className="w-20 h-20 mx-auto object-contain drop-shadow"
            />
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Masuk Akun Pengguna
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sistem Informasi Absensi & Nilai Siswa SDN Kesilir 02
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email / Akun Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@sdnkesilir02.sch.id / guru / kepsek"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-school-lightBlue focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-school-lightBlue hover:underline text-[11px]"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-school-lightBlue focus:outline-hidden"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-school-navy text-white font-bold text-xs rounded-xl hover:bg-school-blue transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi Akun...' : 'Masuk ke Aplikasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Info Akun Google Sheets */}
          <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Akun pengguna dan kata sandi dikelola secara langsung oleh Administrator melalui lembar kerja <strong>Pengguna</strong> pada Google Sheets dan Firebase.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-400 text-xs py-2">
        <p>&copy; {new Date().getFullYear()} SDN KESILIR 02 KECAMATAN WULUHAN KABUPATEN JEMBER. Hak Cipta Dilindungi.</p>
      </footer>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Kata Sandi Pengguna"
        maxWidth="sm"
      >
        <form onSubmit={handleSendReset} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi melalui Firebase Authentication.
          </p>
          <div>
            <label className="block font-semibold mb-1">Email Terdaftar</label>
            <input
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              placeholder="nama@sdnkesilir02.sch.id"
              className="w-full px-3 py-2 rounded-xl border text-xs"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="px-4 py-2 border rounded-xl hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={sendingReset}
              className="px-4 py-2 bg-school-navy text-white rounded-xl font-semibold hover:bg-school-blue disabled:opacity-50"
            >
              {sendingReset ? 'Mengirim...' : 'Kirim Tautan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
