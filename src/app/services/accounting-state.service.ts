import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';

import {
  ApiDataResponse,
  ApiInventoryItem,
  ApiListResponse,
  ApiTransaction,
  ApiTransactionCreateData,
  AiInsight,
  AssistantReply,
  AssistantResponse,
  DashboardData,
  ReportSummary as ApiReportSummary,
} from '../models/api.models';
import { InventoryItem, InventoryStatus } from '../models/inventory.model';
import { ReportPeriod, ReportRow, ReportSummary } from '../models/report.model';
import { Transaction } from '../models/transaction.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AccountingStateService {
  private readonly api = inject(ApiService);

  readonly transactions = signal<Transaction[]>([]);
  readonly inventory = signal<InventoryItem[]>([]);
  readonly reports = signal<ReportSummary[]>([]);
  readonly dashboard = signal<DashboardData | null>(null);
  readonly aiInsights = signal<AiInsight[]>([]);
  readonly reportSummary = signal<ApiReportSummary | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly sortedTransactions = computed(() =>
    [...this.transactions()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
  );
  readonly revenue = computed(() => this.dashboard()?.monthlyRevenue ?? this.sumTransactions(['sale']));
  readonly expenses = computed(() => this.dashboard()?.monthlyExpenses ?? this.sumTransactions(['expense', 'purchase']));
  readonly profit = computed(() => this.dashboard()?.monthlyProfit ?? this.revenue() - this.expenses());
  readonly grossMargin = computed(() => (this.revenue() > 0 ? (this.profit() / this.revenue()) * 100 : 0));
  readonly inventoryValue = computed(() => this.reportSummary()?.inventoryValue ?? this.inventory().reduce((total, item) => total + item.stock * item.costPrice, 0));
  readonly assistantContext = computed(() => ({
    transactions: this.transactions(),
    inventory: this.inventory(),
    reports: this.reports(),
  }));

  loadAll(): Observable<unknown> {
    this.loading.set(true);
    this.error.set('');

    return forkJoin({
      dashboard: this.loadDashboard(),
      transactions: this.loadTransactions(),
      inventory: this.loadInventory(),
      reports: this.loadReports(),
      aiInsights: this.loadAiInsights(),
    }).pipe(finalize(() => this.loading.set(false)));
  }

  loadDashboard(): Observable<DashboardData> {
    return this.api.get<ApiDataResponse<DashboardData>>('/dashboard').pipe(
      map((response) => response.data),
      tap((data) => this.dashboard.set(data)),
    );
  }

  loadTransactions(): Observable<Transaction[]> {
    return this.api.get<ApiListResponse<ApiTransaction>>('/transactions').pipe(
      map((response) => response.data.map((transaction) => this.mapTransaction(transaction))),
      tap((transactions) => this.transactions.set(transactions)),
    );
  }

  loadInventory(): Observable<InventoryItem[]> {
    return this.api.get<ApiListResponse<ApiInventoryItem>>('/inventory').pipe(
      map((response) => response.data.map((item) => this.mapInventoryItem(item))),
      tap((inventory) => this.inventory.set(inventory)),
    );
  }

  loadReports(): Observable<ApiReportSummary> {
    return this.api.get<ApiDataResponse<ApiReportSummary>>('/reports/summary').pipe(
      map((response) => response.data),
      tap((summary) => {
        this.reportSummary.set(summary);
        this.reports.set(this.buildReportSummaries(summary));
      }),
    );
  }

  loadAiInsights(): Observable<AiInsight[]> {
    return this.api.get<ApiDataResponse<{ insights: AiInsight[]; generatedBy: string }>>('/ai/insights').pipe(
      map((response) => response.data.insights),
      tap((insights) => this.aiInsights.set(insights)),
      catchError(() => {
        this.aiInsights.set([]);
        return of([]);
      }),
    );
  }

  addTransaction(entry: string): Observable<Transaction> {
    return this.api.post<ApiDataResponse<ApiTransaction | ApiTransactionCreateData> & { parsedBy?: Transaction['parsedBy'] }>('/transactions', { rawText: entry }).pipe(
      map((response) => {
        const data = response.data;
        const transaction = 'transaction' in data ? data.transaction : data;
        return this.mapTransaction(transaction, response.parsedBy);
      }),
      switchMap((transaction) =>
        forkJoin({
          dashboard: this.loadDashboard(),
          transactions: this.loadTransactions(),
          inventory: this.loadInventory(),
          reports: this.loadReports(),
          aiInsights: this.loadAiInsights(),
        }).pipe(map(() => transaction)),
      ),
    );
  }

  deleteTransaction(id: string): Observable<void> {
    return this.api.delete<ApiDataResponse<ApiTransaction>>(`/transactions/${id}`).pipe(
      switchMap(() =>
        forkJoin({
          dashboard: this.loadDashboard(),
          transactions: this.loadTransactions(),
          inventory: this.loadInventory(),
          reports: this.loadReports(),
          aiInsights: this.loadAiInsights(),
        }),
      ),
      map(() => undefined),
    );
  }

  deleteInventoryItem(id: string): Observable<void> {
    return this.api.delete<ApiDataResponse<ApiInventoryItem>>(`/inventory/${id}`).pipe(
      switchMap(() =>
        forkJoin({
          dashboard: this.loadDashboard(),
          inventory: this.loadInventory(),
          reports: this.loadReports(),
          aiInsights: this.loadAiInsights(),
        }),
      ),
      map(() => undefined),
    );
  }

  undoLastTransaction(): Observable<void> {
    return this.api.post<ApiDataResponse<unknown>>('/transactions/undo', {}).pipe(
      switchMap(() =>
        forkJoin({
          dashboard: this.loadDashboard(),
          transactions: this.loadTransactions(),
          inventory: this.loadInventory(),
          reports: this.loadReports(),
          aiInsights: this.loadAiInsights(),
        }),
      ),
      map(() => undefined),
    );
  }

  downloadExport(area: 'transactions' | 'inventory' | 'reports', format: 'json' | 'csv') {
    return this.api.download(`/export/${area}?format=${format}`);
  }

  askAssistant(message: string): Observable<AssistantReply> {
    return this.api.post<AssistantResponse>('/assistant/chat', { message }).pipe(
      map((response) => ({
        reply: response.data?.reply || response.data?.response || response.response || 'SmartKhata could not answer that yet.',
        answeredBy: response.data?.answeredBy || 'fallback',
      })),
    );
  }

  getReport(period: ReportPeriod): ReportSummary {
    return this.reports().find((report) => report.period === period) ?? this.emptyReport(period);
  }

  getReportRows(): ReportRow[] {
    return this.sortedTransactions().map((transaction) => ({
      date: new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(transaction.timestamp)),
      type: transaction.type,
      description: transaction.description,
      amount: this.currency(transaction.total),
      status: transaction.status,
    }));
  }

  clearAllData(): void {
    this.transactions.set([]);
    this.inventory.set([]);
    this.reports.set([]);
    this.dashboard.set(null);
    this.reportSummary.set(null);
  }

  backupData(): string {
    return JSON.stringify(
      {
        transactions: this.transactions(),
        inventory: this.inventory(),
        reports: this.reports(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  restoreData(rawBackup: string): void {
    void rawBackup;
    throw new Error('Restore is unavailable while SmartKhata is connected to MongoDB.');
  }

  exportTransactions(format: 'json' | 'csv'): string {
    return format === 'json' ? JSON.stringify(this.sortedTransactions(), null, 2) : this.toCsv(this.sortedTransactions());
  }

  exportInventory(format: 'json' | 'csv'): string {
    return format === 'json' ? JSON.stringify(this.inventory(), null, 2) : this.toCsv(this.inventory());
  }

  exportReports(format: 'json' | 'csv'): string {
    return format === 'json' ? JSON.stringify(this.reportSummary(), null, 2) : this.toCsv(this.getReportRows());
  }

  private sumTransactions(types: string[]): number {
    return this.transactions()
      .filter((transaction) => types.includes(transaction.type))
      .reduce((total, transaction) => total + transaction.total, 0);
  }

  private mapTransaction(transaction: ApiTransaction, parsedBy?: Transaction['parsedBy']): Transaction {
    return {
      id: transaction._id,
      type: transaction.type,
      item: transaction.item,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      total: transaction.total,
      description: transaction.description || transaction.rawText,
      status: 'Recorded',
      timestamp: transaction.createdAt,
      parsedBy,
    };
  }

  private mapInventoryItem(item: ApiInventoryItem): InventoryItem {
    return {
      id: item._id,
      name: item.name,
      normalizedName: item.normalizedName,
      aliases: item.aliases,
      stock: item.stock,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      status: this.mapInventoryStatus(item.status),
      updatedAt: item.updatedAt,
    };
  }

  private mapInventoryStatus(status: ApiInventoryItem['status']): InventoryStatus {
    if (status === 'critical') return 'Critical';
    if (status === 'low') return 'Low';
    return 'Healthy';
  }

  private buildReportSummaries(summary: ApiReportSummary): ReportSummary[] {
    const base = {
      revenue: summary.totalSales,
      expenses: summary.totalPurchases + summary.totalExpenses,
      profit: summary.netProfit,
      grossMargin: summary.totalSales > 0 ? (summary.netProfit / summary.totalSales) * 100 : 0,
      inventoryValue: summary.inventoryValue,
      transactionCount: summary.transactionCount,
      generatedAt: new Date().toISOString(),
    };

    return (['Daily', 'Weekly', 'Monthly', 'Yearly'] as ReportPeriod[]).map((period) => ({
      period,
      ...base,
    }));
  }

  private emptyReport(period: ReportPeriod): ReportSummary {
    return {
      period,
      revenue: 0,
      expenses: 0,
      profit: 0,
      grossMargin: 0,
      inventoryValue: 0,
      transactionCount: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  private currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }

  private toCsv<T extends object>(rows: T[] | T | null): string {
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    if (list.length === 0) {
      return '';
    }

    const headers = Object.keys(list[0]);
    const csvRows = list.map((row) =>
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
