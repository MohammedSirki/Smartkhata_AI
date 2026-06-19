export type InventoryStatus = 'Healthy' | 'Low' | 'Critical';

export interface InventoryItem {
  id: string;
  name: string;
  normalizedName?: string;
  aliases?: string[];
  stock: number;
  costPrice: number;
  sellingPrice: number;
  status: InventoryStatus;
  updatedAt: string;
}
