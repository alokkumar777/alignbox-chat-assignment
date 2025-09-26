const API_URL = "http://localhost:4000/messages"; // backend endpoint

const messagesContainer = document.querySelector(".chat-messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const anonToggleBtn = document.getElementById("anonToggle");

// Temporary user info (later you can add login if needed)
const CURRENT_USER = {
  id: "u1",
  name: "Abhay Shukla",
  anonymous: false,
};

// Load all messages on startup
async function loadMessages() {
  try {
    const res = await fetch(API_URL);
    const messages = await res.json();
    messagesContainer.innerHTML = "";
    messages.forEach(renderMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (err) {
    console.error("Error fetching messages:", err);
  }
}

// Render a single message
function renderMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(msg.user_id === CURRENT_USER.id ? "outgoing" : "incoming");

  if (msg.user_id !== CURRENT_USER.id && msg.anonymous) {
    const sender = document.createElement("div");
    sender.classList.add("sender");
    sender.textContent = "Anonymous";
    div.appendChild(sender);
  } else if (msg.user_id !== CURRENT_USER.id) {
    const sender = document.createElement("div");
    sender.classList.add("sender");
    sender.textContent = msg.username || "Unknown";
    div.appendChild(sender);
  }

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.textContent = msg.message;
  div.appendChild(bubble);

  const time = document.createElement("div");
  time.classList.add("time");
  time.textContent = new Date(msg.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  div.appendChild(time);

  messagesContainer.appendChild(div);
}

// Send new message
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  const newMsg = {
    user_id: CURRENT_USER.id,
    username: CURRENT_USER.name,
    message: text,
    anonymous: CURRENT_USER.anonymous,
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg),
    });
    const savedMsg = await res.json();
    renderMessage(savedMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    input.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
  }
}

// Toggle anonymous mode
anonToggleBtn.addEventListener("click", () => {
  CURRENT_USER.anonymous = !CURRENT_USER.anonymous;
  anonToggleBtn.style.color = CURRENT_USER.anonymous ? "red" : "black";
  anonToggleBtn.title = CURRENT_USER.anonymous ? "Anonymous ON" : "Anonymous OFF";
  console.log("Anonymous mode:", CURRENT_USER.anonymous);
});

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Load messages initially
loadMessages();

// Optional: refresh every 3s (basic polling)
setInterval(loadMessages, 3000);
