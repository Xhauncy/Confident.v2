// D:\1. Coding\Confident\commands\fun\rps.js

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    name: 'rps',
    aliases: [],
    category: 'fun',
    description: 'Main suit (batu, kertas, gunting) dengan pemain lain atau bot!',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 8,
    
    async executeMessage(message, args, client) {
        const player1 = message.author;
        const mentionedUser = message.mentions.users.first();
        let player2;

        if (!mentionedUser) {
            player2 = client.user;
            const infoBotPlayEmbed = new EmbedBuilder()
                .setColor('#ADD8E6')
                .setTitle('🤖 Kamu Bermain Melawan Bot!')
                .setDescription(`Baik, ${player1}! Kamu bermain Batu, Kertas, Gunting melawan aku (${client.user.username}).`);
            await message.reply({ embeds: [infoBotPlayEmbed] });
            //setTimeout(() => sentInfoMsg.delete().catch(err => console.error('Gagal menghapus pesan info bot:', err)), 10000);

        } else if (mentionedUser.id === client.user.id) {
            player2 = client.user;
            const embedBotCantPlay = new EmbedBuilder()
                .setColor('#ADD8E6')
                .setTitle('😅 Kamu Bermain Melawan Bot!')
                .setDescription(`Aku tahu aku menarik, tapi kamu bisa bermain denganku! Mari kita mulai, ${player1}!`);
            const sentBotCantPlayMsg = await message.reply({ embeds: [embedBotCantPlay] });
            setTimeout(() => sentBotCantPlayMsg.delete().catch(err => console.error('Gagal menghapus pesan bot cant play RPS:', err)), 5000);

        } else {
            player2 = mentionedUser;
        }

        if (player1.id === player2.id && player2.id !== client.user.id) {
            const embedSelfPlay = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🤔 Bermain Sendirian?')
                .setDescription('Kamu tidak bisa bermain Batu, Kertas, Gunting melawan dirimu sendiri! Coba sebut orang lain atau biarkan aku yang jadi lawanmu.');
            const sentSelfPlayMsg = await message.reply({ embeds: [embedSelfPlay] });
            setTimeout(() => sentSelfPlayMsg.delete().catch(err => console.error('Gagal menghapus pesan self play RPS:', err)), 5000);
            return;
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('batu')
                .setLabel('🪨 Batu')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('kertas')
                .setLabel('📜 Kertas')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('gunting')
                .setLabel('✂️ Gunting')
                .setStyle(ButtonStyle.Primary),
        );

        const embedChooseMove = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Suit: Batu, Kertas, Gunting')
            .setDescription(`${player1} VS ${player2}`)
            .setTimestamp()
            .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

        const sentMessage = await message.reply({
            embeds: [embedChooseMove],
            components: [row],
        });

        const moveFilter = i => (i.user.id === player1.id || i.user.id === player2.id) && i.message.id === sentMessage.id;
        const moveCollector = sentMessage.createMessageComponentCollector({ filter: moveFilter, time: 30000 });

        let player1Choice = null;
        let player2Choice = null;

        // Bot akan memilih langkahnya segera jika bermain melawan player
        if (player2.id === client.user.id) {
            const moves = ['batu', 'kertas', 'gunting'];
            player2Choice = moves[Math.floor(Math.random() * moves.length)];
            // console.log(`Bot memilih: ${player2Choice}`); // Tetap untuk debugging jika diperlukan
        }

        // Teks acak untuk "bot thinking"
        const thinkingTexts = [
            "Bot sedang memikirkan strategi... 🧠",
            "Menganalisis kemungkinan... 💻",
            "Memindai otak superku... 🚀",
            "Hmm, keputusan sulit... 🤔",
            "Menghitung peluang menang... 🔢",
            "Bot sedang bersembunyi di balik pikirannya... 🤫"
        ];

        moveCollector.on('collect', async (interaction) => {
            // Memastikan hanya pemain yang terlibat yang bisa berinteraksi
            if (player2.id === client.user.id) { // Jika bermain dengan bot
                if (interaction.user.id !== player1.id) {
                    return interaction.reply({ content: 'Kamu hanya bisa memilih langkahmu sendiri!', flags: [MessageFlags.Ephemeral] });
                }
            } else { // Jika bermain dengan user lain
                if ((interaction.user.id === player1.id && player1Choice) || (interaction.user.id === player2.id && player2Choice)) {
                    return interaction.reply({ content: 'Kamu sudah memilih langkahmu!', flags: [MessageFlags.Ephemeral] });
                }
                if (interaction.user.id !== player1.id && interaction.user.id !== player2.id) {
                    return interaction.reply({ content: 'Ini bukan permainanmu!', flags: [MessageFlags.Ephemeral] });
                }
            }
            
            // Set pilihan pemain yang berinteraksi
            if (interaction.user.id === player1.id) {
                player1Choice = interaction.customId;
            } else if (interaction.user.id === player2.id) { // Ini hanya akan dieksekusi jika player2 adalah user lain
                player2Choice = interaction.customId;
            }

            // Pesan ephemeral awal untuk mengkonfirmasi pilihan
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Langkah Tercatat')
                        .setDescription(`${interaction.user} telah memilih! ${player2.id !== client.user.id ? 'Menunggu pemain lainnya...' : 'Menunggu hasil...'}`)
                        .setTimestamp()
                        .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() })
                ],
                flags: [MessageFlags.Ephemeral]
            });

            // Hapus pesan ephemeral setelah 3 detik
            setTimeout(async () => {
                try {
                    if (interaction.ephemeral) { 
                        await interaction.deleteReply();
                    }
                } catch (err) {
                    // console.error('Gagal menghapus pesan ephemeral:', err.message); // Komentari untuk mengurangi log
                }
            }, 3000);

            // Cek apakah semua pilihan sudah masuk (player1 dan player2)
            if (player1Choice && player2Choice) {
                moveCollector.stop('both_chosen');
                
                // Logic untuk "bot thinking" jika player2 adalah bot
                if (player2.id === client.user.id) {
                    const randomThinkingText = thinkingTexts[Math.floor(Math.random() * thinkingTexts.length)];
                    const thinkingEmbed = new EmbedBuilder()
                        .setColor('#FFD700') // Warna kuning untuk loading
                        .setTitle('⏳ Bot Sedang Berpikir...')
                        .setDescription(randomThinkingText)
                        .setTimestamp()
                        .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

                    await sentMessage.edit({
                        embeds: [thinkingEmbed],
                        components: [], // Hapus tombol saat bot berpikir
                    });

                    // Tunda hasil selama 2-3 detik untuk efek "thinking"
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 8000 + 8000)); // 1.5 - 3 detik
                }

                let result = '';
                const getEmoji = (choice) => {
                    switch (choice) {
                        case 'batu': return '🪨';
                        case 'kertas': return '📜';
                        case 'gunting': return '✂️';
                        default: return '';
                    }
                };

                const player1Emoji = getEmoji(player1Choice);
                const player2Emoji = getEmoji(player2Choice);

                if (player1Choice === player2Choice) {
                    result = `Seri! Keduanya memilih **${player1Choice}** ${player1Emoji}.`;
                } else if (
                    (player1Choice === 'batu' && player2Choice === 'gunting') ||
                    (player1Choice === 'gunting' && player2Choice === 'kertas') ||
                    (player1Choice === 'kertas' && player2Choice === 'batu')
                ) {
                    result = `${player1} menang! **${player1Choice}** ${player1Emoji} mengalahkan **${player2Choice}** ${player2Emoji}.`;
                } else {
                    result = `${player2} menang! **${player2Choice}** ${player2Emoji} mengalahkan **${player1Choice}** ${player1Emoji}.`;
                }

                const embedResult = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎮 Permainan Selesai!')
                    .setDescription(`**${player1.username}** ${player1Emoji} vs ${player2.username} ${player2Emoji}\n\n${result}`)
                    .setTimestamp()
                    .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

                await sentMessage.edit({
                    content: '',
                    embeds: [embedResult],
                    components: [],
                });
            }
        });

        moveCollector.on('end', async (collected, reason) => {
            if (reason === 'time' && player2.id !== client.user.id && (!player1Choice || !player2Choice)) {
                const embedTimeout = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏰ Waktu Habis!')
                    .setDescription('Permainan dibatalkan karena salah satu atau kedua pemain tidak memilih langkah.')
                    .setTimestamp()
                    .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

                if (sentMessage && !sentMessage.deleted) {
                    await sentMessage.edit({
                        content: '',
                        embeds: [embedTimeout],
                        components: [],
                    });//.catch(err => console.error('Gagal mengedit pesan timeout RPS:', err));
                }
            } else if (reason === 'time' && player2.id === client.user.id && !player1Choice) {
                const embedTimeout = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏰ Waktu Habis!')
                    .setDescription(`Permainan dibatalkan karena ${player1} tidak memilih langkah.`)
                    .setTimestamp()
                    .setFooter({ text: 'Bot Game', iconURL: client.user.displayAvatarURL() });

                if (sentMessage && !sentMessage.deleted) {
                    await sentMessage.edit({
                        content: '',
                        embeds: [embedTimeout],
                        components: [],
                    });//.catch(err => console.error('Gagal mengedit pesan timeout RPS (vs bot):', err));
                }
            }
        });
    }
};