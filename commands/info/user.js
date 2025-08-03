const { EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    name: 'userinfo',
    description: 'Melihat info user.',
    usage: '!userinfo (@mention)',
    category: 'info',
    owner: false,
    admin: false,
    helper: false,
    aliases: ['ui', 'user'],

    async executeMessage(message, args, client) {
        // Hapus pesan user (jika bot punya permission)
        if (message.deletable) message.delete();

        // Cari member dari mention, ID, atau default ke author
        const member = message.mentions.members.first()
            || message.guild.members.cache.get(args[0])
            || message.member;

        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => `<@&${role.id}>`)
            .join(' ・ ') || 'Tidak ada peran lain';

        const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
            .setColor('#ff0858')
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(
                `> **👑 | Username:** ${member}\n` +
                `> **👓 | Discriminator:** ${member.user.discriminator}\n` +
                `> **🆔 | ID:** ${member.id}\n` +
                `> **📥 | Join Server:** ${moment(member.joinedAt).format('DD-MM-YYYY')}\n` +
                `> **📅 | Akun Dibuat:** ${moment(member.user.createdAt).format('DD-MM-YYYY')}\n\n` +
                `⫷▬▬▬⧼・**| Roles |**・⧽▬▬▬⫸\n` +
                `> ${roles}`
            )
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 20000);
        });
    }
};
