// dbHandler.js - PERBAIKAN PENTING: Penambahan Mutex untuk mengatasi SQLITE_BUSY

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger'); // Pastikan path logger benar
const { Mutex } = require('async-mutex'); // Import Mutex

const DB_PATH = process.env.DATABASE_URL || './database/data.db';
const db = new sqlite3.Database(DB_PATH);
const dbMutex = new Mutex(); // Inisialisasi Mutex baru

// Fungsi helper untuk menjalankan query dalam Mutex
async function runQuery(queryFunction) {
    const release = await dbMutex.acquire(); // Tunggu sampai Mutex tersedia
    try {
        const result = await queryFunction();
        return result;
    } finally {
        release(); // Lepaskan Mutex setelah query selesai (berhasil atau gagal)
    }
}

function getDatabase() {
    return db;
}

async function getPlayerByNickname(nickname) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM players WHERE nickname = ?`, [nickname], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    });
}

// Jalankan SQL dari migrations/init.sql
function initDatabase() {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            const initPath = path.join(__dirname, '..', 'database', 'migrations', 'init.sql');
            const schema = fs.readFileSync(initPath, 'utf-8');
            db.exec(schema, (err) => { // db.exec juga perlu di-mutex
                if (err) {
                    logger.error('Gagal inisialisasi database:', err);
                    reject(err);
                } else {
                    logger.info('✅ Database berhasil diinisialisasi!');
                    resolve();
                }
            });
        });
    });
}

// Ambil data server berdasarkan guild_id
function getServerById(guildId) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM servers WHERE guild_id = ?`, [guildId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    });
}

// Simpan server baru (saat bot join server)
function insertServer(guild) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR IGNORE INTO servers (guild_id, guild_name, owner_id)
                VALUES (?, ?, ?)
            `;
            const values = [guild.id, guild.name, guild.ownerId];
            db.run(query, values, function (err) {
                if (err) return reject(err);
                logger.info(`📥 Server baru dimasukkan: ${guild.name}`);
                resolve();
            });
        });
    });
}

// Ubah prefix custom untuk server
function updatePrefix(guildId, newPrefix) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            const query = `UPDATE servers SET prefix = ? WHERE guild_id = ?`;
            db.run(query, [newPrefix, guildId], function (err) {
                if (err) return reject(err);
                logger.info(`🔧 Prefix diubah untuk guild ${guildId}: ${newPrefix}`);
                resolve();
            });
        });
    });
}

async function getPlayer(userId) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM players WHERE user_id = ?`, [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    });
}

async function insertPlayer(player) {
    return runQuery(() => {
        const query = `
            INSERT INTO players (
                user_id, nickname, levelTitle, level, xp, money, class_id,
                companions, stats, inventory, equipped, activity, location, registered_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            player.user_id,
            player.nickname,
            player.levelTitle,
            player.level,
            player.xp,
            player.money,
            player.class_id,
            JSON.stringify(player.companions),
            JSON.stringify(player.stats),
            JSON.stringify(player.inventory),
            JSON.stringify(player.equipped),
            JSON.stringify(player.activity),
            player.location,
            player.registered_at
        ];
        return new Promise((resolve, reject) => {
            db.run(query, values, function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    });
}

// --- FUNGSI UNTUK TABEL 'users' ---

async function getUserById(userId) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users WHERE users_id = ?`, [userId], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    });
}

async function upsertUser(userId, dataToUpdate = {}) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            const insertColumns = ['users_id'];
            const insertValues = ['?'];
            const updateSet = [];
            const params = [userId];

            for (const key in dataToUpdate) {
                if (dataToUpdate.hasOwnProperty(key)) {
                    insertColumns.push(key);
                    insertValues.push('?');

                    if (typeof dataToUpdate[key] === 'object' && dataToUpdate[key] !== null && dataToUpdate[key].type === 'INCREMENT') {
                        params.push(dataToUpdate[key].value);
                        updateSet.push(`${key} = ${key} + EXCLUDED.${key}`);
                    } else {
                        params.push(dataToUpdate[key]);
                        updateSet.push(`${key} = EXCLUDED.${key}`);
                    }
                }
            }

            const finalQuery = `
                INSERT INTO users (${insertColumns.join(', ')})
                VALUES (${insertValues.join(', ')})
                ON CONFLICT(users_id) DO UPDATE SET
                    ${updateSet.length > 0 ? updateSet.join(', ') : 'users_id = users_id'}
            `;

            db.run(finalQuery, params, function(err) {
                if (err) {
                    console.error("Error in upsertUser SQL:", finalQuery, "with values:", params);
                    return reject(err);
                }
                resolve(this.changes);
            });
        });
    });
}

async function updateUserCallBot(userId, increment = 1) {
    return upsertUser(userId, { call_bot: { type: 'INCREMENT', value: increment } });
}


module.exports = {
    db, // Tetap ekspor instance db
    runQuery, // Penting: Ekspor runQuery agar bisa digunakan di handler lain
    getDatabase, // Ini bisa dihapus jika tidak lagi diperlukan di luar
    getPlayer,
    getPlayerByNickname,
    initDatabase,
    getServerById,
    insertServer,
    updatePrefix,
    insertPlayer,

    getUserById,
    upsertUser,
    updateUserCallBot,
};