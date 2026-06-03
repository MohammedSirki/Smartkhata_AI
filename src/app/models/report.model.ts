export type ReportPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

export interface ReportSummary {
  period: ReportPeriod;
  revenue: number;
  expenses: number;
  profit: number;
  grossMargin: number;
  inventoryValue: number;
  transactionCount: number;
  generatedAt: string;
}

export interface ReportRow {
  date: string;
  type: string;
  description: string;
  amount: string;
  status: string;
}
