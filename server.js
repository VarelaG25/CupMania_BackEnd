const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const db = require("./db/connection");
require("./db/setup");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
});

// ======================================================
// CHATS
// ======================================================
app.get("/api/chats/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT c.*, GROUP_CONCAT(p.userId) as participants 
    FROM chats c
    INNER JOIN participants p ON c.id = p.chatId
    WHERE c.id IN (
      SELECT chatId FROM participants WHERE userId = ?
    )
    GROUP BY c.id
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const formatted = rows.map((chat) => ({
      ...chat,
      participants: chat.participants ? chat.participants.split(",") : [],
    }));

    res.json(formatted);
  });
});

// ======================================================
// MESSAGES
// ======================================================
app.get("/api/messages/:chatId", (req, res) => {
  const { chatId } = req.params;

  db.all(
    "SELECT * FROM messages WHERE chatId = ? ORDER BY timestamp ASC",
    [chatId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

// ======================================================
// USERS
// ======================================================
app.get("/api/users", (req, res) => {
  db.all("SELECT id, name, avatar, status FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ======================================================
// CREATE CHAT (PRIVATE + GROUP)
// ======================================================
app.post("/api/chats", (req, res) => {
  const { id, name, type, avatar, participants } = req.body;

  db.serialize(() => {
    db.run("INSERT INTO chats (id, name, type, avatar) VALUES (?, ?, ?, ?)", [
      id,
      name,
      type,
      avatar,
    ]);

    const stmt = db.prepare(
      "INSERT INTO participants (chatId, userId) VALUES (?, ?)",
    );

    participants.forEach((uId) => stmt.run(id, uId));

    stmt.finalize();

    res.status(201).json({ success: true });
  });
});

// ======================================================
// SOCKET
// ======================================================
io.on("connection", (socket) => {
  console.log("⚡ conectado:", socket.id);

  socket.on("login_user", (data) => {
    const { email, password } = data;

    console.log("📥 login recibido:", email, password);

    const sql = `
      SELECT id, name, email, avatar
      FROM users
      WHERE email = ? AND password = ?
    `;

    db.get(sql, [email, password], (err, user) => {
      if (err) {
        console.error("❌ DB error:", err.message);

        return socket.emit("login_response", {
          success: false,
          message: "Error en el servidor",
        });
      }

      if (!user) {
        return socket.emit("login_response", {
          success: false,
          message: "Credenciales incorrectas",
        });
      }

      socket.emit("login_response", {
        success: true,
        user,
      });
    });
  });

  socket.on("register_user", (data) => {
    const { id, name, email, password, avatar } = data;

    console.log("📥 registro recibido:", data);

    const sql = `
    INSERT INTO users (id, name, email, password, avatar)
    VALUES (?, ?, ?, ?, ?)
  `;

    db.run(sql, [id, name, email, password, avatar], function (err) {
      if (err) {
        console.error("❌ DB error:", err.message);

        return socket.emit("register_response", {
          success: false,
          message: "Error al registrar usuario",
        });
      }

      socket.emit("register_response", {
        success: true,
        message: "Usuario creado correctamente",
      });
    });
  });

  // JOIN CHAT
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
  });

  // SEND MESSAGE
  socket.on("send_message", (data) => {
    const { chatId, senderId, senderName, content, type } = data;
    const timestamp = new Date().toISOString();

    const sql = `
      INSERT INTO messages (chatId, senderId, senderName, content, timestamp, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [chatId, senderId, senderName, content, timestamp, type || "text"],
      function (err) {
        if (err) {
          console.error(err.message);
          return;
        }

        // actualizar preview chat
        db.run(
          "UPDATE chats SET lastMessage = ?, lastMessageTime = ? WHERE id = ?",
          [content, timestamp, chatId],
        );

        // 🔥 IMPORTANTE: aquí mandamos senderName SIEMPRE
        io.to(chatId).emit("receive_message", {
          id: this.lastID,
          chatId,
          senderId,
          senderName, // 👈 clave para grupos
          content,
          type,
          timestamp,
        });
      },
    );
  });

  socket.on("disconnect", () => {
    console.log("🚫 desconectado");
  });
});

// ======================================================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 server running http://localhost:${PORT}`);
});
