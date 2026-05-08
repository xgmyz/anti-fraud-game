const { createClient } = require('@libsql/client');
const path = require('path');

const DB_PATH = path.join(__dirname, 'game.db');

const db = createClient({ url: `file:${DB_PATH}` });

async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      level1_score INTEGER DEFAULT 0,
      level2_score INTEGER DEFAULT 0,
      level3_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      level1_completed INTEGER DEFAULT 0,
      level2_completed INTEGER DEFAULT 0,
      level3_completed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      total_time INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'medium',
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

module.exports = { db, initDb };
