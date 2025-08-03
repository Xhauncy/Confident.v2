const cooldowns = new Map();

/**
 * Mengecek dan menetapkan cooldown untuk user per command
 * @param {string} userId - ID user
 * @param {string} commandName - Nama command (misal: 'daily')
 * @param {number} cooldownTime - Waktu cooldown dalam milidetik
 * @returns {string|null} - Jika masih cooldown, kembalikan pesan sisa waktu; jika tidak, null
 */
function checkCooldown(userId, commandName, cooldownTime) {
  const key = `${userId}_${commandName}`;
  const now = Date.now();

  if (cooldowns.has(key)) {
    const expiration = cooldowns.get(key);
    if (now < expiration) {
      const remaining = expiration - now;
      const seconds = Math.ceil(remaining / 1000);
      return `⏳ Tunggu ${seconds} detik lagi sebelum menggunakan \`${commandName}\` lagi.`;
    }
  }

  cooldowns.set(key, now + cooldownTime);
  setTimeout(() => cooldowns.delete(key), cooldownTime);
  return null;
}

module.exports = {
  checkCooldown
};
