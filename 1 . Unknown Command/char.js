const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const serversByRegion = {
  NAE: ['Balthorr', 'Inanna', 'Luterra', 'Nineveh', 'Vairgrys'],
  NAW: ['Brelshaza', 'Thaemine'],
  CE: ['Arcturus', 'Elpon', 'Gienah', 'Ortuus', 'Ratik']
};

const friendlyClassNames = {
  blade: "Deathblade", demonic: "Shadowhunter", yinyangshi: "Artist",
  weather_artist: "Aeromancer", elemental_master: "Souleater", berserker_female: "Slayer",
  infighter_male: "Breaker", alchemist: "Wild Soul", berserker: "Berserker",
  reaper: "Reaper", arcana: "Arcanist", devil_hunter_female: "Gunslinger",
  holyknight: "Paladin", bard: "Bard", warlord: "Gunlancer", devil_hunter: "Deadeye",
  battle_master: "Striker", hawk_eye: "Sharpshooter", destroyer: "Destroyer",
  soul_eater: "Souleater", force_master: "Soulfist", summoner: "Summoner", scouter: "Machinist"
};

module.exports = {
  name: 'char',
  description: 'Tampilkan roster karakter dari uwuowo.mathi.moe',
  category: 'lost ark',

async executeMessage(message, args, client) {
    let region = args[0]?.toLowerCase();
    let charName = args[1];

    if (!region || !charName) {
      const embed = new EmbedBuilder()
        .setTitle('❗ Formatnya Salah')
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

    const url = `https://uwuowo.mathi.moe/character/${region}/${charName}/roster/__data.json`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch gagal');
      const json = await res.json();

      if (!Array.isArray(json.nodes) || json.nodes.length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❗ Karakter Gak Ketemu')
              .setDescription(`Karakter \`${charName}\` gak ketemu di region **${region}**.`)
              .setColor('Red')
          ]
        });
      }

      const nodes = json.nodes;
      const rosterNode = nodes.find(n => Array.isArray(n.data) && Array.isArray(n.data[1]));
      if (!rosterNode || !Array.isArray(rosterNode.data[1]) || rosterNode.data[1].length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('❗ Karakter Gak Ketemu')
              .setDescription(`Karakter \`${charName}\` gak ketemu di region **${region}**.`)
              .setColor('Red')
          ]
        });
      }

      const data = rosterNode.data;
      const indexes = data[1];
      const raw = data;

      // Mapping classId → className
      const classIdToName = {};
      for (let i = 0; i < raw.length; i++) {
        const item = raw[i];
        if (typeof item === 'object' && item?.class !== undefined) {
          const classId = item.class;
          const className = raw[i + 3];
          if (typeof classId === 'number' && typeof className === 'string') {
            classIdToName[classId] = className;
          }
        }
      }

      const rosterData = indexes.map(i => {
        const seg = raw.slice(i, i + 10);
        const classObj = seg[0];
        const classId = classObj?.class;
        const rawClassName = classIdToName[classId] || classId || '??';
        const className = friendlyClassNames[rawClassName] || rawClassName;

        let name = 'Unknown', gs = 'Unknown', ts = 'Unknown';
        const fieldMapObj = seg[0];

        if (fieldMapObj?.ilvl !== undefined) {
          const ilvlRef = fieldMapObj.ilvl;
          const fallbackIlvl = raw[ilvlRef];
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

        return `• **${name} (${className})** — ${gs} GS — ${ts}`;
      });

    // ... (rest of your code)

// ===== Parsing Server, Guild, Stronghold, Mokoko =====
const mainDataNode = nodes[1]?.data;
let server = 'Unknown', stronghold = 'Unknown', mokoko = 'Unknown', guild = 'Unknown';
const validServers = serversByRegion[region] || [];

if (Array.isArray(mainDataNode)) {
    // Iterate through mainDataNode to find a server name that matches a valid server
    for (const dataItem of mainDataNode) {
        if (typeof dataItem === 'string' && validServers.includes(dataItem)) {
            server = dataItem;
            break; // Found the server, no need to continue searching
        }
    }

    const header = mainDataNode[1];

    if (typeof header === 'object') {
        const strongholdIdx = header.stronghold;
        const mokokoIdx = header.rosterLevel;
        const guildIdx = header.guild;

        // Guild
        const guildVal = mainDataNode[guildIdx];
        if (typeof guildVal === 'object' && typeof guildVal.name === 'number') {
            guild = mainDataNode[guildVal.name] || 'Unknown';
        } else if (typeof guildVal === 'string') {
            guild = guildVal;
        }

        // Stronghold
        const strongholdObj = mainDataNode[strongholdIdx];
        if (typeof strongholdObj === 'object') {
            const nameIdx = strongholdObj.name;
            const levelIdx = strongholdObj.level;

            const nameVal = mainDataNode[nameIdx];
            const levelVal = mainDataNode[levelIdx];

            if (typeof nameVal === 'string') stronghold = nameVal;
            if (typeof levelVal === 'number') stronghold += ` (Lv. ${levelVal})`;
        }

        if (mokoko === 'Unknown' && typeof mainDataNode[mokokoIdx] === 'number') {
            mokoko = mainDataNode[mokokoIdx].toString();
        }
    }
}

// ... (rest of your code)
      const embed = new EmbedBuilder()
        .setTitle(`📋 Roster: ${charName} (${region})`)
        .setThumbnail('https://cdn.discordapp.com/attachments/1389383989088878693/1389384012203556975/1157165867885416508.webp?ex=68646c32&is=68631ab2&hm=7ceb755244bd97cfba78a73ff8e48b6a22728f6cb2b020668386898d998d005e&')
        .setDescription(
          `**🌍 Server**: ${server}\n` +
          `**🏰 Stronghold**: ${stronghold}\n` +
          `**🥥 Mokoko**: ${mokoko}\n` +
          `**👥 Guild**: ${guild}\n\n` +
          `${rosterData.join('\n')}`
        )
        .setColor('#00FFAA');

      return message.reply({ embeds: [embed] });

    } catch (e) {
      console.warn("[Char Command Error]", e.message); // Hindari crash total
      const embed = new EmbedBuilder()
        .setTitle('❗ Terjadi Kesalahan')
        .setDescription(`Gagal mengambil data dari server.\nCoba lagi nanti atau pastikan nama/region benar.`)
        .setColor('Red');
      return message.reply({ embeds: [embed] });
    }
  }
};
