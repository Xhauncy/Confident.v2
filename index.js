require('dotenv').config(); // Load .env
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadEvents } = require('./handlers/eventHandler');
const { loadCommands } = require('./handlers/commandHandler');
const { initDatabase } = require('./handlers/dbHandler');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// Inisialisasi koleksi command
client.commands = new Collection();
client.cooldowns = new Collection(); // Untuk sistem cooldown

// Jalankan fungsi saat bot siap
(async () => {
  try {
    // Koneksi database
    await initDatabase();

    // Load semua command & event
    await loadCommands(client);
    await loadEvents(client);

    // Login ke Discord
    await client.login(process.env.DISCORD_TOKEN);

    logger.info('Bot berhasil dijalankan!');
  } catch (err) {
    logger.error('Gagal menjalankan bot:', err);
  }
})();