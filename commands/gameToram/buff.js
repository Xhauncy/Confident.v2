const { EmbedBuilder } = require('discord.js');
const db = require('../../handlers/dbToramHandler');

module.exports = {
  name: 'buff',
  aliases: ['code', 'kode'],
  description: 'Menampilkan kode Buff Land dari Toram Online berdasarkan nama buff.',
  category: 'Toram',
  owner: false,
  admin: false,
  helper: false,
  support: false,
  repeatable: false,
  hide: false,
  cooldown: 5,
  async executeMessage(message, args, client) {
    const query = args[0]?.toLowerCase();

    // Jika tidak ada argumen: tampilkan daftar buff
    if (!query) {
      const categories = await db.getAllBuffs();
      const daftar = categories.map(c => `• \`${c}\``).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('📋 Cara Menggunakan Command !buff')
        .setColor('#ffcc00')
        .setDescription('Gunakan seperti: `!buff mp` atau `!buff tank` atau `!buff dte`')
        .addFields({ name: '✅ Buff Tersedia:', value: daftar })
        .setFooter({ text: 'Toram Online Buff Help', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    }

    // Buff khusus: dte
    const dteElements = ['neutral', 'light', 'dark', 'water', 'wind', 'fire', 'earth'];
    if (query === 'dte') {
      const embed = new EmbedBuilder()
        .setTitle('🌈 Buff: DTE Elemental')
        .setColor('#3399ff')
        .setDescription('Menampilkan satu kode tertinggi yang **Online** dari setiap elemen.');

      for (const element of dteElements) {
        const entries = await db.getBuffByCategory(element);
        if (!entries.length) continue;

        const top = entries[0];
        embed.addFields({
          name: `🔹 ${element}`,
          value: `\`${top.code}\` - Level ${top.level}, Last Update: ${top.last_update || '-'}`,
          inline: true
        });
      }

      return message.channel.send({ embeds: [embed] });
    }

    // Buff khusus: tank
    if (query === 'tank') {
      const keys = ['m.resist', 'p.resist', '+aggro', 'cr'];
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Buff Tank Setup')
        .setColor('#6666ff')
        .setDescription('Kode buff terbaik untuk kebutuhan tanking.');

      for (const key of keys) {
        const list = await db.getBuffByCategory(key);
        if (!list.length) continue;

        const top = list[0];
        embed.addFields({
          name: `🔹 ${key}`,
          value: `\`${top.code}\` - Level ${top.level}, Last Update: ${top.last_update || '-'}`,
          inline: true
        });
      }

      return message.channel.send({ embeds: [embed] });
    }

    // Buff khusus: farm
    if (query === 'farm') {
      const type = args[1]?.toLowerCase();
      let keys = [];

      if (type === 'p') keys = ['watk', 'mp', 'hp', 'atk', "cr"];
      else if (type === 'm') keys = ['int', 'watk', 'mp', 'hp', "cr"];
      else keys = ['mp', 'hp', 'watk'];

      const embed = new EmbedBuilder()
        .setTitle('🌾 Buff Farming Setup')
        .setColor('#33cc99')
        .setDescription('Buff terbaik untuk kebutuhan farming.');

      for (const key of keys) {
        const list = await db.getBuffByCategory(key);
        if (!list.length) continue;

        const top = list[0];
        embed.addFields({
          name: `🔹 ${key}`,
          value: `\`${top.code}\` - Level ${top.level}, Last Update: ${top.last_update || '-'}`,
          inline: true
        });
      }

      return message.channel.send({ embeds: [embed] });
    }

    // Normal search
    const buffList = await db.getBuffByCategory(query);
    if (!buffList.length) {
      return message.reply(`❌ Buff \`${query}\` tidak ditemukan atau tidak ada yang online.`);
    }

    const topLevel = buffList[0].level;
    const filtered = buffList.filter(b => b.level == topLevel);

    const embed = new EmbedBuilder()
      .setTitle(`🔮 Buff: ${query}`)
      .setColor('#00ff99')
      .setDescription(`Level tertinggi: **${topLevel}** (Status: Online)`)
      .addFields({
        name: '💡 Kode Buff',
        value: filtered.map(e =>
          `\`${e.code}\` - Last Update: ${e.last_update || '-'}`
        ).join('\n')
      })
      .setFooter({ text: 'Toram Online Buff Code', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  }
};
