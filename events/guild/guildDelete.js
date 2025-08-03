const { db } = require('../../handlers/dbHandler');

module.exports = {
  name: 'guildDelete',
  async execute(guild, client) {
    db.run(`DELETE FROM servers WHERE guild_id = ?`, [guild.id], (err) => {
      if (err) {
        console.error(`❌ Gagal hapus guild ${guild.id} dari DB:`, err);
      } else {
        console.log(`📤 Keluar dari guild dan hapus dari DB: ${guild.name}`);
      }
    });
  }
};
