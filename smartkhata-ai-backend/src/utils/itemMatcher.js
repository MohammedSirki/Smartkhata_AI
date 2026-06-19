const InventoryItem = require('../models/InventoryItem');

const FILLER_WORDS = new Set([
  'new',
  'old',
  'premium',
  'original',
  'piece',
  'pieces',
  'pcs',
  'pc',
  'unit',
  'units',
  'item',
  'items',
]);

const HINGLISH_WORDS = new Map([
  ['rupaye', ''],
  ['rupee', ''],
  ['rupees', ''],
  ['rs', ''],
  ['ka', ''],
  ['ke', ''],
  ['ki', ''],
  ['hisaab', ''],
  ['se', ''],
  ['aaj', ''],
  ['kal', ''],
]);

const singularizeToken = (token) => {
  if (token.length <= 3) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('es') && token.length > 4) {
    if (/(ches|shes|xes|zes|ses)$/i.test(token)) return token.slice(0, -2);
  }
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
};

const normalizeItemName = (name) => {
  const words = String(name || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => HINGLISH_WORDS.get(word) ?? word)
    .filter(Boolean)
    .map(singularizeToken)
    .filter((word) => word && !FILLER_WORDS.has(word));

  return [...new Set(words)].join(' ').trim();
};

const getTokens = (value) => normalizeItemName(value).split(/\s+/).filter(Boolean);

const levenshteinDistance = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
};

const calculateItemSimilarity = (a, b) => {
  const normalizedA = normalizeItemName(a);
  const normalizedB = normalizeItemName(b);

  if (!normalizedA || !normalizedB) return 0;
  if (normalizedA === normalizedB) return 1;

  const tokensA = getTokens(normalizedA);
  const tokensB = getTokens(normalizedB);
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = tokensA.filter((token) => setB.has(token)).length;
  const shorter = Math.min(setA.size, setB.size) || 1;
  const longer = Math.max(setA.size, setB.size) || 1;
  const overlapScore = intersection / shorter;
  const jaccardScore = intersection / (setA.size + setB.size - intersection || 1);
  const sharedTokenScore = intersection > 0 ? intersection / longer : 0;

  const distance = levenshteinDistance(normalizedA, normalizedB);
  const editScore = 1 - distance / Math.max(normalizedA.length, normalizedB.length);

  const containmentScore = normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)
    ? Math.min(1, 0.78 + (intersection / longer) * 0.22)
    : 0;

  return Math.max(overlapScore * 0.7 + jaccardScore * 0.15 + editScore * 0.15, containmentScore, sharedTokenScore);
};

const matchInventoryItems = (itemName, inventoryItems = []) => {
  const normalizedName = normalizeItemName(itemName);
  if (!normalizedName) {
    return { item: null, normalizedName, score: 0, strength: 'none', reason: 'empty' };
  }

  const candidates = inventoryItems.map((item) => {
    const names = [item.normalizedName, item.name, ...(item.aliases || [])]
      .map(normalizeItemName)
      .filter(Boolean);
    const uniqueNames = [...new Set(names)];

    if (uniqueNames.includes(normalizedName)) {
      return { item, score: 1, reason: 'exact' };
    }

    const bestScore = uniqueNames.reduce((best, candidateName) => {
      const candidateTokens = getTokens(candidateName);
      const itemTokens = getTokens(normalizedName);
      const meaningfulContainment = candidateTokens.length > 0
        && candidateTokens.every((token) => itemTokens.includes(token))
        && candidateName.length >= 3;
      const score = meaningfulContainment
        ? Math.max(0.78, calculateItemSimilarity(normalizedName, candidateName))
        : calculateItemSimilarity(normalizedName, candidateName);
      return Math.max(best, score);
    }, 0);

    return { item, score: bestScore, reason: 'similarity' };
  });

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (!best || best.score < 0.5) {
    return { item: null, normalizedName, score: best?.score || 0, strength: 'none', reason: 'none' };
  }

  return {
    item: best.item,
    normalizedName,
    score: best.score,
    strength: best.score >= 0.75 ? 'strong' : 'weak',
    reason: best.reason,
  };
};

const findMatchingInventoryItem = async (itemName, userId, businessId) => {
  const normalizedName = normalizeItemName(itemName);
  const exact = await InventoryItem.findOne({
    user: userId,
    business: businessId,
    $or: [
      { normalizedName },
      { aliases: normalizedName },
    ],
  });

  if (exact) {
    return { item: exact, normalizedName, score: 1, strength: 'strong', reason: 'exact' };
  }

  const inventoryItems = await InventoryItem.find({ user: userId, business: businessId });
  return matchInventoryItems(itemName, inventoryItems);
};

const addAlias = (item, alias) => {
  const normalizedAlias = normalizeItemName(alias);
  if (!item || !normalizedAlias || normalizedAlias === item.normalizedName) return;

  const aliases = new Set((item.aliases || []).map(normalizeItemName).filter(Boolean));
  aliases.add(normalizedAlias);
  item.aliases = [...aliases];
};

module.exports = {
  addAlias,
  calculateItemSimilarity,
  findMatchingInventoryItem,
  matchInventoryItems,
  normalizeItemName,
};
