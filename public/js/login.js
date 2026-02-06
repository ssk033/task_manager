const $ = (sel, el = document) => el.querySelector(sel);

function showError(id, message) {
  const el = $(id);
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('hidden', !message);
}

document.querySelectorAll('.auth-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const t = tab.dataset.tab;
    document.querySelectorAll('.auth-tab').forEach((x) => x.classList.remove('active'));
    tab.classList.add('active');
    $('#login-section').classList.toggle('hidden', t !== 'login');
    $('#register-section').classList.toggle('hidden', t !== 'register');
    showError('#login-error', '');
    showError('#register-error', '');
  });
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('#login-error', '');
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError('#login-error', data.error || 'Login failed');
      return;
    }
    window.location.href = '/';
  } catch {
    showError('#login-error', 'Network error. Try again.');
  }
});

$('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('#register-error', '');
  const username = $('#register-username').value.trim().toLowerCase();
  const password = $('#register-password').value;
  if (username.length < 2) {
    showError('#register-error', 'Username must be at least 2 characters');
    return;
  }
  if (password.length < 6) {
    showError('#register-error', 'Password must be at least 6 characters');
    return;
  }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError('#register-error', data.error || 'Registration failed');
      return;
    }
    window.location.href = '/';
  } catch {
    showError('#register-error', 'Network error. Try again.');
  }
});
