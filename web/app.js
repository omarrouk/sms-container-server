const apiBase = '';

async function post(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return res;
}

async function getJson(path) {
  const res = await fetch(path);
  return res.json();
}

const loginBtn = document.getElementById('btnLogin');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginMsg = document.getElementById('loginMsg');
const dashboardPanel = document.getElementById('dashboard');
const threadsPanel = document.getElementById('threads');
const threadList = document.getElementById('threadList');
const chatPanel = document.getElementById('chat');
const chatTitle = document.getElementById('chatTitle');
const messagesDiv = document.getElementById('messages');
const backBtn = document.getElementById('back');
const btnLogout = document.getElementById('btnLogout');
const btnToDashboard = document.getElementById('btnToDashboard');
const messageList = document.getElementById('messageList');
const btnViewThreads = document.getElementById('btnViewThreads');

loginBtn.onclick = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return;
  const res = await post('/login', { email, password });
  if (res.status === 200) {
    loginPanel.classList.add('hidden');
    dashboardPanel.classList.remove('hidden');
    await loadDashboard();
  } else {
    loginMsg.innerText = 'Invalid credentials';
  }
};

btnLogout.onclick = () => {
  dashboardPanel.classList.add('hidden');
  threadsPanel.classList.add('hidden');
  chatPanel.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  emailInput.value = '';
  passwordInput.value = '';
};

btnViewThreads.onclick = () => {
  dashboardPanel.classList.add('hidden');
  threadsPanel.classList.remove('hidden');
  loadThreads();
};

async function loadDashboard() {
  // Load all messages
  const messages = await getJson('/all-messages');
  messageList.innerHTML = '';
  messages.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${m.phone}</strong> (${m.direction}): ${m.body} <em>${new Date(m.timestamp).toLocaleString()}</em>
      <button onclick="editMessage('${m._id}', '${m.body}')">Edit</button>
      <button onclick="deleteMessage('${m._id}')">Delete</button>
    `;
    messageList.appendChild(li);
  });

  // Load requests (placeholder)
  const reqs = await getJson('/requests');
  requestsDiv.innerText = reqs.message;
}

async function editMessage(id, currentBody) {
  const newBody = prompt('Edit body:', currentBody);
  if (newBody && newBody !== currentBody) {
    await fetch('/edit-message/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: newBody }) });
    loadDashboard();
  }
}

async function deleteMessage(id) {
  if (confirm('Delete this message?')) {
    await fetch('/delete-message/' + id, { method: 'DELETE' });
    loadDashboard();
  }
}

async function loadThreads() {
  threadList.innerHTML = '';
  const data = await getJson('/threads');
  data.forEach(t => {
    const li = document.createElement('li');
    li.innerText = (t.name || t.phone) + ' — ' + new Date(t.last).toLocaleString();
    li.onclick = () => openThread(t.phone, t.name);
    threadList.appendChild(li);
  });
}

async function openThread(phone, name) {
  dashboardPanel.classList.add('hidden');
  threadsPanel.classList.remove('hidden');
  chatPanel.classList.add('hidden');
  // Wait, threads is separate, but to open chat
  // Perhaps from threads, open chat
  // Adjust
  threadsPanel.classList.add('hidden');
  chatPanel.classList.remove('hidden');
  chatTitle.innerText = name || phone;
  const messages = await getJson('/messages/' + encodeURIComponent(phone));
  messagesDiv.innerHTML = '';
  messages.forEach(m => {
    const d = document.createElement('div');
    d.className = 'message ' + (m.direction === 'sent' ? 'sent' : 'received');
    d.innerText = m.body + '\n' + new Date(m.timestamp).toLocaleString();
    messagesDiv.appendChild(d);
  });
}

backBtn.onclick = () => {
  chatPanel.classList.add('hidden');
  threadsPanel.classList.remove('hidden');
};

// Auto-refresh dashboard every 10s
setInterval(loadDashboard, 10000);
