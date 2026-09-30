/**
 * LogiFleet Frontend API Client & Helper Library
 * Connects frontend pages to the Node.js/Express REST backend
 */

(function (window) {
  // Determine backend API URL:
  // 1. Explicit global window.API_BASE_URL override if set
  // 2. Relative '/api' if served from the same origin/host
  // 3. Defaults to 'http://localhost:5000/api' for file:// or local static dev servers (e.g. port 5500)
  const isSameOriginBackend =
    window.location.protocol.startsWith('http') &&
    (window.location.port === '5000' ||
      (!['5500', '3000', '8080'].includes(window.location.port) &&
        !window.location.hostname.includes('127.0.0.1') &&
        window.location.hostname !== 'localhost'));

  const API_BASE_URL =
    window.API_BASE_URL ||
    (isSameOriginBackend ? '/api' : 'http://localhost:5000/api');

  // -------------------------------------------------------------
  // 1. Authentication & Session Management
  // -------------------------------------------------------------
  const LogiFleetAuth = {
    TOKEN_KEY: 'logifleet_jwt_token',
    USER_KEY: 'logifleet_user_data',

    getToken() {
      return localStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
      try {
        const raw = localStorage.getItem(this.USER_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    setAuth(token, user) {
      if (token) localStorage.setItem(this.TOKEN_KEY, token);
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem('logifleetLoggedIn', 'true');
        localStorage.setItem('logifleetUser', user.email);
      }
      this.updateNavbar();
    },

    clearAuth() {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem('logifleetLoggedIn');
      localStorage.removeItem('logifleetUser');
    },

    isAuthenticated() {
      return !!this.getToken();
    },

    hasRole(...roles) {
      const user = this.getUser();
      if (!user) return false;
      return roles.includes(user.role);
    },

    logout() {
      const token = this.getToken();
      if (token) {
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      this.clearAuth();
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 500);
    },

    updateNavbar() {
      const loginLink = document.querySelector('nav a.login');
      if (!loginLink) return;

      const user = this.getUser();
      if (user && this.isAuthenticated()) {
        const roleLabel = (user.role || 'user').toUpperCase();
        const roleBadgeColor =
          user.role === 'admin'
            ? '#ef4444'
            : user.role === 'manager'
            ? '#f59e0b'
            : '#20b9f1';

        const container = loginLink.parentElement;
        container.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="display:flex;align-items:center;gap:6px;background:#1e293b;padding:6px 12px;border-radius:20px;border:1px solid #334155;font-size:13px;color:#e2e8f0;">
              <span>👤 ${escapeHtml(user.name || user.email)}</span>
              <span style="background:${roleBadgeColor};color:white;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:10px;">${roleLabel}</span>
            </div>
            <button id="logoutBtn" style="background:#e11d48;color:white;border:0;padding:8px 14px;border-radius:7px;cursor:pointer;font-weight:bold;font-size:13px;transition:.2s;">
              Logout
            </button>
          </div>
        `;

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            LogiFleetAuth.logout();
          });
        }
      }
    },
  };

  // -------------------------------------------------------------
  // 2. HTTP Request Wrapper
  // -------------------------------------------------------------
  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    const token = LogiFleetAuth.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        // If unauthorized or token expired
        if (response.status === 401) {
          if (
            LogiFleetAuth.isAuthenticated() &&
            !window.location.pathname.endsWith('login.html')
          ) {
            showToast('Session expired. Please log in again.', 'warning');
            LogiFleetAuth.clearAuth();
            setTimeout(() => {
              window.location.href = 'login.html';
            }, 1200);
          }
        }
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showToast(
          'Cannot reach backend server. Please verify the Node.js server is running on port 5000.',
          'error',
          6000
        );
      }
      throw err;
    }
  }

  // Convenience methods
  const api = {
    get: (url, opts) => request(url, { method: 'GET', ...opts }),
    post: (url, body, opts) =>
      request(url, { method: 'POST', body: JSON.stringify(body), ...opts }),
    put: (url, body, opts) =>
      request(url, { method: 'PUT', body: JSON.stringify(body), ...opts }),
    patch: (url, body, opts) =>
      request(url, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
    delete: (url, opts) => request(url, { method: 'DELETE', ...opts }),
  };

  // -------------------------------------------------------------
  // 3. Toast Notifications
  // -------------------------------------------------------------
  function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('logifleet-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'logifleet-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 380px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colors = {
      success: { bg: '#064e3b', border: '#10b981', text: '#ecfdf5', icon: '✓' },
      error: { bg: '#7f1d1d', border: '#ef4444', text: '#fef2f2', icon: '✕' },
      warning: { bg: '#78350f', border: '#f59e0b', text: '#fffbeb', icon: '⚠' },
      info: { bg: '#1e293b', border: '#20b9f1', text: '#f8fafc', icon: 'ℹ' },
    };

    const scheme = colors[type] || colors.info;

    toast.style.cssText = `
      background: ${scheme.bg};
      border-left: 4px solid ${scheme.border};
      color: ${scheme.text};
      padding: 14px 18px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      font-size: 14px;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
      opacity: 0;
    `;

    toast.innerHTML = `
      <span style="font-weight:bold;font-size:16px;color:${scheme.border};">${scheme.icon}</span>
      <span style="flex:1;line-height:1.4;">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });

    // Auto remove
    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 350);
    }, duration);
  }

  // -------------------------------------------------------------
  // 4. Modal Dialog Utility
  // -------------------------------------------------------------
  function openModal({ title, contentHtml, onConfirm, confirmText = 'Save', showCancel = true }) {
    closeModal(); // Close any existing modal

    const overlay = document.createElement('div');
    overlay.id = 'logifleet-modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(5px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity .2s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      width: 520px;
      max-width: 95%;
      border-radius: 14px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      font-family: Arial, sans-serif;
      transform: translateY(20px);
      transition: transform .2s ease;
    `;

    modal.innerHTML = `
      <div style="background:#151c30;color:white;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-size:18px;margin:0;font-weight:bold;">${escapeHtml(title)}</h3>
        <button id="modalCloseX" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1;">&times;</button>
      </div>
      <div style="padding:24px;max-height:70vh;overflow-y:auto;">
        ${contentHtml}
      </div>
      <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;">
        ${
          showCancel
            ? `<button id="modalCancelBtn" style="padding:10px 18px;border:1px solid #cbd5e1;background:white;color:#475569;border-radius:7px;cursor:pointer;font-weight:bold;">Cancel</button>`
            : ''
        }
        <button id="modalConfirmBtn" style="padding:10px 22px;border:none;background:#2867e8;color:white;border-radius:7px;cursor:pointer;font-weight:bold;">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'translateY(0)';
    });

    const close = () => closeModal();
    overlay.querySelector('#modalCloseX').onclick = close;
    if (showCancel) {
      overlay.querySelector('#modalCancelBtn').onclick = close;
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    const confirmBtn = overlay.querySelector('#modalConfirmBtn');
    if (onConfirm) {
      confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        const originalText = confirmBtn.innerText;
        confirmBtn.innerText = 'Processing...';
        try {
          const success = await onConfirm();
          if (success !== false) closeModal();
        } catch (err) {
          showToast(err.message || 'Action failed', 'error');
        } finally {
          confirmBtn.disabled = false;
          confirmBtn.innerText = originalText;
        }
      };
    }

    return overlay;
  }

  function closeModal() {
    const existing = document.getElementById('logifleet-modal-overlay');
    if (existing) {
      existing.style.opacity = '0';
      setTimeout(() => {
        if (existing.parentElement) existing.parentElement.removeChild(existing);
      }, 200);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // -------------------------------------------------------------
  // 5. Expose globally
  // -------------------------------------------------------------
  window.LogiFleetAPI = {
    BASE_URL: API_BASE_URL,
    request,
    ...api,
  };

  window.LogiFleetAuth = LogiFleetAuth;
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.escapeHtml = escapeHtml;

  // Auto-init navbar on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => LogiFleetAuth.updateNavbar());
  } else {
    LogiFleetAuth.updateNavbar();
  }
})(window);
