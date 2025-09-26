require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // wrap express with http server
const io = new Server(server, {
  cors: {
    origin: "*", // in production, restrict to your frontend origin
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "alignbox_chat",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// GET all messages (for initial load)
app.get("/messages", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM messages ORDER BY created_at ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// POST a message (also emit via socket)
app.post("/messages", async (req, res) => {
  const { user_id, username, message, anonymous } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  try {
    const [result] = await pool.query(
      "INSERT INTO messages (user_id, username, message, anonymous) VALUES (?, ?, ?, ?)",
      [user_id || null, username || null, message, anonymous ? 1 : 0]
    );
    const [row] = await pool.query("SELECT * FROM messages WHERE id = ?", [
      result.insertId,
    ]);

    const savedMsg = row[0];
    io.emit("newMessage", savedMsg); // broadcast to all connected clients

    res.status(201).json(savedMsg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Socket.io connections
io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
