const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'laevent',
    aliases: ['twisting', 'worldboss'],
    description: 'Menampilkan jadwal Twisting Phantom Legion dan World Boss dalam WIB (UTC+7).',
    category: 'lost ark',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5, 

async executeMessage(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#f39c12')
            .setTitle('Twisting & World Boss (Waktu Indonesia/WIB)')
            //.setDescription('Berikut adalah jadwal event mingguan **Twisting Phantom Legion** dan **World Boss** dalam Waktu Indonesia Barat (WIB / UTC+7):')
            .addFields(
                {
                    name: '-----------EU Central-----------',
                    value: `
🌀 **Twisting Phantom Legion**
• Sabtu 17.00 → Minggu 10.00  
• Senin 17.00 → Selasa 10.00  
• Kamis 17.00 → Jumat 10.00

🌍 **World Boss**
• Sabtu 17.00 → Minggu 10.00  
• Senin 17.00 → Selasa 10.00  
• Kamis 17.00 → Jumat 10.00`
                },
                {
                    name: '-----------NA East-----------',
                    value: `
🌀 **Twisting Phantom Legion**
• Sabtu 21.00 → Minggu 16.00  
• Minggu 21.00 → Senin 16.00  
• Kamis 21.00 → Jumat 16.00

🌍 **World Boss**
• Jumat 21.00 → Sabtu 16.00  
• Minggu 21.00 → Senin 16.00  
• Selasa 21.00 → Rabu 16.00`
                },
                {
                    name: '-----------NA West-----------',
                    value: `
🌀 **Twisting Phantom Legion**
• Sabtu 01.00 → Minggu 17.00  
• Selasa 01.00 → Rabu 17.00  
• Kamis 01.00 → Jumat 17.00

🌍 **World Boss**
• Jumat 01.00 → Sabtu 18.00  
• Selasa 01.00 → Rabu 18.00  
• Kamis 01.00 → Jumat 18.00`
                },
                {
                    name: '🕒 Catatan / Saran',
                    value: '• Setiap hari senin Twisting dan World Boss muncul bersamaan.\n• Datanglah 5–10 menit sebelum event dimulai.\n• Info ini bisa berubah tergantung rotasi mingguan Lost Ark.'
                }
            )
            .setThumbnail('https://static.wikia.nocookie.net/lost-ark/images/f/f5/Twisting_Phantom_Legion.png')
            .setFooter({
                text: 'Lost Ark Event Info • WIB Timezone',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        try {
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[eventjadwal.js]', error);
            return message.reply('❌ Gagal menampilkan jadwal event.');
        }
    }
};
