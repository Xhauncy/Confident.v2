/**
 * Mengecek apakah user punya permission Administrator di guild
 * @param {GuildMember} member
 * @returns {boolean}
 */
function isAdmin(member) {
  return member.permissions.has('Administrator');
}

/**
 * Mengecek apakah user adalah pemilik guild
 * @param {Guild} guild
 * @param {User} user
 * @returns {boolean}
 */
function isGuildOwner(guild, user) {
  return guild.ownerId === user.id;
}

/**
 * Mengecek apakah user adalah developer bot (owner ID bot)
 * @param {User} user
 * @returns {boolean}
 */
function isBotOwner(user) {
  const devId = process.env.DEVELOPER_ID;
  return user.id === devId;
}

/**
 * Gabungan: apakah user punya akses admin-level
 */
function hasFullAccess(member, guild, user) {
  return isAdmin(member) || isGuildOwner(guild, user) || isBotOwner(user);
}

module.exports = {
  isAdmin,
  isGuildOwner,
  isBotOwner,
  hasFullAccess
};