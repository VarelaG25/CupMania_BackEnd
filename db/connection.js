const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Creamos o abrimos el archivo chat.db en la raíz del backend
const dbPath = path.resolve(__dirname, '../chat.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error al conectar a SQLite:', err.message);
    else console.log('Conectado a la base de datos SQLite.');
});

module.exports = db;