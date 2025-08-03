const { EmbedBuilder } = require('discord.js');
// Kita tidak lagi membutuhkan config.js untuk data helper
// const config = require('../../config.js'); 

// Impor file usersID.json
const usersData = require('../../assets/usersID.json');

module.exports = {
    name: 'helperlist',
    aliases: ['helpers', 'listhelper', 'infohelper', 'helper'],
    description: 'Menampilkan daftar helper bot yang dibagi per kategori.',
    category: 'info',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 5,

    async executeMessage(message, args, client) { // Sesuaikan urutan argumen: message, args, client
        // Cek permission bot dulu
        const botMember = await message.guild.members.fetch(client.user.id);
        const permissions = message.channel.permissionsFor(botMember);
        if (!permissions.has('SendMessages')) return;
        if (!permissions.has('EmbedLinks')) {
            return message.reply('❌ Saya tidak punya izin **Embed Links** untuk mengirim daftar helper.');
        }

        const embed = new EmbedBuilder()
            .setTitle('🤝 Daftar Helper Bot')
            .setColor('#00c9ff')
            //.setThumbnail('https://cdn-icons-png.flaticon.com/512/709/709496.png')
            .setFooter({ text: 'Terima kasih atas bantuannya ❤️' })
            .setTimestamp();

        // Ambil objek pertama dari array usersData, yang berisi Helper dan Support
        // Pastikan usersData tidak kosong dan elemen pertama ada
        const rolesData = usersData.length > 0 ? usersData[0] : {}; 

        // Iterasi melalui properti di dalam rolesData (misalnya "Helper", "Support")
        for (const categoryName in rolesData) {
            // Pastikan properti tersebut benar-benar milik objek (bukan dari prototype chain)
            if (Object.hasOwnProperty.call(rolesData, categoryName)) {
                const members = rolesData[categoryName]; // Ini adalah objek { "Nama": "ID" }
                const memberTags = []; // Array untuk menyimpan tag (@User)

                // Iterasi melalui setiap member di kategori tersebut
                for (const name in members) {
                    if (Object.hasOwnProperty.call(members, name)) {
                        const id = members[name];
                        // Tambahkan tag pengguna ke array memberTags
                        memberTags.push(`<@${id}>`);
                    }
                }

                // Jika ada helper/support di kategori ini, tambahkan ke embed
                if (memberTags.length > 0) {
                    embed.addFields({
                        name: `📁 ${categoryName}`, // Akan menjadi "Helper" atau "Support"
                        value: memberTags.join(', '), // Gabungkan tag dengan koma
                        inline: false
                    });
                }
            }
        }

        // Jika tidak ada data helper/support yang ditemukan atau ditambahkan ke embed
        if (embed.data.fields && embed.data.fields.length === 0) {
            embed.setDescription('Tidak ada helper atau support yang terdaftar saat ini.');
        }

        return message.channel.send({ embeds: [embed] });
    }
};