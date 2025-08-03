const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function loadEvents(client) {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventTypes = fs.readdirSync(eventsPath); // client/, guild/, message/

  for (const type of eventTypes) {
    const typePath = path.join(eventsPath, type);
    const files = fs.readdirSync(typePath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(typePath, file);
      const event = require(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }

      logger.info(`📡 Loaded event: ${event.name} (${type}/${file})`);
    }
  }
}

module.exports = { loadEvents };
