-- Tabel server untuk menyimpan prefix custom per guild
CREATE TABLE IF NOT EXISTS servers (
  guild_id TEXT PRIMARY KEY,
  guild_name TEXT,
  owner_id TEXT,
  prefix TEXT DEFAULT 'kak'
);

CREATE TABLE IF NOT EXISTS users (
  users_id TEXT PRIMARY KEY,
  call_bot INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS players (
    user_id TEXT NOT NULL PRIMARY KEY, -- user_id is now the sole primary key
    nickname TEXT UNIQUE NOT NULL,
    levelTitle TEXT DEFAULT 'Novice',
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    money INTEGER DEFAULT 0,
    class_id TEXT,
    companions TEXT DEFAULT '[]',
    stats TEXT DEFAULT '{}',
    inventory TEXT DEFAULT '[]',
    equipped TEXT DEFAULT '{}',
    activity TEXT DEFAULT '{}',
    location TEXT,
    registered_at INTEGER NOT NULL
);



CREATE TABLE IF NOT EXISTS toram_codes (
  code TEXT PRIMARY KEY,
  category TEXT, -- MP, HP, dll
  status TEXT,
  level TEXT,
  last_update TEXT
);
