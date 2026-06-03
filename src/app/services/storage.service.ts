import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { InventoryItem } from '../models/inventory.model';
import { ReportSummary } from '../models/report.model';
import { Transaction } from '../models/transaction.model';

interface SmartKhataBackup {
  transactions: Transaction[];
  inventory: InventoryItem[];
  reports: ReportSummary[];
  exportedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly keys = {
    transactions: 'smartkhata.transactions',
    inventory: 'smartkhata.inventory',
    reports: 'smartkhata.reports',
  };

  saveTransactions(transactions: Transaction[]): void {
    this.save(this.keys.transactions, transactions);
  }

  getTransactions(): Transaction[] {
    return this.get<Transaction[]>(this.keys.transactions, []);
  }

  saveInventory(inventory: InventoryItem[]): void {
    this.save(this.keys.inventory, inventory);
  }

  getInventory(): InventoryItem[] {
    return this.get<InventoryItem[]>(this.keys.inventory, []);
  }

  saveReports(reports: ReportSummary[]): void {
    this.save(this.keys.reports, reports);
  }

  getReports(): ReportSummary[] {
    return this.get<ReportSummary[]>(this.keys.reports, []);
  }

  createBackup(): SmartKhataBackup {
    return {
      transactions: this.getTransactions(),
      inventory: this.getInventory(),
      reports: this.getReports(),
      exportedAt: new Date().toISOString(),
    };
  }

  restoreBackup(backup: SmartKhataBackup): void {
    this.saveTransactions(backup.transactions ?? []);
    this.saveInventory(backup.inventory ?? []);
    this.saveReports(backup.reports ?? []);
  }

  clearAllData(): void {
    if (!this.isBrowser) {
      return;
    }

    Object.values(this.keys).forEach((key) => localStorage.removeItem(key));
  }

  private save<T>(key: string, value: T): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(value));
  }

  private get<T>(key: string, fallback: T): T {
    if (!this.isBrowser) {
      return fallback;
    }

    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}
