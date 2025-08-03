const { updatePrefix } = require('../../handlers/dbHandler');

module.exports = {
  name: 'setprefix',
  aliases: ['prefix'],
  description: 'Mengubah prefix per server',
  category: 'moderator',
  owner: false,
  admin: true,
  helper: false,
  support: false,
  repeatable: false,
  hide: false,
  cooldown: 5,
  async executeMessage(message, args) {
    const newPrefix = args[0];
    if (!newPrefix) {
      return message.reply('⚠️ Harap masukkan prefix baru.\nContoh: `!setprefix $`');
    }

    if (newPrefix.length > 5) {
      return message.reply('❌ Prefix terlalu panjang (maks 5 karakter).');
    }

    try {
      await updatePrefix(message.guild.id, newPrefix);
      message.reply(`✅ Prefix berhasil diubah ke: \`${newPrefix}\``);
    } catch (err) {
      console.error(err);
      message.reply('❌ Gagal mengubah prefix.');
    }
  }
};