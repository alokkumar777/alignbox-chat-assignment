const API_URL = "http://localhost:4000/messages";
const SOCKET_URL = "http://localhost:4000";

const messagesContainer = document.querySelector(".chat-messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const anonToggleBtn = document.getElementById("anonToggle");
const anonymousStatus = document.getElementById("anonymousStatus");

const socket = io(SOCKET_URL);

// Temporary user info
const CURRENT_USER = {
  id: "u1",
  name: "Abhay Shukla",
  anonymous: false,
};

// Load messages initially (one-time fetch)
async function loadMessages() {
  try {
    const res = await fetch(API_URL);
    const messages = await res.json();

    // Clear existing messages except the anonymous status indicator
    const existingMessages = messagesContainer.querySelectorAll(".message");
    existingMessages.forEach((msg) => msg.remove());

    messages.forEach(renderMessage);
    scrollToBottom();
  } catch (err) {
    console.error("Error fetching messages:", err);
  }
}

// Create message element
function createMessageElement(msg) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");

  const isOwnMessage = msg.user_id === CURRENT_USER.id;
  messageDiv.classList.add(isOwnMessage ? "outgoing" : "incoming");

  // Add avatar for non-anonymous incoming messages from specific users
  const shouldShowAvatar =
    !isOwnMessage && !msg.anonymous && msg.username;
  if (shouldShowAvatar) {
    messageDiv.classList.add("with-avatar");
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("message-avatar");
    avatarDiv.innerHTML = `<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0Qjc2ODgiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CjxwYXRoIGQ9Ik0xNiA3QzE2IDkuMjA5MTQgMTQuMjA5MSAxMSAxMiAxMUM5Ljc5MDg2IDExIDggOS4yMDkxNCA4IDdDOCA0Ljc5MDg2IDkuNzkwODYgMyAxMiAzQzE0LjIwOTEgMyAxNiA0Ljc5MDg2IDE2IDdaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC4xMzQwMSAxNCA1IDE3LjEzNCA1IDIxSDE5QzE5IDE3LjEzNCAxNS44NiAxNCAxMiAxNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4=" alt="User Avatar" />`;
    messageDiv.appendChild(avatarDiv);
  }

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("message-content");

  // Add sender name for incoming messages
  if (!isOwnMessage) {
    const senderDiv = document.createElement("div");
    senderDiv.classList.add("sender");
    senderDiv.textContent = msg.anonymous
      ? "Anonymous"
      : msg.username || "Unknown";
    contentDiv.appendChild(senderDiv);
  }

  // Create bubble
  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("bubble");
  bubbleDiv.textContent = msg.message;

  // Add time and status for outgoing messages
  if (isOwnMessage) {
    const statusDiv = document.createElement("div");
    statusDiv.classList.add("message-status");
    statusDiv.innerHTML = `
      <span class="time">${formatTime(msg.created_at || new Date())}</span>
      <span class="read-status">✓✓</span>
    `;
    bubbleDiv.appendChild(statusDiv);
  }

  contentDiv.appendChild(bubbleDiv);

  // Add time for incoming messages
  if (!isOwnMessage) {
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("time");
    timeDiv.textContent = formatTime(msg.created_at || new Date());
    contentDiv.appendChild(timeDiv);
  }

  messageDiv.appendChild(contentDiv);
  return messageDiv;
}

// Render a message
function renderMessage(msg) {
  const messageElement = createMessageElement(msg);
  messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

// Format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Scroll to bottom
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message via REST
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  const newMsg = {
    user_id: CURRENT_USER.id,
    username: CURRENT_USER.name,
    message: text,
    anonymous: CURRENT_USER.anonymous,
    created_at: new Date().toISOString(),
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg),
    });
    input.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

// Listen for socket events
socket.on("connect", () => {
  console.log("✅ Connected to socket server");
});

socket.on("newMessage", (msg) => {
  renderMessage(msg);
});

// Toggle anonymous mode
function toggleAnonymousMode() {
  CURRENT_USER.anonymous = !CURRENT_USER.anonymous;

  // Update button appearance
  if (CURRENT_USER.anonymous) {
    anonToggleBtn.classList.add("active");
    anonToggleBtn.style.background = "#28a745";
    anonymousStatus.classList.add("show");
  } else {
    anonToggleBtn.classList.remove("active");
    anonToggleBtn.style.background = "#dc3545";
    anonymousStatus.classList.remove("show");
  }

  anonToggleBtn.title = CURRENT_USER.anonymous
    ? "Anonymous ON"
    : "Anonymous OFF";
}

// Event listeners
anonToggleBtn.addEventListener("click", toggleAnonymousMode);

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Auto-resize input
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 100) + "px";
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadMessages();

  // Set initial anonymous status
  if (CURRENT_USER.anonymous) {
    anonymousStatus.classList.add("show");
    anonToggleBtn.classList.add("active");
    anonToggleBtn.style.background = "#28a745";
  }
});

// Handle online status simulation
function simulateOnlineStatus() {
  const onlineIndicators = document.querySelectorAll(".online-indicator");
  onlineIndicators.forEach((indicator) => {
    // Add subtle pulse animation
    indicator.style.animation = "pulse 2s infinite";
  });
}

// CSS animation for pulse
const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);

// Initialize online status simulation
setTimeout(simulateOnlineStatus, 1000);
