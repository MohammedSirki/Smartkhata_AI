import { Injectable } from '@angular/core';

import { InventoryItem } from '../models/inventory.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class ProfitEngineService {
  calculateRevenue(transactions: Transaction[]): number {
    return transactions.filter((transaction) => transaction.type === 'sale').reduce((total, transaction) => total + transaction.total, 0);
  }

  calculateExpenses(transactions: Transaction[]): number {
    return transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.total, 0);
  }

  calculateProfit(transactions: Transaction[]): number {
    return this.calculateRevenue(transactions) - this.calculateExpenses(transactions) - this.calculateCostOfGoodsSold(transactions);
  }

  calculateGrossMargin(transactions: Transaction[]): number {
    const revenue = this.calculateRevenue(transactions);
    if (revenue <= 0) {
      return 0;
    }

    return ((revenue - this.calculateCostOfGoodsSold(transactions)) / revenue) * 100;
  }

  calculateInventoryValue(inventory: InventoryItem[]): number {
    return inventory.reduce((total, item) => total + item.stock * item.costPrice, 0);
  }

  calculateCostOfGoodsSold(transactions: Transaction[]): number {
    return transactions.reduce((total, transaction) => total + (transaction.cogs ?? 0), 0);
  }
}
