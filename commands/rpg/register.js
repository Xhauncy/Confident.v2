const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../../handlers/dbHandler');
const classes = require('../../assets/classes.json'); // Make sure this path is correct

module.exports = {
    name: 'daftar',
    aliases: [],
    description: 'Mendaftar ke rpg',
    category: 'game',
    async executeMessage(message, args) {
        const userId = message.author.id;
        // const guildId = message.guild.id; // Removed as player is now global

        // Cek apakah sudah terdaftar (only by userId now)
        // IMPORTANT: db.getPlayer needs to be updated in dbHandler.js to only take userId
        const existing = await db.getPlayer(userId); // <--- Changed: Removed guildId
        if (existing && existing.nickname) {
            return message.reply('⚠️ Kamu sudah terdaftar!');
        }

        // --- Step 1: Nickname Input ---
        const askNickname = await message.reply('📝 Masukkan nickname karaktermu (min. 3 huruf, unik):');
        const filterMessages = m => m.author.id === userId;
        const collectedNickname = await message.channel.awaitMessages({ filter: filterMessages, max: 1, time: 30000 });

        if (!collectedNickname.size) {
            askNickname.delete().catch(() => {});
            return message.reply('⏰ Waktu habis! Registrasi dibatalkan.');
        }

        const nickname = collectedNickname.first().content.trim();
        collectedNickname.first().delete().catch(() => {});
        askNickname.delete().catch(() => {});

        if (!/^[a-zA-Z0-9_]{3,}$/.test(nickname)) {
            return message.reply('❌ Nickname harus minimal 3 huruf dan tanpa simbol aneh.');
        }

        const existingNick = await db.getPlayerByNickname(nickname);
        if (existingNick) {
            return message.reply('❌ Nickname sudah digunakan! Pilih yang lain.');
        }

        // --- Step 2: Location Selection ---
        const embedLocation = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle('🌍 Pilih Lokasi Awal')
            .setDescription('Pilih lokasi awal yang menentukan ras karaktermu:')
            .addFields(
                { name: '🔥 East', value: 'Human', inline: true },
                { name: '🌲 West', value: 'Elf', inline: true },
                { name: '❄️ North', value: 'Demon', inline: true },
                { name: '☠️ South', value: 'Undead', inline: true }
            );

        const rowLocation = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('east').setLabel('East').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('west').setLabel('West').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('north').setLabel('North').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('south').setLabel('South').setStyle(ButtonStyle.Primary)
        );

        const locationMsg = await message.channel.send({ embeds: [embedLocation], components: [rowLocation] });

        const collectorLocation = locationMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id === userId,
            time: 60000,
        });

        let selectedLocation = null;

        collectorLocation.on('collect', async i => {
            await i.deferUpdate();
            selectedLocation = i.customId;
            collectorLocation.stop(); // Stop location collector once selected
        });

        await new Promise(resolve => collectorLocation.on('end', () => resolve())); // Wait for collector to end

        if (!selectedLocation) {
            await locationMsg.edit({
                content: '⏰ Waktu habis! Pilihan lokasi dibatalkan.',
                embeds: [],
                components: []
            }).catch(() => {});
            return;
        }

        // Determine race based on location
        let raceName = '';
        switch (selectedLocation) {
            case 'east': raceName = 'Human'; break;
            case 'west': raceName = 'Elf'; break;
            case 'north': raceName = 'Demon'; break;
            case 'south': raceName = 'Undead'; break;
        }

        await locationMsg.edit({
            content: `Kamu memilih **${selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)}** sebagai lokasi awalmu! (Ras: ${raceName})`,
            embeds: [],
            components: []
        }).catch(() => {});

        // --- Step 3: Class Selection ---
        const embedClass = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('⚔️ Pilih Kelas Karaktermu')
            .setDescription('Setiap kelas memiliki statistik dasar yang unik. Pilih yang sesuai dengan gaya bermainmu!');

        const classRows = [];
        let currentRow = new ActionRowBuilder();
        classes.forEach((c, index) => {
            currentRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(c.id)
                    .setLabel(`${c.icon} ${c.name}`)
                    .setStyle(ButtonStyle.Secondary)
            );
            if (currentRow.components.length === 5 || index === classes.length - 1) {
                classRows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
            embedClass.addFields({
                name: `${c.icon} ${c.name}`,
                value: `${c.description}\n**Base Stats:**\n${Object.entries(c.base_stats).map(([stat, val]) => `• ${stat.toLowerCase()}: ${val}`).join('\n')}`,
                inline: true
            });
        });

        const classMsg = await message.channel.send({ embeds: [embedClass], components: classRows });

        const collectorClass = classMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id === userId,
            time: 60000,
        });

        let selectedClass = null;

        collectorClass.on('collect', async i => {
            await i.deferUpdate();
            selectedClass = classes.find(c => c.id === i.customId);
            collectorClass.stop(); // Stop class collector once selected
        });

        await new Promise(resolve => collectorClass.on('end', () => resolve())); // Wait for collector to end

        if (!selectedClass) {
            await classMsg.edit({
                content: '⏰ Waktu habis! Pilihan kelas dibatalkan.',
                embeds: [],
                components: []
            }).catch(() => {});
            return;
        }

        await classMsg.edit({
            content: `Kamu memilih kelas **${selectedClass.name}**!`,
            embeds: [],
            components: []
        }).catch(() => {});

        // --- Step 4: Final Registration and Database Insertion ---
        const playerStats = selectedClass.base_stats;
        const initialPlayer = {
            user_id: userId,
            // guild_id: guildId, // <--- Removed: No longer part of player data
            nickname: nickname,
            levelTitle: 'Novice',
            level: 1,
            xp: 0,
            money: 100,
            class_id: selectedClass.id, // Store the class ID
            companions: [],
            stats: playerStats, // Use the class's base stats
            inventory: [],
            equipped: {},
            activity: { type: 'idle', started_at: Date.now() },
            location: selectedLocation,
            registered_at: Date.now()
        };

        try {
            // IMPORTANT: db.insertPlayer needs to be updated in dbHandler.js to not expect guild_id
            await db.insertPlayer(initialPlayer); // <--- Changed: initialPlayer no longer has guild_id

            const finalEmbed = new EmbedBuilder()
                .setColor('#28a745')
                .setTitle(`🎉 Selamat Datang, ${nickname}!`)
                .setDescription(`Kamu berhasil mendaftar sebagai ${raceName} dari **${selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)}** dengan kelas **${selectedClass.name}**!`)
                .addFields(
                    { name: 'Karaktermu', value: `Nickname: ${nickname}\nRace: ${raceName}\nClass: ${selectedClass.name}`, inline: true },
                    { name: 'Statistik Dasar', value: Object.entries(playerStats).map(([stat, val]) => `• ${stat.toLowerCase()}: ${val}`).join('\n'), inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL());

            await message.channel.send({ embeds: [finalEmbed] });
            console.log(`Player ${nickname} registered successfully!`);

            // Clean up registerState after successful registration
            // registerState[userId] no longer needs guild_id
            delete require('../../rpg/registerState')[userId];

        } catch (error) {
            console.error('Error inserting player:', error);
            await message.reply('Terjadi kesalahan saat mencoba mendaftarkan karaktermu. Mohon coba lagi nanti.');
            // Clean up registerState if registration fails at the last step
            delete require('../../rpg/registerState')[userId];
        }
    }
};