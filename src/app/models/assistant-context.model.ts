import { InventoryItem } from './inventory.model';
import { ReportSummary } from './report.model';
import { Transaction } from './transaction.model';

export interface AssistantContext {
  transactions: Transaction[];
  inventory: InventoryItem[];
  reports: ReportSummary[];
  revenue: number;
  expenses: number;
  profit: number;
  inventoryValue: number;
  lowInventory: InventoryItem[];
  todaySales: number;
}
