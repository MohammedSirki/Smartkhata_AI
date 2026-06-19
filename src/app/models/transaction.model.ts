export type TransactionType = 'sale' | 'purchase' | 'expense' | 'return';

export interface Transaction {
  id: string;
  type: TransactionType;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
  status: 'Recorded' | 'Updated' | 'Cleared';
  timestamp: string;
  cogs?: number;
  parsedBy?: 'groq' | 'regex' | 'manual';
}

export interface ParsedTransaction {
  type: TransactionType;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
}
