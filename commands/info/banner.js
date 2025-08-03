// commands/avatar/banner.js

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'banner',
    aliases: [],
    category: 'info',
    description: 'melihat banner',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5, 

    description: 'Tampilkan banner profil Discord milikmu atau orang lain.',
    async executeMessage(message, args, client) {
        const user = message.mentions.users.first() || message.author;

        try {
            const userProfile = await client.users.fetch(user.id, { force: true });
            const banner = userProfile.banner;

            if (!banner) {
                return message.reply('❌ User ini tidak memiliki banner profil.');
            }

            const bannerURL = banner.startsWith('a_') ?
                `https://cdn.discordapp.com/banners/${user.id}/${banner}.gif?size=512` :
                `https://cdn.discordapp.com/banners/${user.id}/${banner}.png?size=512`;

            const embed = new EmbedBuilder()
                .setTitle(`🖼️ Banner milik ${user.username}`)
                .setImage(bannerURL)
                .setColor('Random')
                .setFooter({ text: `Diminta oleh ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            return message.reply('❌ Gagal mengambil banner. Mungkin user ini tidak bisa di-fetch atau banner-nya private.');
        }
    }
};
