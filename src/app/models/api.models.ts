export interface User {
  id: string;
  fullName: string;
  email: string;
  businessName?: string;
  business?: unknown;
  role?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export type ApiTransactionType = 'sale' | 'purchase' | 'expense' | 'return';

export interface ApiTransaction {
  _id: string;
  user: string;
  business: string;
  rawText: string;
  type: ApiTransactionType;
  item: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMode: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiTransactionCreateData {
  transaction: ApiTransaction;
  inventoryUpdated: boolean;
}

export interface ApiInventoryItem {
  _id: string;
  user: string;
  business: string;
  name: string;
  normalizedName?: string;
  aliases?: string[];
  stock: number;
  costPrice: number;
  sellingPrice: number;
  status: 'healthy' | 'low' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  todayRevenue: number;
  todaySalesCount: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  monthlyExpenseCount: number;
  transactionCount: number;
  inventoryCount: number;
  lowStockCount: number;
  recentTransactions: ApiTransaction[];
  inventoryHealth: number;
}

export interface AiInsight {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface ReportSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  inventoryValue: number;
  monthlyBreakdown: {
    month: string;
    sales: number;
    purchases: number;
    expenses: number;
    netProfit: number;
    transactionCount: number;
  }[];
}

export interface AssistantResponse {
  success: boolean;
  data?: {
    reply?: string;
    response?: string;
    answeredBy?: 'groq' | 'fallback';
  };
  response?: string;
}

export interface AssistantReply {
  reply: string;
  answeredBy: 'groq' | 'fallback';
}

export interface ProfileData {
  fullName?: string;
  ownerName: string;
  businessName: string;
  email: string;
  phone: string;
  gstNumber: string;
  currency: string;
  language: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
}

export interface ApiDataResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
