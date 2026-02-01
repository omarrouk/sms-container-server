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

async function postJson(path, data) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function putJson(path, data) {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function deleteRequest(path) {
  const res = await fetch(path, { method: "DELETE" });
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
const newConversationBtn = document.getElementById("newConversationBtn");
const editContactBtn = document.getElementById("editContactBtn");
const deleteThreadBtn = document.getElementById("deleteThreadBtn");
const messageInput = document.getElementById("messageInput");
const messageDirection = document.getElementById("messageDirection");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");
const toastContainer = document.getElementById("toastContainer");

let currentPhone = null;
let currentName = null;
let autoRefreshInterval = null;
let modalConfirmHandler = null;

// Toast Notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Modal Functions
function showModal(title, bodyHtml, onConfirm) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalOverlay.classList.remove("hidden");
  modalConfirmHandler = onConfirm;
}

function hideModal() {
  modalOverlay.classList.add("hidden");
  modalConfirmHandler = null;
}

modalCloseBtn.addEventListener("click", hideModal);
modalCancelBtn.addEventListener("click", hideModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) hideModal();
});

modalConfirmBtn.addEventListener("click", () => {
  if (modalConfirmHandler) {
    modalConfirmHandler();
  }
});

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
  currentName = null;
  startAutoRefresh();
});

// New Conversation Button
newConversationBtn.addEventListener("click", () => {
  showModal(
    "New Conversation",
    `
    <div class="form-group">
      <label for="newPhone">Phone Number</label>
      <input type="tel" id="newPhone" class="form-input" placeholder="+1234567890" required>
    </div>
    <div class="form-group">
      <label for="newName">Contact Name (Optional)</label>
      <input type="text" id="newName" class="form-input" placeholder="John Doe">
    </div>
    <div class="form-group">
      <label for="newMessage">Initial Message</label>
      <textarea id="newMessage" class="form-input form-textarea" placeholder="Type your message..." rows="3"></textarea>
    </div>
    <div class="form-group">
      <label for="newDirection">Direction</label>
      <select id="newDirection" class="form-input">
        <option value="received">Received</option>
        <option value="sent">Sent</option>
      </select>
    </div>
  `,
    async () => {
      const phone = document.getElementById("newPhone").value.trim();
      const name = document.getElementById("newName").value.trim();
      const message = document.getElementById("newMessage").value.trim();
      const direction = document.getElementById("newDirection").value;

      if (!phone) {
        showToast("Phone number is required", "error");
        return;
      }
      if (!message) {
        showToast("Message is required", "error");
        return;
      }

      try {
        const result = await postJson("/messages", {
          phone,
          name: name || null,
          body: message,
          direction,
        });

        if (result.ok) {
          showToast("Conversation created successfully");
          hideModal();
          await loadThreads();
          openThread(phone, name || null);
        } else {
          showToast(result.message || "Failed to create conversation", "error");
        }
      } catch (error) {
        showToast("Failed to create conversation", "error");
      }
    }
  );
});

// Edit Contact Name
editContactBtn.addEventListener("click", () => {
  showModal(
    "Edit Contact Name",
    `
    <div class="form-group">
      <label for="editName">Contact Name</label>
      <input type="text" id="editName" class="form-input" placeholder="John Doe" value="${escapeHtml(currentName || "")}">
    </div>
  `,
    async () => {
      const name = document.getElementById("editName").value.trim();

      try {
        const result = await putJson(
          "/threads/" + encodeURIComponent(currentPhone),
          { name }
        );

        if (result.ok) {
          currentName = name || null;
          chatTitle.textContent = name || currentPhone;
          showToast("Contact name updated");
          hideModal();
        } else {
          showToast(result.message || "Failed to update", "error");
        }
      } catch (error) {
        showToast("Failed to update contact name", "error");
      }
    }
  );
});

// Delete Thread
deleteThreadBtn.addEventListener("click", () => {
  showModal(
    "Delete Conversation",
    `
    <p>Are you sure you want to delete this entire conversation with <strong>${escapeHtml(currentName || currentPhone)}</strong>?</p>
    <p class="warning-text">This action cannot be undone.</p>
  `,
    async () => {
      try {
        const result = await deleteRequest(
          "/threads/" + encodeURIComponent(currentPhone)
        );

        if (result.ok) {
          showToast("Conversation deleted");
          hideModal();
          backBtn.click();
          await loadThreads();
        } else {
          showToast(result.message || "Failed to delete", "error");
        }
      } catch (error) {
        showToast("Failed to delete conversation", "error");
      }
    }
  );
});

