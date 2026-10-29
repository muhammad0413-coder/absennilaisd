/**
 * ==============================================================================
 * SISTEM INFORMASI ABSENSI DAN PENILAIAN SISWA SD
 * REUSABLE MODAL COMPONENT (src/components/Modal.js)
 * ==============================================================================
 */

export function showConfirmModal({
  title = "Konfirmasi Tindakan",
  message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmText = "Ya, Lanjutkan",
  confirmClass = "btn-danger",
  onConfirm = () => {},
  onCancel = () => {}
}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 440px;">
      <div class="modal-header">
        <h3 class="card-title" style="margin-bottom: 0;">${title}</h3>
        <button class="btn btn-outline btn-sm" id="modal-close-x" style="padding: 2px 8px;">✕</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--slate-700); font-size: 0.95rem; line-height: 1.5;">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="modal-cancel-btn">Batal</button>
        <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    if (overlay.parentNode) {
      document.body.removeChild(overlay);
    }
  };

  overlay.querySelector('#modal-close-x').onclick = () => { close(); onCancel(); };
  overlay.querySelector('#modal-cancel-btn').onclick = () => { close(); onCancel(); };
  overlay.querySelector('#modal-confirm-btn').onclick = () => {
    close();
    onConfirm();
  };
}
