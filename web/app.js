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
const pinInput = document.getElementById('pin');
const loginMsg = document.getElementById('loginMsg');
const threadsPanel = document.getElementById('threads');
const threadList = document.getElementById('threadList');
const loginPanel = document.getElementById('login');
const chatPanel = document.getElementById('chat');
const chatTitle = document.getElementById('chatTitle');
const messagesDiv = document.getElementById('messages');
const backBtn = document.getElementById('back');

loginBtn.onclick = async () => {
  const pin = pinInput.value.trim();
  if (!pin) return;
  const res = await post('/login', { pin });
  if (res.status === 200) {
    loginPanel.classList.add('hidden');
    threadsPanel.classList.remove('hidden');
    await loadThreads();
  } else {
    loginMsg.innerText = 'Invalid PIN';
  }
};

backBtn.onclick = () => {
  chatPanel.classList.add('hidden');
  threadsPanel.classList.remove('hidden');
};

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

// Auto-refresh threads every 10s
setInterval(loadThreads, 10000);
