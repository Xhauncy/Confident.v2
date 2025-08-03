const { EmbedBuilder } = require('discord.js');
const { aliases } = require('./dice');

module.exports = {
    name: 'hol',
    aliases: [],
    description: 'Menampilkan angka acak dalam rentang yang diberikan.',
    category: 'fun',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 8,

    async executeMessage(message, args, client) {
        const rangePattern = /^(\d+)-(\d+)$/;
        const rangeMatch = args[0]?.match(rangePattern);

        if (!rangeMatch) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Format Salah')
                .setDescription('Gunakan format seperti `!hol 1-100`.')
                .setTimestamp()
                .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

            return message.reply({ embeds: [errorEmbed] });
        }

        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);

        if (min >= max) {
            const invalidRangeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Rentang Tidak Valid')
                .setDescription('Angka pertama harus lebih kecil dari angka kedua.')
                .setTimestamp()
                .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

            return message.reply({ embeds: [invalidRangeEmbed] });
        }

        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        const resultEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎲 Angka Acak')
            .setDescription(`Angka acak antara **${min}** dan **${max}** adalah: **${randomNumber}**`)
            .setTimestamp()
            .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

        return message.reply({ embeds: [resultEmbed] });
    }
};
