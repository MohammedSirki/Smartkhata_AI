import { Injectable, inject } from '@angular/core';

import { AssistantContext } from '../models/assistant-context.model';
import { InventoryItem } from '../models/inventory.model';
import { ReportSummary } from '../models/report.model';
import { Transaction } from '../models/transaction.model';
import { ProfitEngineService } from './profit-engine.service';

@Injectable({
  providedIn: 'root',
})
export class AssistantContextService {
  private readonly profitEngine = inject(ProfitEngineService);

  buildContext(transactions: Transaction[], inventory: InventoryItem[], reports: ReportSummary[]): AssistantContext {
    return {
      transactions,
      inventory,
      reports,
      revenue: this.profitEngine.calculateRevenue(transactions),
      expenses: this.profitEngine.calculateExpenses(transactions),
      profit: this.profitEngine.calculateProfit(transactions),
      inventoryValue: this.profitEngine.calculateInventoryValue(inventory),
      lowInventory: inventory.filter((item) => item.status === 'Low' || item.status === 'Critical'),
      todaySales: this.getTodaySales(transactions),
    };
  }

  private getTodaySales(transactions: Transaction[]): number {
    const today = new Date().toDateString();
    return transactions
      .filter((transaction) => transaction.type === 'sale' && new Date(transaction.timestamp).toDateString() === today)
      .reduce((total, transaction) => total + transaction.total, 0);
  }
}
