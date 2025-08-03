// commands/avatar/profilepic.js

const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    aliases: ['ava', 'pp'],
    category: 'info',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5, 
    description: 'Tampilkan gambar profil (avatar) milikmu atau orang lain.',

    async executeMessage(message, args, client) {
        const user = message.mentions.users.first() || message.author;

        const avatarURL = user.displayAvatarURL({ size: 1024, dynamic: true });

        const embed = new EmbedBuilder()
            .setTitle(`🖼️ Avatar milik ${user.username}`)
            .setImage(avatarURL)
            .setColor('Random')
            .setFooter({ text: `Diminta oleh ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};