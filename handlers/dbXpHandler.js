/**
 * Rumus XP klasik untuk naik level:
 * XP_diperlukan = 5 * (level ^ 2) + 50 * level + 100
 */
function getXpForNextLevel(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

/**
 * Fungsi tambahan kalau kamu ingin kasih reward scaling,
 * misalnya bonus XP dari quest atau multiplier dari event.
 */
function calculateXpGain(baseXp, options = {}) {
  const multiplier = options.multiplier || 1;
  const bonus = options.bonus || 0;
  return Math.floor((baseXp + bonus) * multiplier);
}

module.exports = {
  getXpForNextLevel,
  calculateXpGain
};
