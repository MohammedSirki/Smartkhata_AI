import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import gsap from 'gsap';

import { ReportPeriod } from '../../models/report.model';
import { AccountingStateService } from '../../services/accounting-state.service';

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements AfterViewInit {
  private readonly accounting = inject(AccountingStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly tabs: ReportPeriod[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  protected readonly activeTab = signal<ReportPeriod>('Monthly');
  protected readonly reportCards = computed(() => {
    const report = this.accounting.getReport(this.activeTab());
    return [
      { label: 'Total Sales', value: this.currency(report.revenue) },
      { label: 'Total Expenses', value: this.currency(report.expenses) },
      { label: 'Net Profit', value: this.currency(report.profit) },
      { label: 'Inventory', value: this.currency(report.inventoryValue) },
      { label: 'GST Placeholder', value: this.currency(Math.max(report.revenue * 0.18, 0)) },
      { label: 'Transactions', value: String(report.transactionCount) },
    ];
  });
  protected readonly reports = computed(() => this.accounting.getReportRows());
  protected readonly sections = ['Sales Report', 'Expense Report', 'Profit/Loss Report', 'Inventory Report', 'GST Summary'];

  ngAfterViewInit(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.from('.page-head, .tabs, .report-card, .panel, .report-row', {
      opacity: 0,
      y: 18,
      duration: 0.55,
      stagger: 0.055,
      ease: 'power3.out',
    });
  }

  protected exportReports(): void {
    if (!this.isBrowser) {
      return;
    }

    navigator.clipboard?.writeText(this.accounting.exportReports('csv'));
  }

  private currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }
}
