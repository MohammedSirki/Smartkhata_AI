import { Injectable, computed, inject, signal } from '@angular/core';

import { InventoryItem } from '../models/inventory.model';
import { ReportPeriod } from '../models/report.model';
import { Transaction } from '../models/transaction.model';
import { AssistantContextService } from './assistant-context.service';
import { InventoryEngineService } from './inventory-engine.service';
import { ProfitEngineService } from './profit-engine.service';
import { ReportEngineService } from './report-engine.service';
import { StorageService } from './storage.service';
import { TransactionEngineService } from './transaction-engine.service';

@Injectable({
  providedIn: 'root',
})
export class AccountingStateService {
  private readonly storage = inject(StorageService);
  private readonly transactionEngine = inject(TransactionEngineService);
  private readonly inventoryEngine = inject(InventoryEngineService);
  private readonly profitEngine = inject(ProfitEngineService);
  private readonly reportEngine = inject(ReportEngineService);
  private readonly assistantContextEngine = inject(AssistantContextService);

  readonly transactions = signal<Transaction[]>(this.storage.getTransactions());
  readonly inventory = signal<InventoryItem[]>(this.storage.getInventory());
  readonly reports = signal(this.storage.getReports());

  readonly sortedTransactions = computed(() =>
    [...this.transactions()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
  );
  readonly revenue = computed(() => this.profitEngine.calculateRevenue(this.transactions()));
  readonly expenses = computed(() => this.profitEngine.calculateExpenses(this.transactions()));
  readonly profit = computed(() => this.profitEngine.calculateProfit(this.transactions()));
  readonly grossMargin = computed(() => this.profitEngine.calculateGrossMargin(this.transactions()));
  readonly inventoryValue = computed(() => this.profitEngine.calculateInventoryValue(this.inventory()));
  readonly assistantContext = computed(() =>
    this.assistantContextEngine.buildContext(this.transactions(), this.inventory(), this.reports()),
  );

  addTransaction(entry: string): Transaction {
    const parsed = this.transactionEngine.parse(entry);
    const cogs = parsed.type === 'sale' ? this.inventoryEngine.getItemCost(this.inventory(), parsed.item) * parsed.quantity : 0;
    const transaction = this.transactionEngine.createTransaction(entry, cogs);
    const nextTransactions = [...this.transactions(), transaction];
    const nextInventory = this.inventoryEngine.applyTransaction(this.inventory(), transaction);
    const nextReports = this.reportEngine.generateReports(nextTransactions, nextInventory);

    this.transactions.set(nextTransactions);
    this.inventory.set(nextInventory);
    this.reports.set(nextReports);
    this.persist();

    return transaction;
  }

  getReport(period: ReportPeriod) {
    return this.reports().find((report) => report.period === period) ?? this.reportEngine.generateReport(period, this.transactions(), this.inventory());
  }

  getReportRows() {
    return this.reportEngine.buildReportRows(this.transactions());
  }

  clearAllData(): void {
    this.transactions.set([]);
    this.inventory.set([]);
    this.reports.set([]);
    this.storage.clearAllData();
  }

  backupData(): string {
    return JSON.stringify(this.storage.createBackup(), null, 2);
  }

  restoreData(rawBackup: string): void {
    const backup = JSON.parse(rawBackup) as {
      transactions?: Transaction[];
      inventory?: InventoryItem[];
    };
    const nextTransactions = backup.transactions ?? [];
    const nextInventory = backup.inventory ?? [];
    const nextReports = this.reportEngine.generateReports(nextTransactions, nextInventory);

    this.transactions.set(nextTransactions);
    this.inventory.set(nextInventory);
    this.reports.set(nextReports);
    this.persist();
  }

  exportTransactions(format: 'json' | 'csv'): string {
    return format === 'json' ? JSON.stringify(this.sortedTransactions(), null, 2) : this.toCsv(this.sortedTransactions());
  }

  exportInventory(format: 'json' | 'csv'): string {
    return format === 'json' ? JSON.stringify(this.inventory(), null, 2) : this.toCsv(this.inventory());
  }

  exportReports(format: 'json' | 'csv'): string {
    return format === 'json' ? JSON.stringify(this.reports(), null, 2) : this.toCsv(this.reports());
  }

  private persist(): void {
    this.storage.saveTransactions(this.transactions());
    this.storage.saveInventory(this.inventory());
    this.storage.saveReports(this.reports());
  }

  private toCsv<T extends object>(rows: T[]): string {
    if (rows.length === 0) {
      return '';
    }

    const headers = Object.keys(rows[0]);
    const csvRows = rows.map((row) =>
      headers
        .map((header) => {
          const value = String((row as Record<string, unknown>)[header] ?? '').replace(/"/g, '""');
          return `"${value}"`;
        })
        .join(','),
    );

    return [headers.join(','), ...csvRows].join('\n');
  }
}
