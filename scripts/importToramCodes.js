const fs = require('fs');
const path = require('path');
const db = require('../handlers/dbToramHandler');
const logger = require('../utils/logger');

async function importToramCodes() {
  const filePath = path.join(__dirname, '..', 'assets', 'toram-buffland-code.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const category of Object.keys(data)) {
    const group = data[category];

    if (group["Simple Code"]) {
      for (const [key, entry] of Object.entries(group["Simple Code"])) {
        await db.upsertToramCode({
          category,
          code: entry.Code,
          status: entry.Status,
          level: entry.Level,
          last_update: entry["Last Update"]
        });
        logger.info(`✅ ${category} Code ${entry.Code} diimpor/diupdate`);
      }
    }
  }
}

importToramCodes().then(() => {
  logger.info('🎉 Import selesai!');
}).catch(err => {
  logger.error('❌ Import gagal:', err);
});
