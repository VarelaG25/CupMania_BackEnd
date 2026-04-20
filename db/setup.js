const db = require('./connection');

db.serialize(() => {
    // 1. TABLA DE USUARIOS (Añadido fanPoints con default 0)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        fanPoints INTEGER DEFAULT 0,
        status TEXT DEFAULT 'offline'
    )`);

    // 2. TABLA DE RANGOS (Nueva)
    db.run(`CREATE TABLE IF NOT EXISTS ranks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        minPoints INTEGER NOT NULL,
        maxPoints INTEGER,
        color TEXT,
        medal TEXT
    )`);

    // Insertar rangos iniciales si la tabla está vacía
    db.get("SELECT COUNT(*) as count FROM ranks", (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare("INSERT INTO ranks (name, minPoints, maxPoints, color, medal) VALUES (?, ?, ?, ?, ?)");
            stmt.run("Turista", 0, 500, "text-white", "🌍");
            stmt.run("Fan", 501, 1500, "text-amber-300", "🥉");
            stmt.run("Hincha Pro", 1501, 3000, "text-green-300", "🥈");
            stmt.run("Leyenda del Mundial", 3001, null, "text-yellow-300", "🥇");
            stmt.finalize();
            console.log("Rangos iniciales insertados.");
        }
    });

    // 3. TABLA DE CHATS
    db.run(`CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT CHECK(type IN ('private', 'group')),
        avatar TEXT,
        lastMessage TEXT,
        lastMessageTime DATETIME
    )`);

    // 4. TABLA DE PARTICIPANTES
    db.run(`CREATE TABLE IF NOT EXISTS participants (
        chatId TEXT,
        userId TEXT,
        FOREIGN KEY (chatId) REFERENCES chats(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        PRIMARY KEY (chatId, userId)
    )`);

    // 5. TABLA DE MENSAJES
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chatId TEXT,
        senderId TEXT,
        senderName TEXT,
        content TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT DEFAULT 'text',
        FOREIGN KEY (chatId) REFERENCES chats(id)
    )`);

    console.log("Estructura de base de datos actualizada con sistema de rangos.");
});