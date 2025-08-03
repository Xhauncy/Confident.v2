const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'uptime',
    aliases: 'up',
    description: 'Menampilkan sudah berapa lama bot aktif.',
    category: 'info',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5,

    executeMessage(message, args, client) {
        const totalSeconds = Math.floor(process.uptime());
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const uptimeString = `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`;

        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle('🕒 Uptime Bot')
            .setDescription(`Bot telah aktif selama:\n**${uptimeString}**`)
            .setTimestamp()
            .setFooter({ text: 'Uptime Info', iconURL: client.user.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    }
};
