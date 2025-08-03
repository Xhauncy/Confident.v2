const fs = require('fs');
const path = require('path');
const db = require('../handlers/dbHandler');
const logger = require('../utils/logger');

async function importMobs() {
  const mobsPath = path.join(__dirname, '..', 'assets', 'mobs.json');
  const data = JSON.parse(fs.readFileSync(mobsPath, 'utf-8'));

  for (const mob of data) {
    await db.upsertMob(mob);
    logger.info(`🔁 Mob "${mob.name}" (${mob.id}) diimpor/diupdate.`);
  }
}

module.exports = { importMobs };
