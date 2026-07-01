const Groq = require('groq-sdk');

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const TRANSACTION_TYPES = ['sale', 'purchase', 'expense', 'return', 'unknown'];
const PAYMENT_MODES = ['cash', 'upi', 'card', 'bank', 'credit', 'unknown', null];

const getClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

const chat = async (messages, options = {}) => {
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.1,
    max_tokens: options.maxTokens ?? 700,
  });

  return completion.choices?.[0]?.message?.content?.trim() || '';
};

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw error;
  }
};

const parseJsonArray = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw error;
  }
};

const assertNumberOrNull = (value, field) => {
  if (value === null) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Groq returned invalid ${field}.`);
  }
  return number;
};

const cleanStringOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
};

const validateTransaction = (payload, rawText) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Groq returned an invalid transaction.');
  }

  const type = String(payload.type || 'unknown').toLowerCase();
  if (!TRANSACTION_TYPES.includes(type)) {
    throw new Error('Groq returned an unsupported transaction type.');
  }

  const quantity = assertNumberOrNull(payload.quantity, 'quantity');
  const unitPrice = assertNumberOrNull(payload.unitPrice, 'unitPrice');
  const providedTotal = assertNumberOrNull(payload.total, 'total');
  const total = providedTotal === null && quantity !== null && unitPrice !== null ? quantity * unitPrice : providedTotal;
  const paymentMode = payload.paymentMode === null || payload.paymentMode === undefined
    ? null
    : String(payload.paymentMode).toLowerCase();

  if (!PAYMENT_MODES.includes(paymentMode)) {
    throw new Error('Groq returned an unsupported payment mode.');
  }

  return {
    type,
    item: cleanStringOrNull(payload.item),
    quantity,
    unitPrice,
    total,
    paymentMode,
    customer: cleanStringOrNull(payload.customer),
    supplier: cleanStringOrNull(payload.supplier),
    description: cleanStringOrNull(payload.description) || String(rawText || '').trim(),
  };
};

const testGroqConnection = async () =>
  chat([
    {
      role: 'user',
      content: 'Reply exactly: SmartKhata AI Connected',
    },
  ], { maxTokens: 30, temperature: 0 });

const parseTransactionWithGroq = async (rawText) => {
  const content = await chat([
    {
      role: 'system',
      content: `You are SmartKhata AI, an accounting transaction parser for Indian small businesses.

Convert natural-language business transactions into valid JSON.

Support English, Hindi, and Hinglish.

Supported transaction types:
sale
purchase
expense
return
unknown

Return JSON only.
No markdown.
No explanation.
No extra text.

Required JSON shape:

{
  "type": "sale | purchase | expense | return | unknown",
  "item": "string or null",
  "quantity": "number or null",
  "unitPrice": "number or null",
  "total": "number or null",
  "paymentMode": "cash | upi | card | bank | credit | unknown | null",
  "customer": "string or null",
  "supplier": "string or null",
  "description": "string"
}

Rules:
- If total is missing but quantity and unitPrice exist, calculate total.
- For expense, item should be expense category like rent, electricity, salary, fuel, internet.
- Normalize Hindi/Hinglish item names into simple English where possible.
- Return clean generic item names.
- Do not over-specify brand unless the user clearly mentions the brand.
- Singularize product names: chargers -> charger, pens -> pen, shirts -> shirt.
- For generic sales, return item as the actual product, not a sentence fragment.
- If quantity is missing for expense, use null.
- If price is missing, use null.
- If transaction is unclear, return type unknown.
- Never invent values not present in the input.
- Examples:
  Input: "Aaj 5 charger beche 500 rupaye ke hisaab se" -> item "charger"
  Input: "Sold two Samsung chargers" -> item "Samsung charger"
  Input: "10 pen kharide" -> item "pen"
  Input: "paid electricity bill 2500" -> item "electricity"
- Return strict parseable JSON only.`,
    },
    {
      role: 'user',
      content: String(rawText || ''),
    },
  ]);

  return validateTransaction(parseJson(content), rawText);
};

const askBusinessAssistantWithGroq = async (message, context) =>
  chat([
    {
      role: 'system',
      content: `You are SmartKhata AI, a friendly AI accountant for Indian small businesses.

Answer using only the business context provided.

Keep answers:
- simple
- practical
- short
- understandable for shop owners
- not overly technical

If user asks about profit, revenue, expenses, stock, inventory, or reports, use the provided numbers.

If data is unavailable, say that there is not enough data yet and suggest recording transactions.

Do not pretend to know data that is not in context.

Return plain text only.`,
    },
    {
      role: 'user',
      content: `Business context JSON:\n${JSON.stringify(context)}\n\nQuestion:\n${message}`,
    },
  ], { maxTokens: 350, temperature: 0.2 });

const validateInsights = (payload) => {
  if (!Array.isArray(payload)) {
    throw new Error('Groq returned invalid insights.');
  }

  return payload.slice(0, 5).map((insight) => {
    const type = ['success', 'warning', 'info'].includes(insight?.type) ? insight.type : 'info';
    const title = cleanStringOrNull(insight?.title);
    const message = cleanStringOrNull(insight?.message);

    if (!title || !message) {
      throw new Error('Groq returned incomplete insights.');
    }

    return { type, title, message };
  });
};

const generateBusinessInsightsWithGroq = async (context) => {
  const content = await chat([
    {
      role: 'system',
      content: `You are SmartKhata AI, a business insights assistant for Indian small businesses.

Generate 3-5 AI insights for dashboard.

Return JSON array only:

[
  {
    "type": "success | warning | info",
    "title": "string",
    "message": "string"
  }
]

Examples:
- Revenue improved this month.
- Low stock items need attention.
- Expenses are higher than usual.
- Business health looks stable.

Use only provided data.`,
    },
    {
      role: 'user',
      content: JSON.stringify(context),
    },
  ], { maxTokens: 500, temperature: 0.2 });

  return validateInsights(parseJsonArray(content));
};

module.exports = {
  askBusinessAssistantWithGroq,
  generateBusinessInsightsWithGroq,
  parseTransactionWithGroq,
  testGroqConnection,
};