// Send Message
async function sendMessage() {
  const body = messageInput.value.trim();
  const direction = messageDirection.value;

  if (!body || !currentPhone) return;

  try {
    const result = await postJson("/messages", {
      phone: currentPhone,
      name: currentName,
      body,
      direction,
    });

    if (result.ok) {
      messageInput.value = "";
      await openThread(currentPhone, currentName);
      showToast("Message added");
    } else {
      showToast(result.message || "Failed to send message", "error");
    }
  } catch (error) {
    showToast("Failed to send message", "error");
  }
}

sendMessageBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Load Threads Function
async function loadThreads() {
  try {
    const data = await getJson("/threads");

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
      <div class="thread-main" data-phone="${escapeHtml(thread.phone)}" data-name="${escapeHtml(thread.name || "")}">
        <div class="thread-contact">${escapeHtml(displayName)}</div>
        <div class="thread-preview">${escapeHtml(preview)}</div>
      </div>
      <div class="thread-meta">
        <div class="thread-time">${timestamp}</div>
        <button class="btn-icon-small btn-delete-thread" data-phone="${escapeHtml(thread.phone)}" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
          </svg>
        </button>
      </div>
    `;

    // Click on thread to open
    li.querySelector(".thread-main").addEventListener("click", () => {
      openThread(thread.phone, thread.name);
    });

    // Delete button
    li.querySelector(".btn-delete-thread").addEventListener("click", (e) => {
      e.stopPropagation();
      const phone = e.currentTarget.dataset.phone;
      showModal(
        "Delete Conversation",
        `<p>Are you sure you want to delete the conversation with <strong>${escapeHtml(thread.name || phone)}</strong>?</p>
         <p class="warning-text">This action cannot be undone.</p>`,
        async () => {
          try {
            const result = await deleteRequest(
              "/threads/" + encodeURIComponent(phone)
            );
            if (result.ok) {
              showToast("Conversation deleted");
              hideModal();
              await loadThreads();
            } else {
              showToast("Failed to delete", "error");
            }
          } catch (error) {
            showToast("Failed to delete", "error");
          }
        }
      );
    });

    threadList.appendChild(li);
  });
}

// Open Thread
async function openThread(phone, name) {
  currentPhone = phone;
  currentName = name;

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
      <div class="message-footer">
        <span class="message-time">${formatTimestamp(message.timestamp)}</span>
        <div class="message-actions">
          <button class="btn-msg-action btn-edit-msg" data-id="${message._id}" title="Edit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-msg-action btn-delete-msg" data-id="${message._id}" title="Delete">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3,6 5,6 21,6"/>
              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Edit message
    div.querySelector(".btn-edit-msg").addEventListener("click", () => {
      showModal(
        "Edit Message",
        `
        <div class="form-group">
          <label for="editMsgBody">Message</label>
          <textarea id="editMsgBody" class="form-input form-textarea" rows="4">${escapeHtml(message.body)}</textarea>
        </div>
      `,
        async () => {
          const newBody = document.getElementById("editMsgBody").value.trim();
          if (!newBody) {
            showToast("Message cannot be empty", "error");
            return;
          }

          try {
            const result = await putJson("/messages/" + message._id, {
              body: newBody,
            });

            if (result.ok) {
              showToast("Message updated");
              hideModal();
              await openThread(currentPhone, currentName);
            } else {
              showToast(result.message || "Failed to update", "error");
            }
          } catch (error) {
            showToast("Failed to update message", "error");
          }
        }
      );
    });

    // Delete message
    div.querySelector(".btn-delete-msg").addEventListener("click", () => {
      showModal(
        "Delete Message",
        `<p>Are you sure you want to delete this message?</p>
         <p class="warning-text">This action cannot be undone.</p>`,
        async () => {
          try {
            const result = await deleteRequest("/messages/" + message._id);

            if (result.ok) {
              showToast("Message deleted");
              hideModal();
              await openThread(currentPhone, currentName);
            } else {
              showToast(result.message || "Failed to delete", "error");
            }
          } catch (error) {
            showToast("Failed to delete message", "error");
          }
        }
      );
    });

    messagesList.appendChild(div);
  });

  // Scroll to bottom
  const container = document.getElementById("messagesContainer");
  container.scrollTop = container.scrollHeight;
}

// Format Timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return "Just now";
  }

  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  }

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Auto-refresh threads every 10 seconds
function startAutoRefresh() {
  stopAutoRefresh();
  autoRefreshInterval = setInterval(() => {
    if (!chatView.classList.contains("hidden")) return;
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
