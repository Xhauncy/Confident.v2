const { getServerById, insertServer } = require('../../handlers/dbHandler');
const { db } = require('../../handlers/dbHandler');
const logger = require('../../utils/logger');

module.exports = {
  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    try {
      // Cek apakah guild sudah ada di DB
      const existing = await getServerById(newGuild.id);

      if (!existing) {
        // Guild belum ada → insert baru
        await insertServer(newGuild);
        logger.info(`📥 Guild ${newGuild.name} ditambahkan ke database (via guildUpdate).`);
        return;
      }

      // Kalau sudah ada, cek apakah nama/owner berubah
      const updates = [];
      const params = [];

      if (existing.guild_name !== newGuild.name) {
        updates.push(`guild_name = ?`);
        params.push(newGuild.name);
      }

      if (existing.owner_id !== newGuild.ownerId) {
        updates.push(`owner_id = ?`);
        params.push(newGuild.ownerId);
      }

      if (updates.length === 0) return; // Tidak ada perubahan

      const sql = `UPDATE servers SET ${updates.join(', ')} WHERE guild_id = ?`;
      params.push(newGuild.id);

      db.run(sql, params, (err) => {
        if (err) return logger.error('Gagal update data guild:', err);
        logger.info(`🛠️ Server ${newGuild.id} diperbarui di DB (nama/owner).`);
      });

    } catch (err) {
      logger.error('❌ Error saat sinkronisasi guild (guildUpdate):', err);
    }
  }
};
