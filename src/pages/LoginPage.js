/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD KELAS 1 DAN KELAS 6
 * LOGIN PAGE (src/pages/LoginPage.js)
 * ==============================================================================
 */

import { login, resetPassword } from '../auth.js';
import { toast } from '../components/Toast.js';

export function renderLoginPage() {
  return `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); display: flex; align-items: center; justify-content: center; padding: 1.5rem;">
      <div style="background: white; border-radius: var(--radius-xl); max-width: 440px; width: 100%; padding: 2rem; box-shadow: var(--shadow-xl);">
        <!-- Header Login -->
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #1e3a8a, #0284c7); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin: 0 auto 0.75rem;">
            🔒
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #0f172a; margin-bottom: 0.2rem;">Portal Staf & Guru</h2>
          <p style="font-size: 0.85rem; color: #64748b; margin: 0;">SD Negeri Harapan Bangsa (Kelas 1 & Kelas 6)</p>
        </div>

        <div id="login-error-alert" style="display: none; padding: 0.75rem; border-radius: 8px; background: #fee2e2; color: #991b1b; font-size: 0.85rem; margin-bottom: 1rem; border: 1px solid #fecaca;"></div>

        <!-- Form Login -->
        <form id="form-login" onsubmit="return false;">
          <div class="form-group">
            <label class="form-label" for="login-email">Email Terdaftar</label>
            <input type="email" id="login-email" class="form-input" placeholder="nama@sekolah.id" required autocomplete="email">
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <label class="form-label" for="login-password" style="margin-bottom: 0;">Kata Sandi</label>
              <button type="button" id="btn-forgot-password" style="background: none; border: none; color: #2563eb; font-size: 0.78rem; cursor: pointer; text-decoration: underline;">
                Lupa Sandi?
              </button>
            </div>
            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
          </div>

          <button type="submit" id="btn-submit-login" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
            Masuk ke Sistem →
          </button>
        </form>

        <!-- Akun Cepat Pengujian / Demo -->
        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem; text-align: center;">
            🧪 Akses Pengujian Cepat
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            <button class="btn btn-outline btn-sm quick-login-btn" data-email="admin@sekolah.id" data-pass="admin123" style="justify-content: flex-start;">
              👑 <span>Login Admin (Akses Penuh K1 & K6)</span>
            </button>
            <button class="btn btn-outline btn-sm quick-login-btn" data-email="guru1@sekolah.id" data-pass="guru123" style="justify-content: flex-start;">
              👩‍🏫 <span>Login Guru Kelas 1 (Hanya Kelas 1)</span>
            </button>
            <button class="btn btn-outline btn-sm quick-login-btn" data-email="guru6@sekolah.id" data-pass="guru123" style="justify-content: flex-start;">
              👨‍🏫 <span>Login Guru Kelas 6 (Hanya Kelas 6)</span>
            </button>
          </div>
        </div>

        <div style="margin-top: 1.25rem; text-align: center;">
          <a href="#student" style="font-size: 0.85rem; color: #64748b; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem;">
            ← Kembali ke Halaman Siswa
          </a>
        </div>
      </div>

      <!-- Modal Lupa Kata Sandi -->
      <div id="forgot-password-modal-slot"></div>
    </div>
  `;
}

export function attachLoginEvents() {
  const form = document.getElementById('form-login');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('btn-submit-login');
  const errorAlert = document.getElementById('login-error-alert');

  // Submit Handler
  form.onsubmit = async (e) => {
    e.preventDefault();
    errorAlert.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Memverifikasi...';

    try {
      const user = await login(email, password);
      toast.success(`Selamat datang, ${user.displayName}!`);

      if (user.role === 'admin') {
        window.location.hash = '#admin-dashboard';
      } else {
        window.location.hash = '#teacher-dashboard';
      }
    } catch (err) {
      errorAlert.textContent = err.message || 'Gagal masuk. Periksa email dan kata sandi Anda.';
      errorAlert.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk ke Sistem →';
    }
  };

  // Quick Login Buttons
  const quickBtns = document.querySelectorAll('.quick-login-btn');
  quickBtns.forEach(btn => {
    btn.onclick = () => {
      emailInput.value = btn.getAttribute('data-email');
      passwordInput.value = btn.getAttribute('data-pass');
      form.requestSubmit();
    };
  });

  // Forgot Password Dialog
  const btnForgot = document.getElementById('btn-forgot-password');
  const modalSlot = document.getElementById('forgot-password-modal-slot');

  if (btnForgot && modalSlot) {
    btnForgot.onclick = () => {
      modalSlot.innerHTML = `
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 420px;">
            <div class="modal-header">
              <h3 class="card-title" style="margin: 0;">Lupa Kata Sandi</h3>
              <button class="btn btn-outline btn-sm" id="btn-close-forgot">✕</button>
            </div>
            <div class="modal-body">
              <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
                Masukkan email akun guru atau admin Anda. Tautan pemulihan kata sandi resmi akan dikirim oleh Firebase Authentication.
              </p>
              <div class="form-group">
                <label class="form-label">Email Terdaftar</label>
                <input type="email" id="forgot-email-input" class="form-input" placeholder="guru1@sekolah.id" value="${emailInput.value}">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" id="btn-cancel-forgot">Batal</button>
              <button class="btn btn-primary" id="btn-send-reset">Kirim Email Pemulihan</button>
            </div>
          </div>
        </div>
      `;

      const closeForgot = () => { modalSlot.innerHTML = ''; };
      document.getElementById('btn-close-forgot').onclick = closeForgot;
      document.getElementById('btn-cancel-forgot').onclick = closeForgot;

      document.getElementById('btn-send-reset').onclick = async () => {
        const inputVal = document.getElementById('forgot-email-input').value.trim();
        if (!inputVal) {
          toast.warning("Masukkan email Anda terlebih dahulu.");
          return;
        }

        try {
          const res = await resetPassword(inputVal);
          toast.success(res.message);
          closeForgot();
        } catch (e) {
          toast.error(e.message || "Gagal mengirim email reset.");
        }
      };
    };
  }
}
