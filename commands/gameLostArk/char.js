const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const serversByRegion = {
    NAE: ['Balthorr', 'Inanna', 'Luterra', 'Nineveh', 'Vairgrys'],
    NAW: ['Brelshaza', 'Thaemine'],
    CE: ['Arcturus', 'Elpon', 'Gienah', 'Ortuus', 'Ratik']
};

const friendlyClassNames = {
    blade: "Deathblade", demonic: "Shadowhunter", yinyangshi: "Artist", battle_master_male: "Stricker",
    weather_artist: "Aeromancer", elemental_master: "Souleater", berserker_female: "Slayer",
    infighter_male: "Breaker", alchemist: "Wild Soul", berserker: "Berserker", lance_master : "Glavier",
    reaper: "Reaper", arcana: "Arcanist", devil_hunter_female: "Gunslinger",
    holyknight: "Paladin", bard: "Bard", warlord: "Gunlancer", devil_hunter: "Deadeye",
    hawk_eye: "Sharpshooter", destroyer: "Destroyer", infighter : "Wardancer",
    soul_eater: "Souleater", force_master: "Soulfist", summoner: "Summoner", scouter: "Machinist"
};

module.exports = {
    name: 'char',
    description: 'Menampilkan character lost ark',
    category: 'lost ark',
    owner: false,
    admin: false,
    helper: false,
    support: false,
    repeatable: false,
    hide: false,
    cooldown: 8, 

    async executeMessage(message, args, client) {
        let region = args[0]?.toLowerCase();
        let charName = args[1];

        if (!region || !charName) {
            const embed = new EmbedBuilder()
                .setTitle('❗ Format Salah')
                .setDescription('Gunakan format:\n`!char [region] [nama karakter]`\nContoh: `!char nae manafu`')
                .setColor('Red');
            return message.reply({ embeds: [embed] });
        }

        const regionMap = {
            nae: 'NAE', east: 'NAE', e: 'NAE', n: 'NAE',
            naw: 'NAW', west: 'NAW', w: 'NAW', s: 'NAW',
            eu: 'CE', euc: 'CE', central: 'CE',
        };
        region = regionMap[region] || region.toUpperCase();

        if (/^[a-z]+$/.test(charName))
            charName = charName.charAt(0).toUpperCase() + charName.slice(1);

        // --- 1. Kirim pesan loading awal ---
        const loadingEmbed = new EmbedBuilder()
            .setTitle(`🔍 Mencari Karakter: ${charName} (${region})`)
            .setDescription('Memuat data roster...')
            .setColor('Yellow');
        const replyMessage = await message.reply({ embeds: [loadingEmbed] });

        const rosterUrl = `https://uwuowo.mathi.moe/character/${region}/${charName}/roster/__data.json`;
        const charDetailsUrl = `https://uwuowo.mathi.moe/character/${region}/${charName}/__data.json`;

        let rosterJson, charDetailsJson;

        try {
            const resRoster = await fetch(rosterUrl);
            if (!resRoster.ok) {
                if (resRoster.status === 404) {
                    throw new Error(`Roster untuk \`${charName}\` di region **${region}** tidak ditemukan.`);
                }
                throw new Error('Gagal mengambil data roster.');
            }
            rosterJson = await resRoster.json();

            // --- 2. Update pesan dengan info roster dimuat ---
            const updatingRosterEmbed = new EmbedBuilder(loadingEmbed)
                .setDescription('Data roster berhasil dimuat. Mengambil detail karakter...');
            await replyMessage.edit({ embeds: [updatingRosterEmbed] });


            const resCharDetails = await fetch(charDetailsUrl);
            if (!resCharDetails.ok) {
                if (resCharDetails.status === 404) {
                    throw new Error(`Detail karakter utama \`${charName}\` di region **${region}** tidak ditemukan.`);
                }
                throw new Error('Gagal mengambil data detail karakter utama.');
            }
            charDetailsJson = await resCharDetails.json();

        } catch (e) {
            console.warn("[Char Command Error - Initial Fetch]", e.message);
            const errorEmbed = new EmbedBuilder()
                .setTitle('❗ Terjadi Kesalahan')
                .setDescription(`Gagal mengambil data dari server:\n\`${e.message}\`\nCoba lagi nanti atau pastikan nama/region benar.`)
                .setColor('Red');
            return replyMessage.edit({ embeds: [errorEmbed] });
        }

        // --- Process Roster Data ---
        const nodesRoster = rosterJson.nodes;
        const rosterNode = nodesRoster.find(n => Array.isArray(n.data) && Array.isArray(n.data[1]));

        if (!rosterNode || !Array.isArray(rosterNode.data[1]) || rosterNode.data[1].length === 0) {
            const noRosterEmbed = new EmbedBuilder()
                .setTitle('❗ Roster Gak Ketemu')
                .setDescription(`Roster untuk karakter \`${charName}\` gak ketemu di region **${region}**.`)
                .setColor('Red');
            return replyMessage.edit({ embeds: [noRosterEmbed] });
        }

        const dataRoster = rosterNode.data;
        const indexes = dataRoster[1];
        const rawRoster = dataRoster;

        const classIdToName = {};
        for (let i = 0; i < rawRoster.length; i++) {
            const item = rawRoster[i];
            if (typeof item === 'object' && item?.class !== undefined) {
                const classId = item.class;
                const className = rawRoster[i + 3];
                if (typeof classId === 'number' && typeof className === 'string') {
                    classIdToName[classId] = className;
                }
            }
        }

        // ===== Parsing Server, Guild, Stronghold, Mokoko (from Roster Data) =====
        const mainDataNodeRoster = nodesRoster[1]?.data;
        let server = 'Unknown', stronghold = 'Unknown', mokoko = 'Unknown', guild = 'Unknown';
        const validServers = serversByRegion[region] || [];

        if (Array.isArray(mainDataNodeRoster)) {
            for (const dataItem of mainDataNodeRoster) {
                if (typeof dataItem === 'string' && validServers.includes(dataItem)) {
                    server = dataItem;
                    break;
                }
            }

            const headerRoster = mainDataNodeRoster[1];
            if (typeof headerRoster === 'object') {
                const strongholdIdx = headerRoster.stronghold;
                const mokokoIdx = headerRoster.rosterLevel;
                const guildIdx = headerRoster.guild;

                const guildVal = mainDataNodeRoster[guildIdx];
                if (typeof guildVal === 'object' && typeof guildVal.name === 'number') {
                    guild = mainDataNodeRoster[guildVal.name] || 'Unknown';
                } else if (typeof guildVal === 'string') {
                    guild = guildVal;
                }

                const strongholdObj = mainDataNodeRoster[strongholdIdx];
                if (typeof strongholdObj === 'object') {
                    const nameIdx = strongholdObj.name;
                    const levelIdx = strongholdObj.level;
                    const nameVal = mainDataNodeRoster[nameIdx];
                    const levelVal = mainDataNodeRoster[levelIdx];
                    if (typeof nameVal === 'string') stronghold = nameVal;
                    if (typeof levelVal === 'number') stronghold += ` (Lv. ${levelVal})`;
                }

                if (mokoko === 'Unknown' && typeof mainDataNodeRoster[mokokoIdx] === 'number') {
                    mokoko = mainDataNodeRoster[mokokoIdx].toString();
                }
            }
        }

        // --- Process Main Character Details Data ---
        const nodesCharDetails = charDetailsJson.nodes;
        const charDataNode = nodesCharDetails[1]?.data;

        let mainCharCombatPowerRaw = 'Unknown';
        let mainCharLevel = 'Unknown';
        let mainCharGS = 'Unknown';

        if (Array.isArray(charDataNode) && charDataNode.length >= 2) {
            const headerCharDetails = charDataNode[1];

            const getScoreValue = (dataArray, headerRef) => {
                if (headerRef !== undefined) {
                    const obj = dataArray[headerRef];
                    if (typeof obj === 'object' && obj !== null && typeof obj.score === 'number') {
                        const scoreIndex = obj.score;
                        if (typeof scoreIndex === 'number' && dataArray[scoreIndex] !== undefined) {
                            return parseFloat(dataArray[scoreIndex]).toFixed(2);
                        }
                    }
                }
                return 'Unknown';
            };

            mainCharCombatPowerRaw = getScoreValue(charDataNode, headerCharDetails.maxCombatPower);

            if (headerCharDetails.level !== undefined && typeof charDataNode[headerCharDetails.level] === 'number') {
                mainCharLevel = `Lv. ${charDataNode[headerCharDetails.level]}`;
            }

            if (headerCharDetails.ilvl !== undefined && typeof charDataNode[headerCharDetails.ilvl] === 'number') {
                mainCharGS = parseFloat(charDataNode[headerCharDetails.ilvl]).toFixed(2);
            }
        }

        // --- Bangun embed awal dengan info utama saja ---
        const baseEmbed = new EmbedBuilder()
            .setTitle(`📋 Roster: ${charName} (${region}) ${mainCharGS !== 'Unknown' ? `(${mainCharGS} GS)` : ''}`)
            .setThumbnail('https://cdn.discordapp.com/attachments/1389383989088878693/1389384012203556975/1157165867885416508.webp?ex=68646c32&is=68631ab2&hm=7ceb755244bd97cfba78a73ff8e48b6a22728f6cb2b020668386898d998d005e&')
            .setDescription(
                `**🌍 Server**: ${server}\n` +
                `**🏰 Stronghold**: ${stronghold}\n` +
                `**🥥 Mokoko**: ${mokoko}\n` +
                `**👥 Guild**: ${guild}\n` +
                `**💪 Combat Power**: ${mainCharCombatPowerRaw}\n` +
                `**📈 Character Level**: ${mainCharLevel}\n\n` +
                `__**Daftar Karakter:**__\n_Memuat..._\n` // Indikator loading untuk daftar karakter
            )
            .setColor('#00FFAA');

        await replyMessage.edit({ embeds: [baseEmbed] });

        // --- Memuat karakter satu per satu ---
        let currentRosterDescription = ``;
        const initialEmbedDescription = baseEmbed.data.description; // Simpan deskripsi awal sebelum penambahan roster

        for (const i of indexes) {
            const seg = rawRoster.slice(i, i + 10);
            const classObj = seg[0];
            const classId = classObj?.class;
            const rawClassName = classIdToName[classId] || classId || '??';
            const className = friendlyClassNames[rawClassName] || rawClassName;

            let name = 'Unknown', gs = 'Unknown', ts = 'Unknown';
            const fieldMapObj = seg[0];

            if (fieldMapObj?.ilvl !== undefined) {
                const ilvlRef = fieldMapObj.ilvl;
                const fallbackIlvl = rawRoster[ilvlRef];
                if (typeof fallbackIlvl === 'number' && fallbackIlvl >= 0 && fallbackIlvl <= 1800) {
                    gs = parseFloat(fallbackIlvl.toFixed(2));
                }
            }

            for (const v of seg) {
                if (typeof v === 'string' && name === 'Unknown') name = v;
                if (typeof v === 'number' && v > 1e9 && ts === 'Unknown') {
                    ts = `<t:${Math.floor(v)}:R>`;
                }
            }
            const charLine = `• **${name} (${className})** — ${gs} GS — ${ts}`;

            currentRosterDescription += charLine + '\n';

            // Edit embed untuk menampilkan karakter yang baru ditambahkan
            const updatedEmbed = EmbedBuilder.from(baseEmbed)
                .setDescription(initialEmbedDescription.replace('_Memuat..._', currentRosterDescription));

            await replyMessage.edit({ embeds: [updatedEmbed] });
            await new Promise(resolve => setTimeout(resolve, 500)); // Jeda 0.5 detik untuk efek loading
        }

        // Final update untuk memastikan tidak ada '_Memuat..._' yang tersisa
        const finalRosterEmbed = EmbedBuilder.from(baseEmbed)
            .setDescription(initialEmbedDescription.replace('_Memuat..._', currentRosterDescription));
        await replyMessage.edit({ embeds: [finalRosterEmbed] });
    }
};