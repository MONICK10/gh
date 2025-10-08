const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./mindease.db');

db.serialize(() => {
    console.log("Connecting to database and setting up tables...");

    // User Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `);

    // Chat History Table
    // We will store the entire conversation for a day as a JSON string (TEXT)
    db.run(`
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            chat_date TEXT NOT NULL,
            conversation TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    console.log("Database setup complete.");
});

module.exports = db;