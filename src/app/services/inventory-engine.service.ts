import { Injectable } from '@angular/core';

import { InventoryItem, InventoryStatus } from '../models/inventory.model';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryEngineService {
  applyTransaction(inventory: InventoryItem[], transaction: Transaction): InventoryItem[] {
    if (transaction.type === 'expense') {
      return inventory;
    }

    const itemName = this.titleCase(transaction.item);
    const index = inventory.findIndex((item) => this.normalize(item.name) === this.normalize(itemName));
    const nextInventory = [...inventory];
    const existing = index >= 0 ? nextInventory[index] : this.createItem(itemName, transaction);
    const stockDelta = transaction.type === 'sale' ? -transaction.quantity : transaction.quantity;
    const stock = Math.max(0, existing.stock + stockDelta);
    const updated: InventoryItem = {
      ...existing,
      stock,
      costPrice: transaction.type === 'purchase' && transaction.unitPrice > 0 ? transaction.unitPrice : existing.costPrice,
      sellingPrice: transaction.type === 'sale' && transaction.unitPrice > 0 ? transaction.unitPrice : existing.sellingPrice,
      status: this.getStatus(stock),
      updatedAt: transaction.timestamp,
    };

    if (index >= 0) {
      nextInventory[index] = updated;
      return nextInventory;
    }

    return [...nextInventory, updated];
  }

  getItemCost(inventory: InventoryItem[], itemName: string): number {
    return inventory.find((item) => this.normalize(item.name) === this.normalize(itemName))?.costPrice ?? 0;
  }

  private createItem(name: string, transaction: Transaction): InventoryItem {
    return {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      stock: 0,
      costPrice: transaction.type === 'purchase' ? transaction.unitPrice : 0,
      sellingPrice: transaction.type === 'sale' ? transaction.unitPrice : 0,
      status: 'Critical',
      updatedAt: transaction.timestamp,
    };
  }

  private getStatus(stock: number): InventoryStatus {
    if (stock <= 10) {
      return 'Critical';
    }

    if (stock <= 40) {
      return 'Low';
    }

    return 'Healthy';
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/s$/, '').trim();
  }

  private titleCase(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
