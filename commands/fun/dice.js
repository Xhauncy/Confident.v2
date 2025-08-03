const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'dice',
    aliases: ['dadu', 'roll'],
    description: 'Memutar dadu',
    category: 'fun',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5, 

    async executeMessage(message, args, client) {
        const loadingEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎲 Dadu Sedang Diputar...')
            .setDescription('Mencoba keberuntunganmu...')
            .setTimestamp();

        const replyMessage = await message.reply({ embeds: [loadingEmbed] });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const diceRoll = Math.floor(Math.random() * 6) + 1;

        const resultEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎲 Hasil Lemparan Dadu!')
            .setDescription(`Dadu berhenti di angka: **${diceRoll}**!`)
            .setTimestamp();

        return replyMessage.edit({ embeds: [resultEmbed] });
    }
};