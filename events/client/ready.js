const { insertServer, getServerById } = require('../../handlers/dbHandler');
const logger = require('../../utils/logger');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    logger.info(`🤖 Bot siap sebagai ${client.user.tag}`);
    logger.info(`🌐 Bergabung di ${client.guilds.cache.size} guild.`);

    // Auto Sync semua guild ke DB
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const exists = await getServerById(guildId);
        if (!exists) {
          await insertServer(guild);
          logger.info(`📥 Guild ${guild.name} dimasukkan ke DB (via ready).`);
        }
      } catch (err) {
        logger.error(`❌ Gagal sync guild ${guildId} saat ready:`, err);
      }
    }

    logger.info('✅ Semua guild sudah disinkronkan dengan database.');
  }
};
