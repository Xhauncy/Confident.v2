const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = require(filePath);

      // Cek apakah ada fungsi executeMessage (untuk command berbasis prefix)
      if (typeof command.executeMessage === 'function') {
        const commandName = command.name || file.replace('.js', '');
        client.commands.set(commandName, command);

        // Simpan aliases ke Map agar bisa dipanggil juga lewat alias
        if (Array.isArray(command.aliases)) {
          for (const alias of command.aliases) {
            client.commands.set(alias, command);
          }
        }

        logger.info(`✅ Loaded command: ${commandName} (${category}/${file})`);
      } else {
        logger.warn(`⚠️  Command tidak valid (tidak ada executeMessage): ${filePath}`);
      }
    }
  }
}

module.exports = { loadCommands };
