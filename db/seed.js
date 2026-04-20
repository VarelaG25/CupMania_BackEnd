const db = require("./connection");

db.serialize(() => {
  console.log("🌱 Iniciando seed...");

  // =========================
  // LIMPIEZA
  // =========================
  db.run("DELETE FROM messages");
  db.run("DELETE FROM participants");
  db.run("DELETE FROM chats");
  db.run("DELETE FROM users");

  // =========================
  // USUARIOS (SOLO 2)
  // =========================
  const users = [
    {
      id: "user_messi",
      name: "Lionel Messi",
      email: "messi@chat.com",
      password: "123",
      avatar: "🐐",
      fanPoints: 2500,
    },
    {
      id: "user_cr7",
      name: "Cristiano Ronaldo",
      email: "cr7@chat.com",
      password: "123",
      avatar: "🏃‍♂️",
      fanPoints: 2200,
    },
  ];

  const userStmt = db.prepare(`
    INSERT INTO users (id, name, email, password, avatar, fanPoints, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach((u) =>
    userStmt.run(
      u.id,
      u.name,
      u.email,
      u.password,
      u.avatar,
      u.fanPoints,
      "offline",
    ),
  );

  userStmt.finalize();

  // =========================
  // CHAT PRIVADO (1 a 1)
  // =========================
  const chatId = "chat_messi_cr7";

  db.run(
    `
    INSERT INTO chats (id, name, type, avatar, lastMessage, lastMessageTime)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      chatId,
      "Messi vs CR7",
      "private",
      "⚽",
      "Empieza la conversación",
      new Date().toISOString(),
    ],
  );

  // =========================
  // PARTICIPANTES (IMPORTANTE)
  // =========================
  const partStmt = db.prepare(`
    INSERT INTO participants (chatId, userId)
    VALUES (?, ?)
  `);

  partStmt.run(chatId, "user_messi");
  partStmt.run(chatId, "user_cr7");

  partStmt.finalize();

  // =========================
  // MENSAJES DE PRUEBA
  // =========================
  const msgStmt = db.prepare(`
    INSERT INTO messages (chatId, senderId, senderName, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `);

  msgStmt.run(
    chatId,
    "user_messi",
    "Lionel Messi",
    "Hola CR7 👋",
    new Date().toISOString(),
  );

  msgStmt.run(
    chatId,
    "user_cr7",
    "Cristiano Ronaldo",
    "Hola Messi ⚽🔥",
    new Date().toISOString(),
  );

  msgStmt.finalize();

  console.log(`
✅ SEED LISTO:

👤 Usuarios:
- Lionel Messi (user_messi)
- Cristiano Ronaldo (user_cr7)

💬 Chat:
- Messi vs CR7 (private)

💬 Mensajes:
- 2 mensajes iniciales

🚀 Ya puedes probar chat 1 a 1 correctamente
  `);
});
