import { Injectable } from '@angular/core';

import { ParsedTransaction, Transaction, TransactionType } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class TransactionEngineService {
  parse(input: string): ParsedTransaction {
    const description = input.trim().replace(/\s+/g, ' ');

    if (!description) {
      throw new Error('Please enter a transaction.');
    }

    const normalized = description.toLowerCase();
    const type = this.detectType(normalized);
    const quantity = type === 'expense' ? 1 : this.extractQuantity(normalized);
    const item = this.extractItem(normalized, type);
    const amount = this.extractAmount(normalized);
    const isUnitPrice = /\b(each|per|unit|piece|pc)\b/.test(normalized);
    const total = type === 'return' ? 0 : isUnitPrice ? amount * quantity : amount;
    const unitPrice = type === 'return' ? 0 : isUnitPrice ? amount : quantity > 0 ? total / quantity : total;

    return {
      type,
      item,
      quantity,
      unitPrice,
      total,
      description,
    };
  }

  createTransaction(input: string, cogs = 0): Transaction {
    const parsed = this.parse(input);
    const timestamp = new Date().toISOString();

    return {
      id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...parsed,
      status: this.getStatus(parsed.type),
      timestamp,
      cogs,
    };
  }

  private detectType(normalized: string): TransactionType {
    if (/\b(sold|sale|sell)\b/.test(normalized)) {
      return 'sale';
    }

    if (/\b(bought|purchased|purchase|buy)\b/.test(normalized)) {
      return 'purchase';
    }

    if (/\b(returned|return)\b/.test(normalized)) {
      return 'return';
    }

    if (/\b(paid|pay|expense|rent|salary|electricity|bill)\b/.test(normalized)) {
      return 'expense';
    }

    throw new Error('I could not detect whether this is a sale, purchase, expense, or return.');
  }

  private extractQuantity(normalized: string): number {
    const quantityMatch = normalized.match(/\b(\d+(?:\.\d+)?)\b/);
    return quantityMatch ? Number(quantityMatch[1]) : 1;
  }

  private extractItem(normalized: string, type: TransactionType): string {
    const withoutMoney = normalized
      .replace(/₹\s?[\d,]+(?:\.\d+)?/g, '')
      .replace(/rs\.?\s?[\d,]+(?:\.\d+)?/g, '')
      .replace(/inr\s?[\d,]+(?:\.\d+)?/g, '')
      .replace(/\bfor\b.*$/g, '')
      .replace(/\b(each|per|unit|piece|pc)\b/g, '')
      .trim();

    const patterns: Record<TransactionType, RegExp[]> = {
      sale: [/\bsold\s+\d*(?:\.\d+)?\s*(.+)$/],
      purchase: [/\b(?:bought|purchased)\s+\d*(?:\.\d+)?\s*(.+)$/],
      expense: [/\bpaid\s+(.+)$/],
      return: [/\bcustomer\s+returned\s+\d*(?:\.\d+)?\s*(.+)$/, /\breturned\s+\d*(?:\.\d+)?\s*(.+)$/],
    };

    for (const pattern of patterns[type]) {
      const match = withoutMoney.match(pattern);
      if (match?.[1]) {
        return this.cleanItemName(match[1]);
      }
    }

    return type === 'expense' ? 'business expense' : 'item';
  }

  private cleanItemName(item: string): string {
    return item
      .replace(/\bbill\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/s$/, '');
  }

  private extractAmount(normalized: string): number {
    const amountMatch =
      normalized.match(/₹\s?([\d,]+(?:\.\d+)?)/) ??
      normalized.match(/\brs\.?\s?([\d,]+(?:\.\d+)?)/) ??
      normalized.match(/\binr\s?([\d,]+(?:\.\d+)?)/) ??
      normalized.match(/\bfor\s+([\d,]+(?:\.\d+)?)/);

    return amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0;
  }

  private getStatus(type: TransactionType): Transaction['status'] {
    if (type === 'expense') {
      return 'Cleared';
    }

    return type === 'purchase' || type === 'return' ? 'Updated' : 'Recorded';
  }
}
