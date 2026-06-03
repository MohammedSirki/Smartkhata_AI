export interface DashboardStat {
  label: string;
  value: string;
  trend: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Transaction {
  description: string;
  amount: string;
  type: 'Sale' | 'Purchase' | 'Expense';
  date?: string;
  status?: string;
}

export interface InventoryItem {
  name: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  status: 'Healthy' | 'Low' | 'Critical';
}

export interface ReportRow {
  date: string;
  type: string;
  description: string;
  amount: string;
  status: string;
}

export interface UserProfile {
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  gstNumber: string;
  currency: string;
  language: string;
  theme: string;
  notifications: boolean;
}

export const dashboardStats: DashboardStat[] = [
  { label: "Today's Revenue", value: '\u20b952,000', trend: '+18%', sentiment: 'positive' },
  { label: 'Monthly Profit', value: '\u20b918,400', trend: '+12%', sentiment: 'positive' },
  { label: 'Expenses', value: '\u20b99,800', trend: '-4%', sentiment: 'negative' },
  { label: 'Inventory Health', value: '98%', trend: 'Healthy', sentiment: 'neutral' },
];

export const transactions: Transaction[] = [
  { description: 'Sold 2 Chargers', amount: '\u20b91,000', type: 'Sale', date: 'Today', status: 'Recorded' },
  { description: 'Bought 50 Pens', amount: '\u20b9250', type: 'Purchase', date: 'Today', status: 'Updated' },
  { description: 'Paid Rent', amount: '\u20b98,000', type: 'Expense', date: 'Yesterday', status: 'Cleared' },
  { description: 'Sold 5 Covers', amount: '\u20b91,250', type: 'Sale', date: 'Yesterday', status: 'Recorded' },
];

export const inventoryItems: InventoryItem[] = [
  { name: 'Chargers', stock: 128, costPrice: 400, sellingPrice: 500, status: 'Healthy' },
  { name: 'Mobile Covers', stock: 42, costPrice: 80, sellingPrice: 150, status: 'Low' },
  { name: 'Earbuds', stock: 19, costPrice: 700, sellingPrice: 999, status: 'Critical' },
  { name: 'Power Banks', stock: 87, costPrice: 900, sellingPrice: 1299, status: 'Healthy' },
  { name: 'Pens', stock: 250, costPrice: 5, sellingPrice: 10, status: 'Healthy' },
];

export const reportCards = [
  { label: 'Total Sales', value: '\u20b92,45,000' },
  { label: 'Total Expenses', value: '\u20b982,000' },
  { label: 'Net Profit', value: '\u20b91,63,000' },
  { label: 'GST Summary', value: '\u20b918,400' },
];

export const reports: ReportRow[] = [
  { date: '2026-06-03', type: 'Sales Report', description: 'Chargers and covers sales', amount: '\u20b918,500', status: 'Ready' },
  { date: '2026-06-02', type: 'Expense Report', description: 'Shop rent and utilities', amount: '\u20b910,800', status: 'Reviewed' },
  { date: '2026-06-01', type: 'Inventory Report', description: 'Low stock movement', amount: '\u20b932,000', status: 'Action needed' },
  { date: '2026-05-31', type: 'GST Summary', description: 'Monthly GST estimate', amount: '\u20b918,400', status: 'Draft' },
];

export const assistantPrompts = [
  'How much profit did I make this month?',
  'Which product gives highest margin?',
  'What inventory is running low?',
  "Create today's business summary.",
  'Show my biggest expense.',
];

export const userProfile: UserProfile = {
  ownerName: 'Aarav Mehta',
  businessName: 'Mehta Traders',
  email: 'aarav@example.com',
  phone: '+91 98765 43210',
  gstNumber: '27ABCDE1234F1Z5',
  currency: 'INR',
  language: 'English',
  theme: 'Dark',
  notifications: true,
};
