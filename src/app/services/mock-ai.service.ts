import { Injectable } from '@angular/core';

import { AssistantContext } from '../models/assistant-context.model';

@Injectable({
  providedIn: 'root',
})
export class MockAiService {
  respond(prompt: string, context: AssistantContext): string {
    const normalized = prompt.toLowerCase();

    if (normalized.includes('profit')) {
      return `You made ${this.currency(context.profit)} profit from the transactions recorded in SmartKhata.`;
    }

    if (normalized.includes('low') || normalized.includes('inventory') || normalized.includes('stock')) {
      const lowItem = context.lowInventory[0];
      if (!lowItem) {
        return 'Inventory looks healthy right now. No low-stock items need attention.';
      }

      return `${lowItem.name} is running low with only ${lowItem.stock} units remaining.`;
    }

    if (normalized.includes('today') && (normalized.includes('sale') || normalized.includes('sales'))) {
      return `Today's sales total ${this.currency(context.todaySales)}.`;
    }

    if (normalized.includes('expense')) {
      return `Your recorded expenses total ${this.currency(context.expenses)}.`;
    }

    if (normalized.includes('revenue') || normalized.includes('sales')) {
      return `Your total recorded revenue is ${this.currency(context.revenue)} across ${
        context.transactions.filter((transaction) => transaction.type === 'sale').length
      } sales.`;
    }

    if (normalized.includes('summary')) {
      return `Business summary: revenue ${this.currency(context.revenue)}, expenses ${this.currency(context.expenses)}, profit ${this.currency(
        context.profit,
      )}, and inventory value ${this.currency(context.inventoryValue)}.`;
    }

    return `I found ${context.transactions.length} transactions, ${this.currency(context.revenue)} revenue, and ${this.currency(
      context.inventoryValue,
    )} in inventory value.`;
  }

  private currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }
}
