/* =============================================================
   ExMnotes — Toast Notifications
   ============================================================= */

const container = document.getElementById('toast-container');

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'} [type]
 * @param {number} [duration] ms
 */
export function showToast(message, type = 'info', duration = 2800) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-dot"></span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-dismiss
  const timer = setTimeout(() => dismiss(toast), duration);

  toast.addEventListener('click', () => {
    clearTimeout(timer);
    dismiss(toast);
  });
}

function dismiss(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('out');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}
