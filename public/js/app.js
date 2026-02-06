const API_BASE = '/api/tasks';
const AUTH_ME = '/api/auth/me';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => el.querySelectorAll(sel);

const taskList = $('#task-list');
const emptyState = $('#empty-state');
const loadingState = $('#loading-state');
const errorState = $('#error-state');
const errorStateWrap = $('#error-state-wrap');
const taskForm = $('#task-form');
const editForm = $('#edit-form');
const editModal = $('#edit-modal');
const filterStatus = $('#filter-status');
const toast = $('#toast');

const fetchOpts = { credentials: 'include' };

function redirectToLogin() {
  window.location.href = '/login';
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 3000);
}

function setListState(state, errorMessage) {
  loadingState.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorStateWrap.classList.add('hidden');
  errorState.textContent = errorMessage || 'Failed to load tasks. Please refresh.';
  $$('.task-card', taskList).forEach((card) => card.remove());
  if (state === 'loading') loadingState.classList.remove('hidden');
  else if (state === 'empty') emptyState.classList.remove('hidden');
  else if (state === 'error') {
    errorStateWrap.classList.remove('hidden');
  }
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return date + ', ' + time;
}

function statusLabel(value) {
  const map = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  };
  return map[value] || value;
}

function renderTask(task) {
  const card = document.createElement('article');
  card.className = 'task-card';
  card.dataset.id = task.id;
  card.innerHTML = `
    <div class="task-body">
      <h3 class="task-title">${escapeHtml(task.title)}</h3>
      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
      <div class="task-meta">
        <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
        <span class="time">${formatDate(task.updated_at || task.created_at)}</span>
      </div>
    </div>
    <div class="task-actions">
      <button type="button" class="btn btn-secondary btn-sm" data-edit>Edit</button>
      <button type="button" class="btn btn-danger btn-sm" data-delete>Delete</button>
    </div>
  `;
  card.querySelector('[data-edit]').addEventListener('click', () => openEditModal(task));
  card.querySelector('[data-delete]').addEventListener('click', () => deleteTask(task.id));
  return card;
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function fetchTasks() {
  const status = filterStatus.value || '';
  const url = status ? `${API_BASE}?status=${encodeURIComponent(status)}` : API_BASE;
  const res = await fetch(url, fetchOpts);
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('Unauthorized');
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(res.ok ? 'Invalid response' : `Server error (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return Array.isArray(data) ? data : [];
}

async function loadTasks() {
  setListState('loading');
  try {
    const tasks = await fetchTasks();
    setListState(tasks.length ? 'list' : 'empty');
    tasks.forEach((task) => taskList.appendChild(renderTask(task)));
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    setListState('error', err.message || 'Failed to load tasks. Please refresh.');
  }
}

async function createTask(payload) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Create failed');
  return data;
}

async function updateTask(id, payload) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Update failed');
  return data;
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error('Delete failed');
    $(`.task-card[data-id="${id}"]`, taskList)?.remove();
    if (!$$('.task-card', taskList).length) {
      emptyState.classList.remove('hidden');
    }
    showToast('Task deleted');
  } catch {
    showToast('Failed to delete task', 'error');
  }
}

function openEditModal(task) {
  $('#edit-id').value = task.id;
  $('#edit-title').value = task.title;
  $('#edit-description').value = task.description || '';
  $('#edit-status').value = task.status;
  editModal.classList.remove('hidden');
  $('#edit-title').focus();
}

function closeEditModal() {
  editModal.classList.add('hidden');
}

editModal.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', closeEditModal);
});

editModal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEditModal();
});

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    title: $('#title').value.trim(),
    description: $('#description').value.trim() || undefined,
    status: $('#status').value,
  };
  try {
    await createTask(payload);
    taskForm.reset();
    $('#status').value = 'pending';
    showToast('Task added');
    loadTasks();
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    showToast(err.message || 'Failed to add task', 'error');
  }
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#edit-id').value;
  const payload = {
    title: $('#edit-title').value.trim(),
    description: $('#edit-description').value.trim() || undefined,
    status: $('#edit-status').value,
  };
  try {
    const updated = await updateTask(id, payload);
    const card = $(`.task-card[data-id="${id}"]`, taskList);
    if (card) {
      const newCard = renderTask(updated);
      card.replaceWith(newCard);
    }
    closeEditModal();
    showToast('Task updated');
  } catch (err) {
    if (err.message === 'Unauthorized') return;
    showToast(err.message || 'Failed to update task', 'error');
  }
});

filterStatus.addEventListener('change', loadTasks);

$('#show-tasks-btn').addEventListener('click', () => {
  loadTasks();
});

$('#retry-tasks-btn').addEventListener('click', () => {
  loadTasks();
});

$('#logout-btn').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } finally {
    window.location.href = '/login';
  }
});

async function init() {
  try {
    const res = await fetch(AUTH_ME, fetchOpts);
    if (!res.ok) {
      redirectToLogin();
      return;
    }
    const user = await res.json().catch(() => null);
    if (!user || !user.username) {
      redirectToLogin();
      return;
    }
    $('#user-name').textContent = user.username;
    loadTasks();
  } catch {
    redirectToLogin();
  }
}

init();
