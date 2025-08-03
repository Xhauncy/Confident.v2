const db = require('../../handlers/dbHandler');
const defaultPrefix = process.env.PREFIX || '!';
const { EmbedBuilder, PermissionsBitField } = require('discord.js'); // Tambahkan PermissionsBitField
const fs = require('node:fs');
const path = require('node:path');

// --- Global Cooldowns & Active Commands Maps ---
const cooldowns = new Map();
const activeCommands = new Map();

// --- Spam Detection Maps ---
const userSpamAttempts = new Map();
const spamResetTimers = new Map();

// --- Konfigurasi Spam ---
const SPAM_THRESHOLD = 4;
const SPAM_INTERVAL = 8000;

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
    //console.log('Successfully loaded Helper and Support IDs.');
} catch (err) {
    //console.error('Error loading usersID.json:', err);
}


module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const userId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();

        // --- Fungsi Helper untuk Cek & Kirim Pesan Error Permission ---
        // Fungsi ini akan dipakai berkali-kali, jadi kita buat di sini.
        // Akan mengembalikan true jika error permission terjadi dan ditangani.
        const handlePermissionError = async (requiredPermission, actionDescription) => {
            const botPermissions = message.channel.permissionsFor(client.user);
            if (!botPermissions.has(PermissionsBitField.Flags[requiredPermission])) {
                try {
                    // Coba kirim pesan error tanpa embed sebagai fallback
                    await message.channel.send(`❌ Maaf, saya tidak punya izin \`${requiredPermission}\` di channel ini untuk ${actionDescription}.`);
                } catch (sendError) {
                    console.error(`Gagal mengirim pesan error permission di channel ${message.channel.name} (${message.channel.id}):`, sendError);
                }
                return true; // Menandakan error permission telah ditangani
            }
            return false; // Menandakan bot memiliki permission
        };
        // --- End Fungsi Helper ---

        try {
            let userData = await db.getUserById(userId);
            if (!userData) {
                await db.upsertUser(userId, {});
            }
        } catch (err) {
            console.error(`Gagal mengambil/membuat data user untuk ${userId}:`, err);
        }

        // --- Deteksi Spam ---
        const messageContent = message.content.toLowerCase().trim();
        let spamInfo = userSpamAttempts.get(userId);
        if (!spamInfo) {
            spamInfo = { count: 0, lastMessageContent: '', lastMessageTime: 0, spamDetected: false };
            userSpamAttempts.set(userId, spamInfo);
        }

        if (messageContent === spamInfo.lastMessageContent && (now - spamInfo.lastMessageTime) < SPAM_INTERVAL) {
            spamInfo.count++;
        } else {
            spamInfo.count = 1;
        }

        spamInfo.lastMessageContent = messageContent;
        spamInfo.lastMessageTime = now;

        if (spamResetTimers.has(userId)) {
            clearTimeout(spamResetTimers.get(userId));
        }
        spamResetTimers.set(userId, setTimeout(() => {
            userSpamAttempts.delete(userId);
            spamResetTimers.delete(userId);
        }, SPAM_INTERVAL + 500));

        if (spamInfo.count >= SPAM_THRESHOLD && !spamInfo.spamDetected) {
            spamInfo.spamDetected = true;
            // Cek permission untuk mengirim embed peringatan spam
            if (await handlePermissionError('EmbedLinks', 'mengirim peringatan spam (Embed)')) return;

            const embed = new EmbedBuilder()
                .setDescription(`🚨 ${message.author.tag} terdeteksi spamming! Harap kurangi kecepatan pesan Anda.`)
                .setColor('Orange');
            const spamReply = await message.reply({ embeds: [embed] }).catch(err => {
                console.error('Gagal mengirim spam warning embed:', err);
                return null; // Handle potential failure to send the embed
            });

            if (spamReply) {
                setTimeout(() => {
                    spamReply.delete().catch(() => {});
                }, 5000);
            }
            return;
        } else if (spamInfo.spamDetected) {
            return;
        }

        // --- Lanjutkan proses command ---
        let prefix = defaultPrefix;
        try {
            const result = await db.getServerById(guildId);
            if (result?.prefix) prefix = result.prefix;
        } catch (err) {
            console.error('Gagal mengambil prefix dari DB:', err);
        }

        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName)
            || client.commands.find(cmd => cmd.aliases?.includes(commandName));

        if (!command || typeof command.executeMessage !== 'function') {
            return;
        }

        // ==== 🔐 Cek Akses & Cooldown Duluan ====
        const sendAccessDeniedEmbed = async (reason) => {
            // Cek permission untuk mengirim embed
            if (await handlePermissionError('EmbedLinks', 'memberi tahu akses ditolak (Embed)')) {
                // Jika tidak bisa kirim embed, coba kirim teks biasa dan return
                await message.channel.send(`❌ Akses ditolak: ${reason}`);
                return;
            }

            const embed = new EmbedBuilder().setDescription(`❌ ${reason}`).setColor('#ff000d');
            const reply = await message.reply({ embeds: [embed] }).catch(err => {
                console.error('Gagal mengirim access denied embed:', err);
                return null;
            });

            if (reply) {
                setTimeout(() => {
                    // Pastikan bot punya permission untuk menghapus pesan author
                    // (ManageMessages untuk pesan orang lain, SendMessages jika hanya pesan bot)
                    // Jika reply dihapus, tidak perlu hapus pesan author lagi di sini
                    reply.delete().catch(() => {});
                }, 5000);
            }

            // Coba hapus pesan author jika bot punya permission
            if (message.guild && message.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ManageMessages)) {
                message.delete().catch(() => {});
            }
        };

        if (command.ownerOnly && userId !== process.env.DEVELOPER_ID) {
            await sendAccessDeniedEmbed('Cuma owner aja yang bisa pakai ini.');
            return;
        }

        if (command.adminOnly && !message.member.permissions.has('Administrator')) {
            await sendAccessDeniedEmbed('Cuma administrator server aja yang bisa pakai ini.');
            return;
        }

        if (command.helper && !Object.values(allowedUserIDs.Helper).includes(userId)) {
            await sendAccessDeniedEmbed('Kamu bukan Helper bot ini.');
            return;
        }

        if (command.support && !Object.values(allowedUserIDs.Support).includes(userId)) {
            await sendAccessDeniedEmbed('Kamu bukan Support bot ini.');
            return;
        }

        // --- Cooldown Check ---
        const commandKey = `${command.name}-${userId}`;

        if (command.cooldown) {
            const cooldownAmount = command.cooldown * 1000;

            if (cooldowns.has(commandKey)) {
                const expirationTime = cooldowns.get(commandKey) + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000;
                    let timeLeftFormatted;

                    if (timeLeft >= 60) {
                        const minutes = Math.floor(timeLeft / 60);
                        const seconds = Math.floor(timeLeft % 60);
                        timeLeftFormatted = `${minutes} menit ${seconds} detik`;
                    } else if (timeLeft >= 1) {
                        timeLeftFormatted = `${timeLeft.toFixed(1)} detik`;
                    } else {
                        timeLeftFormatted = `kurang dari 1 detik`;
                    }

                    // Cek permission untuk mengirim embed cooldown
                    if (await handlePermissionError('EmbedLinks', 'mengirim pesan cooldown (Embed)')) return;

                    const cooldownMsg = command.cooldownMessage
                        ? command.cooldownMessage.replace('{TIME_LEFT}', timeLeftFormatted)
                        : `Harap tunggu **${timeLeftFormatted}** sebelum menggunakan \`${command.name}\` lagi.`;

                    const embed = new EmbedBuilder()
                        .setDescription(`⏳ ${cooldownMsg}`)
                        .setColor('#FFA500');

                    const reply = await message.reply({ embeds: [embed] }).catch(err => {
                        console.error('Gagal mengirim cooldown embed:', err);
                        return null;
                    });

                    if (reply) {
                        setTimeout(() => {
                            reply.delete().catch(() => { });
                        }, 5000);
                    }

                    // Coba hapus pesan author jika bot punya permission
                    if (message.guild && message.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ManageMessages)) {
                        message.delete().catch(() => {});
                    }
                    return;
                }
            }
        }
        // --- End Cooldown Check ---

        // --- Repeatable Check ---
        if (!command.repeatable && activeCommands.has(commandKey)) {
            // Cek permission untuk mengirim embed warning repeatable
            if (await handlePermissionError('EmbedLinks', 'mengirim peringatan command sedang berjalan (Embed)')) return;

            const embed = new EmbedBuilder()
                .setDescription(`⚠️ Command \`${command.name}\` sedang berjalan. Harap tunggu hingga selesai.`)
                .setColor('#FF4500');

            const reply = await message.reply({ embeds: [embed] }).catch(err => {
                console.error('Gagal mengirim repeatable warning embed:', err);
                return null;
            });

            if (reply) {
                setTimeout(() => {
                    reply.delete().catch(() => { });
                }, 5000);
            }

            // Coba hapus pesan author jika bot punya permission
            if (message.guild && message.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ManageMessages)) {
                message.delete().catch(() => {});
            }
            return;
        }

        activeCommands.set(commandKey, true);


        // ==== ✅ Jalankan Command & Update Counters ====
        try {
            // Saat menjalankan command.executeMessage, command itu sendiri yang bertanggung jawab
            // untuk cek permission spesifik (misal: "char" command untuk edit pesan)
            await command.executeMessage(message, args, client);

            // --- Update call_bot counter ---
            await db.updateUserCallBot(userId, 1);

            // --- Atur ulang Cooldown ---
            if (command.cooldown) {
                const cooldownAmount = command.cooldown * 1000;
                cooldowns.set(commandKey, now);
                setTimeout(() => cooldowns.delete(commandKey), cooldownAmount);
            }
            activeCommands.delete(commandKey);

        } catch (err) {
            console.error(`Error saat menjalankan command ${commandName} oleh ${message.author.tag}:`, err);
            // Cek permission untuk mengirim embed error
            if (await handlePermissionError('EmbedLinks', 'memberitahu error (Embed)')) {
                // Jika tidak bisa kirim embed, coba kirim teks biasa
                await message.channel.send(`❌ Terjadi error saat menjalankan command \`${commandName}\`.`);
            } else {
                const embed = new EmbedBuilder().setDescription('❌ Terjadi error saat menjalankan command.').setColor('#ff000d')
                const reply = await message.reply({ embeds: [embed] }).catch(sendErr => {
                    console.error('Gagal mengirim error embed setelah command crash:', sendErr);
                    return null;
                });
                if (reply) {
                    setTimeout(() => {
                        reply.delete().catch(() => { });
                    }, 5000);
                }
            }
            activeCommands.delete(commandKey);
            // Coba hapus pesan author jika bot punya permission
            if (message.guild && message.channel.permissionsFor(client.user).has(PermissionsBitField.Flags.ManageMessages)) {
                message.delete().catch(() => {});
            }
            return;
        }
    }
};