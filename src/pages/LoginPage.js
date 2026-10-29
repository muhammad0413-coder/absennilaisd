/**
 * ==============================================================================
 * SISTEM ABSENSI DAN NILAI SISWA SD KELAS 1–6
 * PORTAL LOGIN PENGGUNA (src/pages/LoginPage.js)
 * ==============================================================================
 */

import { login, loginWithEmailOnly, resetPassword } from '../auth.js';
import { toast } from '../components/Toast.js';

export function renderLoginPage() {
  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); display: flex; align-items: center; justify-content: center; padding: 1.5rem;">
      <div style="background: white; border-radius: var(--radius-xl); max-width: 440px; width: 100%; padding: 2.25rem; box-shadow: var(--shadow-xl);">
        <!-- Header Portal -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <img src="/logo-kanan.png" alt="Logo Sekolah" style="width: 58px; height: 58px; object-fit: contain; border-radius: 12px; margin-bottom: 0.5rem;" onerror="this.src='https://drive.google.com/thumbnail?id=1XWfjQdygAvCCyRfKpTLD40MImqnl08X8&sz=w200'">
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem;">Portal Guru &amp; Staf</h2>
          <p style="font-size: 0.85rem; color: #64748b; margin: 0;">SDN KESILIR 02 (Kelas 1–6)</p>
        </div>

        <div id="login-error-alert" style="display: none; padding: 0.75rem; border-radius: 8px; background: #fee2e2; color: #991b1b; font-size: 0.85rem; margin-bottom: 1rem; border: 1px solid #fecaca;"></div>

        <!-- Form Login Email Langsung -->
        <form id="form-login" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Akun Guru / Staf *</label>
            <input type="email" id="login-email" class="form-input" placeholder="contoh: guru5@sekolah.id atau admin@sekolah.id" required autocomplete="email">
          </div>

          <button type="submit" id="btn-submit-login" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem; font-weight: 700;">
            Masuk Langsung ke Dashboard ➔
          </button>
        </form>

        <div style="margin-top: 1.5rem; text-align: center;">
          <a href="#student" class="btn btn-outline btn-sm" style="width: 100%; justify-content: center; font-weight: 600;">
            🌐 Kembali ke Portal Siswa
          </a>
        </div>
      </div>
    </div>
  `;
}

export function attachLoginEvents() {
  const form = document.getElementById('form-login');
  const emailInput = document.getElementById('login-email');
  const submitBtn = document.getElementById('btn-submit-login');
  const errorAlert = document.getElementById('login-error-alert');

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';

    const email = emailInput.value.trim();
    if (!email) {
      errorAlert.textContent = "Silakan masukkan alamat email Anda.";
      errorAlert.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Memverifikasi...';

    try {
      const user = await loginWithEmailOnly(email);
      toast.success(`Selamat datang, ${user.displayName}!`);
      window.location.hash = '#dashboard';
    } catch (err) {
      errorAlert.textContent = err.message || 'Gagal masuk. Periksa alamat email Anda.';
      errorAlert.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk Langsung ke Dashboard ➔';
    }
  };
}
