const authSection = document.getElementById('auth-section');
const tasksSection = document.getElementById('tasks-section');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const authForm = document.getElementById('auth-form');
const authSubmit = document.getElementById('auth-submit');
const authError = document.getElementById('auth-error');

const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const taskCounter = document.getElementById('task-counter');
const taskError = document.getElementById('task-error');
const filterButtons = document.querySelectorAll('.filter');

let mode = 'login';
let currentFilter = 'all';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearToken() {
  localStorage.removeItem('token');
}

function showTasksUI(user) {
  authSection.classList.add('hidden');
  tasksSection.classList.remove('hidden');
  userInfo.textContent = `${user.email} · ${user.role}`;
  loadTasks();
}

function showAuthUI() {
  tasksSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  taskList.innerHTML = '';
  authError.textContent = '';
}

tabLogin.addEventListener('click', () => {
  mode = 'login';
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  authSubmit.textContent = 'Войти';
  authError.textContent = '';
});

tabRegister.addEventListener('click', () => {
  mode = 'register';
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  authSubmit.textContent = 'Создать аккаунт';
  authError.textContent = '';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      authError.textContent = data.error || 'Ошибка авторизации';
      return;
    }

    setToken(data.token);
    authForm.reset();
    showTasksUI(data.user);
  } catch {
    authError.textContent = 'Нет связи с сервером';
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  showAuthUI();
});

async function loadTasks() {
  taskError.textContent = '';
  const query = currentFilter === 'all' ? '' : `?done=${currentFilter}`;

  try {
    const res = await fetch(`/api/tasks${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (res.status === 401) {
      clearToken();
      showAuthUI();
      return;
    }

    const tasks = await res.json();
    renderTasks(tasks);
  } catch {
    taskError.textContent = 'Не удалось загрузить задачи';
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  taskCounter.textContent = `${tasks.length} ${tasks.length === 1 ? 'задача' : tasks.length >= 2 && tasks.length <= 4 ? 'задачи' : 'задач'}`;

  if (tasks.length === 0) {
    taskList.innerHTML = '<li class="empty-state">Здесь пока пусто — добавь первую задачу выше</li>';
    return;
  }

  for (const task of tasks) {
    const li = document.createElement('li');
    li.className = 'task-item';

    const left = document.createElement('div');
    left.className = 'task-left';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => toggleTask(task.id, !task.done));

    const span = document.createElement('span');
    span.className = `task-title ${task.done ? 'done' : ''}`;
    span.textContent = task.title;
    span.addEventListener('click', () => toggleTask(task.id, !task.done));

    left.append(checkbox, span);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.type = 'button';
    delBtn.textContent = 'Удалить';
    delBtn.addEventListener('click', () => deleteTask(task.id));

    li.append(left, delBtn);
    taskList.appendChild(li);
  }
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  taskError.textContent = '';

  const title = taskInput.value.trim();
  if (!title) return;

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ title }),
    });

    const data = await res.json();
    if (!res.ok) {
      taskError.textContent = data.error || 'Ошибка добавления';
      return;
    }

    taskInput.value = '';
    loadTasks();
  } catch {
    taskError.textContent = 'Ошибка сети';
  }
});

async function toggleTask(id, done) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ done }),
    });

    if (res.ok) {
      loadTasks();
    }
  } catch {
    taskError.textContent = 'Ошибка обновления задачи';
  }
}

async function deleteTask(id) {
  try {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (res.ok) {
      loadTasks();
    }
  } catch {
    taskError.textContent = 'Ошибка удаления задачи';
  }
}

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

(async function init() {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      showTasksUI(data.user);
    } else {
      clearToken();
    }
  } catch {
    // остаёмся на форме входа
  }
})();