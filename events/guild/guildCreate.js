const { insertServer } = require('../../handlers/dbHandler');

module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    try {
      await insertServer(guild);
      console.log(`✅ Joined new guild: ${guild.name}`);
    } catch (err) {
      console.error(`❌ Gagal insert guild ${guild.id} ke DB:`, err);
    }
  }
};
