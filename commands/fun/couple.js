const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'couple',
    category: 'fun',
    aliases: ['ppcp'],
    description: 'Cek persentase cinta antara dua orang! (Harus mention orang lain)', // Deskripsi diperbarui
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 7,

    async executeMessage(message, args, client) {
        const author = message.author; // Penulis pesan
        const mentionedUsers = message.mentions.users; // Semua pengguna yang di-mention

        let user1, user2;

        // Skenario 1: Tidak ada mention SAMA SEKALI
        if (mentionedUsers.size === 0) {
            const reply = await message.reply('❌ Contoh pengunaan : `kak couple @aku @dia`');
            setTimeout(() => reply.delete().catch(e => console.error('Gagal menghapus pesan error no mention:', e)), 7000); // Waktu sedikit lebih lama
            return;
        }

        // Skenario 2: Hanya satu mention
        // Cek apakah mention tersebut adalah AUTHOR sendiri
        if (mentionedUsers.size === 1) {
            const firstMention = mentionedUsers.first();
            if (firstMention.id === author.id) {
                const reply = await message.reply('❌ Gak bisa sama diri sendiri ya.');
                setTimeout(() => reply.delete().catch(e => console.error('Gagal menghapus pesan error self mention:', e)), 5000);
                return;
            } else {
                // Jika mention adalah orang lain, maka author vs orang itu
                user1 = author;
                user2 = firstMention;
            }
        } 
        // Skenario 3: Ada dua atau lebih mention
        else if (mentionedUsers.size >= 2) {
            user1 = mentionedUsers.first();
            user2 = mentionedUsers.at(1); // Ambil mention kedua

            // Tambahan: Jika user1 atau user2 adalah bot itu sendiri
            // Ini biasanya tidak perlu dibatasi kecuali Anda memiliki alasan khusus.
            // Biarkan saja untuk saat ini, karena intinya adalah "orang lain".
        }

        // --- Pencegahan: Jika setelah semua logic, user1 atau user2 masih belum terdefinisi (seharusnya tidak terjadi dengan logic di atas)
        if (!user1 || !user2) {
            const reply = await message.reply('❌ Pastikan kamu mention orang yang tepat');
            setTimeout(() => reply.delete().catch(e => console.error('Gagal menghapus pesan error undefined users:', e)), 5000);
            return;
        }
        
        // --- Periksa jika kedua user yang terpilih adalah sama DAN bukan hasil dari (author vs mention lain)
        // Ini untuk mencegah kak couple @userA @userA
        if (user1.id === user2.id) {
             const reply = await message.reply('❌ Kamu mention dua orang yang sama.');
             setTimeout(() => reply.delete().catch(e => console.error('Gagal menghapus pesan error same two mentions:', e)), 5000);
             return;
        }


        // --- Logic perhitungan persentase dan komentar (tidak berubah) ---
        const persen = Math.floor(Math.random() * 101);

        const komentar = {
            0: [
                '💔 Duh, kayaknya mending jadi stranger aja...',
                '❌ No chemistry sama sekali.',
                '😭 Cinta ditolak, server bertindak.'
            ],
            20: [
                '😐 Ada sedikit rasa, tapi gak cukup buat hubungan.',
                '💤 Sepertinya kamu cuma muncul di mimpi dia.',
                '🙄 Yang satu sayang, yang lain ngilang.'
            ],
            40: [
                '😅 Masih bisa diperjuangkan, mungkin.',
                '🍵 Rasa cintanya hambar kayak teh tawar.',
                '💢 Ada api, tapi asapnya lebih banyak.'
            ],
            60: [
                '💘 Sudah ada rasa nih~',
                '🔥 Ada potensi jadi pasangan nih!',
                '😊 Cocok-cocokan dikit bisa jadi pasangan impian.'
            ],
            80: [
                '💞 Wah, kayaknya cocok banget!',
                '😍 Sudah kayak pasangan anime.',
                '👀 Semua orang juga bilang kalian cocok!'
            ],
            100: [
                '💍 Udah kayak jodoh yang tertulis di langit!',
                '💖 Soulmate detected!',
                '🎉 Tinggal nikah, kapan undangannya?'
            ]
        };

        const getKomentar = () => {
            if (persen >= 90) return komentar[100];
            if (persen >= 70) return komentar[80];
            if (persen >= 50) return komentar[60];
            if (persen >= 30) return komentar[40];
            if (persen >= 10) return komentar[20];
            return komentar[0];
        };

        const komentarLucu = getKomentar()[Math.floor(Math.random() * getKomentar().length)];

        const embed = new EmbedBuilder()
            .setTitle('💘 Persentase Cinta 💘')
            .setDescription(`${user1.username} ❤️ ${user2.username}\n**${persen}%**\n\n${komentarLucu}`)
            .setColor('Random')
            .setFooter({ text: `Request by ${message.author.username}` })
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
};