import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import gsap from 'gsap';

import { ReportPeriod } from '../../models/report.model';
import { AccountingStateService } from '../../services/accounting-state.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements AfterViewInit, OnInit {
  private readonly accounting = inject(AccountingStateService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly tabs: ReportPeriod[] = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  protected readonly activeTab = signal<ReportPeriod>('Monthly');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly reportCards = computed(() => {
    const summary = this.accounting.reportSummary();
    const report = this.accounting.getReport(this.activeTab());
    return [
      { label: 'Total Sales', value: this.currency(summary?.totalSales ?? report.revenue) },
      { label: 'Total Purchases', value: this.currency(summary?.totalPurchases ?? 0) },
      { label: 'Total Expenses', value: this.currency(summary?.totalExpenses ?? report.expenses) },
      { label: 'Net Profit', value: this.currency(summary?.netProfit ?? report.profit) },
      { label: 'Inventory Value', value: this.currency(summary?.inventoryValue ?? report.inventoryValue) },
      { label: 'Transactions', value: String(summary?.transactionCount ?? report.transactionCount) },
    ];
  });
  protected readonly reports = computed(() => this.accounting.getReportRows());
  protected readonly sections = ['Sales Report', 'Expense Report', 'Profit/Loss Report', 'Inventory Report', 'GST Summary'];

  ngOnInit(): void {
    this.loading.set(true);
    this.accounting.loadReports().subscribe({
      next: () => this.loading.set(false),
      error: (error) => {
        const message = this.errorMessage(error);
        this.loading.set(false);
        this.error.set(message);
        this.toast.error(message);
      },
    });
    this.accounting.loadTransactions().subscribe();
    this.accounting.loadInventory().subscribe();
  }

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

  protected exportReports(format: 'json' | 'csv'): void {
    if (!this.isBrowser) {
      return;
    }

    this.accounting.downloadExport('reports', format).subscribe({
      next: (response) => {
        this.downloadBlob(response.body, this.filename(response.headers.get('content-disposition'), `reports.${format}`));
        this.toast.success('Export complete');
      },
      error: (error) => this.toast.error(this.errorMessage(error)),
    });
  }

  protected exportPdf(): void {
    if (!this.isBrowser) {
      return;
    }

    const summary = this.accounting.reportSummary();
    const popup = window.open('', '_blank', 'width=900,height=1100');
    if (!popup) {
      this.toast.error('Could not open PDF window.');
      return;
    }

    popup.document.write(this.pdfHtml(summary));
    popup.document.close();
    popup.focus();
    popup.print();
    this.toast.success('Export complete');
  }

  private currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }

  private errorMessage(error: unknown): string {
    return typeof error === 'object' && error !== null && 'error' in error
      ? ((error as { error?: { message?: string } }).error?.message ?? 'Could not load reports.')
      : 'Could not load reports.';
  }

  private pdfHtml(summary = this.accounting.reportSummary()): string {
    const generatedAt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    const user = this.auth.getCurrentUser();
    const recentTransactions = this.accounting.sortedTransactions().slice(0, 8);
    const inventory = this.accounting.inventory();

    return `
      <!doctype html>
      <html>
        <head>
          <title>SmartKhata Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #151515; padding: 32px; }
            h1, h2 { margin: 0 0 10px; }
            section { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .card { border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>${this.escapeHtml(user?.businessName || 'SmartKhata AI')}</h1>
          <p>Date Generated: ${generatedAt}</p>
          <section class="grid">
            <div class="card"><strong>Revenue</strong><br>${this.currency(summary?.totalSales ?? 0)}</div>
            <div class="card"><strong>Expenses</strong><br>${this.currency((summary?.totalPurchases ?? 0) + (summary?.totalExpenses ?? 0))}</div>
            <div class="card"><strong>Profit</strong><br>${this.currency(summary?.netProfit ?? 0)}</div>
          </section>
          <section>
            <h2>Inventory Summary</h2>
            <p>${inventory.length} products. Inventory value ${this.currency(summary?.inventoryValue ?? 0)}.</p>
          </section>
          <section>
            <h2>Recent Transactions</h2>
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                ${recentTransactions
                  .map(
                    (transaction) =>
                      `<tr><td>${this.escapeHtml(this.formatPdfDate(transaction.timestamp))}</td><td>${this.escapeHtml(transaction.type)}</td><td>${this.escapeHtml(transaction.description)}</td><td>${this.escapeHtml(this.currency(transaction.total))}</td></tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </section>
        </body>
      </html>
    `;
  }

  private downloadBlob(blob: Blob | null, filename: string): void {
    if (!blob || !this.isBrowser) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private filename(disposition: string | null, fallback: string): string {
    return disposition?.match(/filename="([^"]+)"/)?.[1] ?? fallback;
  }

  private formatPdfDate(timestamp: string): string {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(timestamp));
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] || char);
  }
}
