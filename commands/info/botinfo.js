const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'botinfo',
    category: 'info',
    description: 'Menampilkan informasi tentang bot ini.',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5, 

    async executeMessage(message, args, client) {
        const ownerTag = '<@652687924894367754>'; // Ganti dengan ID pemilik bot, misalnya: <@123456789012345678>
        const createdAt = `<t:${Math.floor(client.user.createdTimestamp / 1000)}:F>`; // Tanggal pembuatan bot
        const totalGuilds = client.guilds.cache.size;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🤖 Informasi Bot')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: '👤 Nama Bot', value: client.user.username, inline: true },
                { name: '🆔 ID Bot', value: client.user.id, inline: true },
                { name: '📅 Dibuat Pada', value: createdAt, inline: false },
                { name: '🌐 Total Server', value: totalGuilds.toString(), inline: true },
                { name: '👨‍💻 Pembuat', value: ownerTag, inline: true }
            )
            .setFooter({ text: 'Confident • Bot Info', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};
