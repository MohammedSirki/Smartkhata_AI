import { Injectable, inject } from '@angular/core';

import { InventoryItem } from '../models/inventory.model';
import { ReportPeriod, ReportRow, ReportSummary } from '../models/report.model';
import { Transaction } from '../models/transaction.model';
import { ProfitEngineService } from './profit-engine.service';

@Injectable({
  providedIn: 'root',
})
export class ReportEngineService {
  private readonly profitEngine = inject(ProfitEngineService);

  generateReports(transactions: Transaction[], inventory: InventoryItem[]): ReportSummary[] {
    return (['Daily', 'Weekly', 'Monthly', 'Yearly'] as ReportPeriod[]).map((period) =>
      this.generateReport(period, transactions, inventory),
    );
  }

  generateReport(period: ReportPeriod, transactions: Transaction[], inventory: InventoryItem[]): ReportSummary {
    const scopedTransactions = this.filterTransactions(period, transactions);

    return {
      period,
      revenue: this.profitEngine.calculateRevenue(scopedTransactions),
      expenses: this.profitEngine.calculateExpenses(scopedTransactions),
      profit: this.profitEngine.calculateProfit(scopedTransactions),
      grossMargin: this.profitEngine.calculateGrossMargin(scopedTransactions),
      inventoryValue: this.profitEngine.calculateInventoryValue(inventory),
      transactionCount: scopedTransactions.length,
      generatedAt: new Date().toISOString(),
    };
  }

  buildReportRows(transactions: Transaction[]): ReportRow[] {
    return [...transactions]
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
      .map((transaction) => ({
        date: new Intl.DateTimeFormat('en-IN').format(new Date(transaction.timestamp)),
        type: this.titleCase(transaction.type),
        description: transaction.description,
        amount: this.formatCurrency(transaction.total),
        status: transaction.status,
      }));
  }

  private filterTransactions(period: ReportPeriod, transactions: Transaction[]): Transaction[] {
    const now = new Date();

    return transactions.filter((transaction) => {
      const date = new Date(transaction.timestamp);

      if (period === 'Daily') {
        return date.toDateString() === now.toDateString();
      }

      if (period === 'Weekly') {
        const diff = now.getTime() - date.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }

      if (period === 'Monthly') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }

      return date.getFullYear() === now.getFullYear();
    });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
