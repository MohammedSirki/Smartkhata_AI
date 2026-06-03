import { Injectable } from '@angular/core';

import {
  assistantPrompts,
  dashboardStats,
  inventoryItems,
  reportCards,
  reports,
  transactions,
  userProfile,
} from '../data/mock-data';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  getDashboardStats() {
    return dashboardStats;
  }

  getTransactions() {
    return transactions;
  }

  getInventory() {
    return inventoryItems;
  }

  getReportCards() {
    return reportCards;
  }

  getReports() {
    return reports;
  }

  getAssistantPrompts() {
    return assistantPrompts;
  }

  getUserProfile() {
    return userProfile;
  }

  getAssistantResponse(prompt: string): string {
    const normalized = prompt.toLowerCase();

    if (normalized.includes('profit')) {
      return 'You made \u20b942,580 profit this month, 12% higher than last month.';
    }

    if (normalized.includes('margin') || normalized.includes('product')) {
      return 'Mobile Chargers currently give your highest margin at 31%.';
    }

    if (normalized.includes('inventory') || normalized.includes('stock') || normalized.includes('low')) {
      return 'Earbuds are running low with only 19 units remaining.';
    }

    if (normalized.includes('summary')) {
      return 'Today you recorded \u20b952,000 revenue, \u20b99,800 expenses, and \u20b918,400 profit.';
    }

    if (normalized.includes('expense')) {
      return 'Rent is your biggest expense this month at \u20b98,000.';
    }

    return 'SmartKhata found stable cashflow, improving profit, and one critical inventory item that needs attention.';
  }
}
