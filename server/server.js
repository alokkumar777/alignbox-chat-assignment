require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
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

// GET all messages
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

// POST a message
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
    res.status(201).json(row[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
