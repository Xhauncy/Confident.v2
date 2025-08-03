const { EmbedBuilder } = require('discord.js');
const db = require('../../handlers/dbHandler');
const defaultPrefix = process.env.PREFIX || '!';
const developerId = process.env.DEVELOPER_ID;
const fs = require('node:fs');
const path = require('node:path');

// --- Load allowed user IDs from usersID.json ---
let allowedUserIDs = {
    Helper: {},
    Support: {}
};
try {
    const usersIDPath = path.resolve(__dirname, '../../assets/usersID.json');
    const usersIDRaw = fs.readFileSync(usersIDPath, 'utf8');
    const usersIDData = JSON.parse(usersIDRaw);
    if (usersIDData && usersIDData.length > 0) {
        if (usersIDData[0].Helper) {
            allowedUserIDs.Helper = usersIDData[0].Helper;
        }
        if (usersIDData[0].Support) {
            allowedUserIDs.Support = usersIDData[0].Support;
        }
    }
} catch (err) {
    console.error('Error loading usersID.json for help command:', err);
    // Lanjutkan dengan allowedUserIDs kosong jika error
}

async function getPrefix(guildId) {
    try {
        const result = await db.getServerById(guildId);
        return result?.prefix || defaultPrefix;
    } catch (err) {
        console.error('Gagal mengambil prefix dari DB:', err);
        return defaultPrefix;
    }
}

module.exports = {
    name: 'help',
    description: 'Menampilkan daftar semua command atau detail sebuah command.',
    category: 'info',
    aliases: [],
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false, // Command help tidak disembunyikan secara default
    cooldown: 5,

    async executeMessage(message, args, client) {
        const prefix = await getPrefix(message.guild.id);
        const userId = message.author.id;
        const isAdmin = message.member.permissions.has('Administrator');
        const isOwner = userId === developerId;
        const isHelper = Object.values(allowedUserIDs.Helper).includes(userId);
        const isSupport = Object.values(allowedUserIDs.Support).includes(userId);

        // --- Fungsi Helper untuk Cek Akses Command ---
        const hasAccess = (command) => {
            if (command.ownerOnly && !isOwner) return false;
            if (command.adminOnly && !isAdmin) return false;
            if (command.helper && !isHelper) return false;
            if (command.support && !isSupport) return false;
            return true;
        };

        // Jika ada argumen (help untuk command tertentu)
        if (args.length) {
            const input = args[0].toLowerCase();
            const command = client.commands.get(input) ||
                client.commands.find(cmd => cmd.aliases?.includes(input));

            // Jika command tidak ditemukan ATAU command disembunyikan DAN bukan developer
            if (!command || (command.hide && !isOwner) || !hasAccess(command)) {
                return message.reply(`❌ Command \`${input}\` tidak ditemukan atau tidak dapat diakses.`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`📘 Help: ${command.name}`)
                .setColor('#57b6ff')
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: 'Nama', value: command.name, inline: true },
                    { name: 'Alias', value: command.aliases?.length ? command.aliases.join(', ') : 'Tidak ada', inline: true },
                    { name: 'Kategori', value: command.category || 'Lain-lain', inline: true },
                    { name: 'Prefix', value: `Gunakan: \`${prefix}${command.name}\``, inline: true },
                    { name: 'Cooldown', value: `${command.cooldown || 0} detik`, inline: true },
                    { name: 'Deskripsi', value: command.description || 'Tidak ada deskripsi', inline: false },
                    // Menambahkan detail akses
                    { name: 'Akses Khusus',
                      value: `Owner: ${command.ownerOnly ? '✅' : '❌'}\n` +
                             `Admin: ${command.adminOnly ? '✅' : '❌'}\n` +
                             `Helper: ${command.helper ? '✅' : '❌'}\n` +
                             `Support: ${command.support ? '✅' : '❌'}`,
                      inline: false
                    },                  
                    //{ name: 'Dapat Diulang', value: command.repeatable ? 'Ya' : 'Tidak', inline: true }
                );

            if (command.usage) {
                embed.addFields({ name: 'Penggunaan', value: `${prefix}${command.name} ${command.usage}`, inline: false });
            }
            if (command.example) {
                embed.addFields({ name: 'Contoh', value: `${prefix}${command.example}`, inline: false });
            }

            return message.reply({ embeds: [embed] });
        }

        // Jika tidak ada argumen, tampilkan semua command (grouped)
        const groupedCommands = {};

        for (const [_, command] of client.commands) {
            // Filter command:
            // 1. Abaikan command ini sendiri (help command)
            if (command.name === 'help') continue;

            // 2. Abaikan command yang disembunyikan (hide: true) kecuali untuk owner bot
            if (command.hide && !isOwner) continue;

            // 3. Abaikan command yang tidak bisa diakses oleh user saat ini
            if (!hasAccess(command)) continue;

            const cat = command.category?.toUpperCase() || 'LAIN-LAIN'; // Default category
            if (!groupedCommands[cat]) groupedCommands[cat] = new Set();
            groupedCommands[cat].add(`${command.name}`);
        }

        const embed = new EmbedBuilder()
            .setTitle('📚 Daftar Command')
            .setDescription(`Gunakan \`${prefix}help [nama_command]\` untuk melihat detail command.\n\n` +
                            `Command yang Anda lihat disesuaikan dengan izin Anda.`)
            .setColor('#57b6ff')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 })); // Set avatar bot sebagai thumbnail

        // Tambahkan banner bot jika ada
        const botBanner = client.user.bannerURL({ dynamic: true, size: 1024 });
        if (botBanner) {
            embed.setImage(botBanner); // Set banner bot sebagai gambar utama
        }

        // Urutkan kategori secara alfabetis
        const sortedCategories = Object.keys(groupedCommands).sort();

        for (const category of sortedCategories) {
            const commandsInCat = Array.from(groupedCommands[category]).sort().join(' | '); // Urutkan command di dalam kategori
            embed.addFields({
                name: `📂 ${category}`,
                value: commandsInCat,
                inline: false
            });
        }

        // Jika tidak ada command yang ditampilkan (misal: semua hidden atau tidak punya akses)
        if (Object.keys(groupedCommands).length === 0) {
            embed.setDescription('Tidak ada command yang tersedia untuk Anda saat ini.');
        }

        // Tambahkan footer bot
        embed.setFooter({
            text: `Dibuat oleh ${client.user.username} | Prefix: ${prefix}`,
            iconURL: client.user.displayAvatarURL({ dynamic: true })
        });


        return message.reply({ embeds: [embed] });
    }
};