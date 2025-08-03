const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

// Path file prefix per guild
const prefixPath = path.join(__dirname, '../../utils/bot/guildPrefix.json');

// Fungsi untuk ambil semua ID helper dari config.Helper
function getAllHelperIDs(helperObject) {
    const ids = [];
    for (const category in helperObject) {
        for (const name in helperObject[category]) {
            ids.push(helperObject[category][name]);
        }
    }
    return ids;
}

module.exports = {
    name: 'help',
    description: 'Displays information about a specific command or all commands.',
    category: 'info',
    aliases: ['commands', 'cmd'],
    owner: false,
    admin: false,
    helper: false,

    async executeMessage(client, message, args) {
        // Ambil prefix per-guild
        let guildPrefixes = {};
        try {
            if (fs.existsSync(prefixPath)) {
                guildPrefixes = JSON.parse(fs.readFileSync(prefixPath, 'utf8'));
            }
        } catch (e) {
            console.warn('Gagal membaca prefix file, pakai default prefix.');
        }

        const prefix = guildPrefixes[message.guild?.id] || config.prefix;
        const { commands } = client;

        // ================= HELP UNTUK COMMAND TERTENTU =================
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const command = commands.get(commandName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

            if (!command) {
                return message.channel.send('❌ Command tidak ditemukan!');
            }

            const commandEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle(`📘 Command: \`${prefix}${command.name}\``)
                .setFooter({ text: `Gunakan ${prefix}<command> untuk mengeksekusi perintah.` })
                .setTimestamp()
                .setThumbnail(client.user.avatarURL());

            if (command.description) {
                commandEmbed.setDescription(command.description);
            }

            if (command.aliases && command.aliases.length > 0) {
                commandEmbed.addFields({ name: '📎 Aliases', value: command.aliases.map(a => `\`${prefix}${a}\``).join(', ') });
            }

            if (command.category) {
                commandEmbed.addFields({ name: '📂 Category', value: command.category });
            }

            if (command.owner || command.admin || command.helper) {
                let permissionText = 'Everyone';
                if (command.owner) permissionText = 'Owner only';
                else if (command.admin) permissionText = 'Admin only';
                else if (command.helper) permissionText = 'Helper only';

                commandEmbed.addFields({ name: '🔐 Permissions', value: permissionText });
            }

            if (command.usage) {
                commandEmbed.addFields({ name: '📝 Usage', value: `\`${prefix}${command.name} ${command.usage}\`` });
            }

            return message.channel.send({ embeds: [commandEmbed] });
        }

        // ================= HELP UMUM TANPA ARGUMEN =================
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('📚 Daftar Command Bot')
            .setDescription(`Gunakan \`${prefix}help [nama command]\` untuk informasi lebih lanjut.`)
            .setFooter({ text: `${prefix}<command>` })
            .setTimestamp()
            .setThumbnail(client.user.avatarURL());

        const categories = {};
        const ignoredCategories = ['owner', 'helper', 'event', 'lost ark', 'fun', 'toram', 'moderator'];
        const ignored2 = ignoredCategories && command.hide

        const isOwner = config.ownerID === message.author.id;
        const helperIDs = getAllHelperIDs(config.Helper);
        const isHelper = helperIDs.includes(message.author.id);

        commands.forEach(command => {
            if (!command.category || command.hide) return; // ⬅️ Tambahkan pengecekan "hide"

            if (!isOwner && !isHelper && ignored2.includes(command.category.toLowerCase())) return;

            if (!categories[command.category]) {
                categories[command.category] = [];
            }

            categories[command.category].push(command);
        });

        for (const [category, cmds] of Object.entries(categories)) {
            if (cmds.length > 0) {
                const commandList = cmds.map(cmd => `\`${prefix}${cmd.name}\``).join(' | ');
                helpEmbed.addFields({
                    name: `**${category.toUpperCase()}**`,
                    value: commandList,
                    inline: true
                });
            }
        }

        return message.channel.send({ embeds: [helpEmbed] });
    }
};
