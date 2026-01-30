// Check authentication on load
if (!sessionStorage.getItem("authenticated")) {
  window.location.href = "/login.html";
}

// Display user email
const userEmailDisplay = document.getElementById("userEmail");
const userEmail = sessionStorage.getItem("userEmail");
if (userEmail) {
  userEmailDisplay.textContent = userEmail;
}

// API Helper Functions
async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// DOM Elements
const threadsView = document.getElementById("threadsView");
const chatView = document.getElementById("chatView");
const threadList = document.getElementById("threadList");
const loadingThreads = document.getElementById("loadingThreads");
const noThreads = document.getElementById("noThreads");
const threadCount = document.getElementById("threadCount");
const chatTitle = document.getElementById("chatTitle");
const chatPhone = document.getElementById("chatPhone");
const messagesList = document.getElementById("messagesList");
const backBtn = document.getElementById("backBtn");
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

let currentPhone = null;
let autoRefreshInterval = null;

// Logout Handler
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("authenticated");
  sessionStorage.removeItem("userEmail");
  window.location.href = "/login.html";
});

// Refresh Handler
refreshBtn.addEventListener("click", async () => {
  refreshBtn.style.transform = "rotate(360deg)";
  refreshBtn.style.transition = "transform 0.5s ease";
  await loadThreads();
  setTimeout(() => {
    refreshBtn.style.transform = "";
  }, 500);
});

// Back Button Handler
backBtn.addEventListener("click", () => {
  chatView.classList.add("hidden");
  threadsView.classList.remove("hidden");
  currentPhone = null;
  // Resume auto-refresh when back to threads view
  startAutoRefresh();
});

// Load Threads Function
async function loadThreads() {
  try {
    const data = await getJson("/threads");

    // Hide loading, show appropriate content
    loadingThreads.classList.add("hidden");

    if (data.length === 0) {
      noThreads.classList.remove("hidden");
      threadList.classList.add("hidden");
      threadCount.textContent = "0 conversations";
    } else {
      noThreads.classList.add("hidden");
      threadList.classList.remove("hidden");
      threadCount.textContent = `${data.length} conversation${data.length !== 1 ? "s" : ""}`;
      renderThreads(data);
    }
  } catch (error) {
    console.error("Failed to load threads:", error);
    loadingThreads.innerHTML = `
            <div class="loading">
                <p style="color: #e74c3c;">Failed to load conversations</p>
            </div>
        `;
  }
}

// Render Threads
function renderThreads(threads) {
  threadList.innerHTML = "";

  threads.forEach((thread) => {
    const li = document.createElement("li");
    li.className = "thread-item";

    const displayName = thread.name || thread.phone;
    const preview = thread.lastBody || "No messages";
    const timestamp = formatTimestamp(thread.last);

    li.innerHTML = `
            <div class="thread-main">
                <div class="thread-contact">${escapeHtml(displayName)}</div>
                <div class="thread-preview">${escapeHtml(preview)}</div>
            </div>
            <div class="thread-meta">
                <div class="thread-time">${timestamp}</div>
            </div>
        `;

    li.addEventListener("click", () => openThread(thread.phone, thread.name));
    threadList.appendChild(li);
  });
}

// Open Thread
async function openThread(phone, name) {
  currentPhone = phone;

  // Stop auto-refresh when viewing a thread
  stopAutoRefresh();

  threadsView.classList.add("hidden");
  chatView.classList.remove("hidden");

  chatTitle.textContent = name || phone;
  chatPhone.textContent = phone;

  messagesList.innerHTML =
    '<div class="loading"><div class="spinner"></div><p>Loading messages...</p></div>';

  try {
    const messages = await getJson("/messages/" + encodeURIComponent(phone));
    renderMessages(messages);
  } catch (error) {
    console.error("Failed to load messages:", error);
    messagesList.innerHTML =
      '<div class="loading"><p style="color: #e74c3c;">Failed to load messages</p></div>';
  }
}

// Render Messages
function renderMessages(messages) {
  messagesList.innerHTML = "";

  if (messages.length === 0) {
    messagesList.innerHTML = `
            <div class="empty-state">
                <p>No messages in this conversation</p>
            </div>
        `;
    return;
  }

  messages.forEach((message) => {
    const div = document.createElement("div");
    div.className = `message ${message.direction}`;

    div.innerHTML = `
            <div class="message-body">${escapeHtml(message.body)}</div>
            <div class="message-time">${formatTimestamp(message.timestamp)}</div>
        `;

    messagesList.appendChild(div);
  });

  // Scroll to bottom
  messagesList.scrollTop = messagesList.scrollHeight;
}

// Format Timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) {
    return "Just now";
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  }

  // Today
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // This year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Other years
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh threads every 10 seconds
function startAutoRefresh() {
  stopAutoRefresh(); // Clear any existing interval
  autoRefreshInterval = setInterval(() => {
    if (!chatView.classList.contains("hidden")) return; // Don't refresh if in chat view
    loadThreads();
  }, 10000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Initial Load
loadThreads();
startAutoRefresh();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  stopAutoRefresh();
});
