const db = require("./connection");

db.serialize(() => {
  console.log("🌱 Iniciando seed...");
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
    {
      id: "user_neymar",
      name: "Neymar Jr",
      email: "neymar@chat.com",
      password: "123",
      avatar: "⚽",
      fanPoints: 2000,
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
});
