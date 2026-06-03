const detectType = (text) => {
  if (/\b(sold|sale|sell)\b/.test(text)) return 'sale';
  if (/\b(bought|purchased|purchase|buy)\b/.test(text)) return 'purchase';
  if (/\b(returned|return)\b/.test(text)) return 'return';
  if (/\b(paid|pay|expense|rent|salary|electricity|bill)\b/.test(text)) return 'expense';
  return null;
};

const extractAmount = (text) => {
  const match =
    text.match(/₹\s?([\d,]+(?:\.\d+)?)/) ||
    text.match(/\brs\.?\s?([\d,]+(?:\.\d+)?)/) ||
    text.match(/\binr\s?([\d,]+(?:\.\d+)?)/) ||
    text.match(/\bfor\s+([\d,]+(?:\.\d+)?)/);

  return match ? Number(match[1].replace(/,/g, '')) : 0;
};

const cleanItem = (item) =>
  item
    .replace(/\bbill\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/s$/, '');

const extractItem = (text, type) => {
  const withoutMoney = text
    .replace(/₹\s?[\d,]+(?:\.\d+)?/g, '')
    .replace(/rs\.?\s?[\d,]+(?:\.\d+)?/g, '')
    .replace(/inr\s?[\d,]+(?:\.\d+)?/g, '')
    .replace(/\bfor\b.*$/g, '')
    .replace(/\b(each|per|unit|piece|pc)\b/g, '')
    .trim();

  const patterns = {
    sale: [/\bsold\s+\d*(?:\.\d+)?\s*(.+)$/],
    purchase: [/\b(?:bought|purchased)\s+\d*(?:\.\d+)?\s*(.+)$/],
    expense: [/\bpaid\s+(.+)$/],
    return: [/\bcustomer\s+returned\s+\d*(?:\.\d+)?\s*(.+)$/, /\breturned\s+\d*(?:\.\d+)?\s*(.+)$/],
  };

  for (const pattern of patterns[type] || []) {
    const match = withoutMoney.match(pattern);
    if (match && match[1]) return cleanItem(match[1]);
  }

  return type === 'expense' ? 'business expense' : 'item';
};

const parseTransaction = (description = '') => {
  const original = description.trim().replace(/\s+/g, ' ');
  const text = original.toLowerCase();
  const type = detectType(text);

  if (!original) {
    throw new Error('Transaction description is required.');
  }

  if (!type) {
    throw new Error('Could not detect transaction type.');
  }

  const quantityMatch = text.match(/\b(\d+(?:\.\d+)?)\b/);
  const quantity = type === 'expense' ? 1 : quantityMatch ? Number(quantityMatch[1]) : 1;
  const amount = extractAmount(text);
  const unitBased = /\b(each|per|unit|piece|pc)\b/.test(text);
  const total = type === 'return' ? 0 : unitBased ? amount * quantity : amount;
  const unitPrice = type === 'return' ? 0 : unitBased ? amount : quantity > 0 ? total / quantity : total;

  return {
    type,
    item: extractItem(text, type),
    quantity,
    unitPrice,
    total,
    description: original,
  };
};

module.exports = parseTransaction;
