// handlers/dbToramHandler.js
const { Mutex } = require('async-mutex'); // Perlu diimpor lagi jika runQuery tidak diekspor
const db = require('./dbHandler').db; // Mengimpor instance db yang sudah ada
const runQuery = require('./dbHandler').runQuery; // Mengimpor fungsi runQuery

// Pastikan Anda mengimpor db dan runQuery dari dbHandler.js dengan benar.
// Jika dbHandler.js hanya mengekspor runQuery dan db secara terpisah,
// maka impor di atas sudah benar.

/**
 * Menyisipkan atau mengganti kode Toram.
 * @param {object} codeData - Objek yang berisi data kode Toram.
 * @returns {Promise<void>}
 */
async function upsertToramCode(codeData) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT OR REPLACE INTO toram_codes (code, category, status, level, last_update)
                VALUES (?, ?, ?, ?, ?)`,
                [codeData.code, codeData.category, codeData.status, codeData.level, codeData.last_update],
                function (err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    });
}

/**
 * Mendapatkan seluruh daftar kategori buff yang unik.
 * @returns {Promise<string[]>} Array of unique category names.
 */
async function getAllBuffs() {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.all(`SELECT DISTINCT category FROM toram_codes`, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map(row => row.category));
            });
        });
    });
}

/**
 * Mendapatkan daftar buff berdasarkan kategori.
 * Hanya mengembalikan buff dengan status 'online', diurutkan berdasarkan level secara menurun.
 * @param {string} category - Kategori buff yang dicari.
 * @returns {Promise<object[]>} Array of buff objects.
 */
async function getBuffByCategory(category) {
    return runQuery(() => {
        return new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM toram_codes WHERE LOWER(category) = LOWER(?)
                AND LOWER(status) = 'online'
                ORDER BY level DESC;`,
                [category],
                (err, rows) => {
                    if (err) return reject(err);
                    resolve(rows);
                }
            );
        });
    });
}

module.exports = {
    upsertToramCode,
    getAllBuffs,
    getBuffByCategory,
};