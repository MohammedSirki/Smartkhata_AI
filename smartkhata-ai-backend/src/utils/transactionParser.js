const moneyPattern = '(?:\\u20b9|\\?|rs\\.?|inr)?\\s*([\\d,]+(?:\\.\\d+)?)';
const hinglishPriceSuffix = '(?:\\s*(?:rupaye|rupees?|rs\\.?))?';
const unitPriceSuffix = '(?:\\s*(?:ke(?:\\s+hisaab\\s+se)?|hisaab\\s+se|each|per|unit|piece|pc))?';
const { normalizeItemName } = require('./itemMatcher');

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(number) ? number : fallback;
};

const singularize = (value) => normalizeItemName(value);

const getUnitPrice = (total, quantity) => (quantity > 0 ? total / quantity : total);

const parseTransaction = (rawText = '') => {
  const description = String(rawText).trim().replace(/\s+/g, ' ');

  if (!description) {
    throw new Error('Transaction rawText is required.');
  }

  const text = description.toLowerCase();
  let match;

  match = text.match(new RegExp(`^sold\\s+(\\d+(?:\\.\\d+)?)\\s+(.+?)\\s+for\\s+${moneyPattern}(?:\\s+(each|per|unit|piece|pc))?$`, 'i'));
  if (match) {
    const quantity = toNumber(match[1], 1);
    const total = toNumber(match[3]);
    return {
      type: 'sale',
      item: singularize(match[2]),
      quantity,
      unitPrice: getUnitPrice(total, quantity),
      total,
      description,
    };
  }

  match = text.match(new RegExp(`^(?:bought|purchased)\\s+(\\d+(?:\\.\\d+)?)\\s+(.+?)\\s+for\\s+${moneyPattern}(?:\\s+(each|per|unit|piece|pc))?$`, 'i'));
  if (match) {
    const quantity = toNumber(match[1], 1);
    const total = toNumber(match[3]);
    return {
      type: 'purchase',
      item: singularize(match[2]),
      quantity,
      unitPrice: getUnitPrice(total, quantity),
      total,
      description,
    };
  }

  match = text.match(new RegExp(`^(?:aaj\\s+|kal\\s+)?(\\d+(?:\\.\\d+)?)\\s+(.+?)\\s+(?:beche|becha|bike|sold)\\s+${moneyPattern}${hinglishPriceSuffix}${unitPriceSuffix}$`, 'i'));
  if (match) {
    const quantity = toNumber(match[1], 1);
    const unitPrice = toNumber(match[3]);
    return {
      type: 'sale',
      item: singularize(match[2]),
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      description,
    };
  }

  match = text.match(new RegExp(`^(?:aaj\\s+|kal\\s+)?(\\d+(?:\\.\\d+)?)\\s+(.+?)\\s+(?:kharide|kharida|liye|bought|purchased)(?:\\s+${moneyPattern}${hinglishPriceSuffix}${unitPriceSuffix})?$`, 'i'));
  if (match) {
    const quantity = toNumber(match[1], 1);
    const unitPrice = toNumber(match[3], 0);
    return {
      type: 'purchase',
      item: singularize(match[2]),
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      description,
    };
  }

  match = text.match(new RegExp(`^paid\\s+(.+?)\\s+${moneyPattern}$`, 'i'));
  if (match) {
    const item = singularize(match[1].replace(/\bbill\b/i, ''));
    const total = toNumber(match[2]);
    return {
      type: 'expense',
      item: item || 'business expense',
      quantity: 1,
      unitPrice: total,
      total,
      description,
    };
  }

  match = text.match(/^(?:customer\s+)?returned\s+(\d+(?:\.\d+)?)\s+(.+)$/i);
  if (match) {
    return {
      type: 'return',
      item: singularize(match[2]),
      quantity: toNumber(match[1], 1),
      unitPrice: 0,
      total: 0,
      description,
    };
  }

  throw new Error('Could not parse transaction details from rawText.');
};

module.exports = parseTransaction;
