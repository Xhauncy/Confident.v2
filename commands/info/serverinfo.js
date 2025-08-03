const { EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: 'serverinfo',
    description: 'Melihat info server.',
    category: 'info',
    aliases: ['si', 'serverdesc', 'server', 'Guild'],
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5,

    async executeMessage(message, args, client) {
        // Hapus pesan user jika bisa
        if (message.deletable) message.delete();

        const guild = message.guild;
        const owner = await guild.fetchOwner();
        const memberCount = guild.memberCount;
        const botCount = guild.members.cache.filter(m => m.user.bot).size;
        const userCount = memberCount - botCount;

        const ava = await client.users.fetch('652687924894367754');

        const embed = new EmbedBuilder()
            .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
            .setFooter({ text: `${ava.tag} | Owner`, iconURL: ava.displayAvatarURL() })
            .setColor('#ff0858')
            .setThumbnail(guild.iconURL())
            .setDescription(
                `> 👑 | **Owner:** ${owner.user}\n` +
                `> 🌐 | **Locale:** ${guild.preferredLocale}\n` +
                `> 📡 | **Channels:** ${guild.channels.cache.size}\n` +
                `> 📕 | **Members:** ${memberCount}\n` +
                `> 📗 | **Users:** ${userCount}\n` +
                `> 📘 | **Bots:** ${botCount}\n` +
                `> 🗓️ | **Created At:** ${moment(guild.createdTimestamp).format('MMMM Do YYYY')}`
            )
            .setTimestamp();

        message.channel.send({ embeds: [embed] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 10000);
        });
    }
};
