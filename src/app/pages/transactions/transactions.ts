import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

import { Transaction, TransactionType } from '../../models/transaction.model';
import { AccountingStateService } from '../../services/accounting-state.service';
import { ToastService } from '../../services/toast.service';

type TransactionFilter = 'all' | TransactionType;

@Component({
  selector: 'app-transactions-page',
  imports: [FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements AfterViewInit, OnInit {
  private readonly accounting = inject(AccountingStateService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly query = signal('');
  protected readonly activeFilter = signal<TransactionFilter>('all');
  protected readonly selected = signal<Transaction | null>(null);
  protected readonly copied = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly deletingId = signal('');
  protected readonly pendingDelete = signal<Transaction | null>(null);
  protected readonly filters: TransactionFilter[] = ['all', 'sale', 'purchase', 'expense', 'return'];
  protected readonly transactions = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.accounting.sortedTransactions().filter((transaction) => {
      const matchesFilter = filter === 'all' || transaction.type === filter;
      const matchesQuery =
        transaction.description.toLowerCase().includes(query) ||
        transaction.item.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.accounting.loadTransactions().subscribe({
      next: () => this.loading.set(false),
      error: (error) => {
        const message = this.errorMessage(error);
        this.loading.set(false);
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.from('.page-head, .toolbar, .panel, .transaction-row', {
      opacity: 0,
      y: 18,
      duration: 0.55,
      stagger: 0.055,
      ease: 'power3.out',
    });
  }

  protected selectTransaction(transaction: Transaction): void {
    this.selected.set(transaction);
  }

  protected export(format: 'json' | 'csv'): void {
    if (!this.isBrowser) {
      return;
    }

    this.accounting.downloadExport('transactions', format).subscribe({
      next: (response) => {
        this.downloadBlob(response.body, this.filename(response.headers.get('content-disposition'), `transactions.${format}`));
        this.copied.set(`${format.toUpperCase()} export downloaded.`);
        this.toast.success('Export complete');
      },
      error: (error) => this.toast.error(this.errorMessage(error)),
    });
  }

  protected deleteTransaction(transaction: Transaction): void {
    this.pendingDelete.set(transaction);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const transaction = this.pendingDelete();
    if (!transaction || this.deletingId()) {
      return;
    }

    this.deletingId.set(transaction.id);
    this.accounting.deleteTransaction(transaction.id).subscribe({
      next: () => {
        this.deletingId.set('');
        this.pendingDelete.set(null);
        if (this.selected()?.id === transaction.id) {
          this.selected.set(null);
        }
        this.toast.success('Transaction deleted');
      },
      error: (error) => {
        const message = this.errorMessage(error);
        this.deletingId.set('');
        this.toast.error(message);
      },
    });
  }

  protected formatDate(timestamp: string): string {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  }

  protected currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }

  private errorMessage(error: unknown): string {
    return typeof error === 'object' && error !== null && 'error' in error
      ? ((error as { error?: { message?: string } }).error?.message ?? 'Could not load transactions.')
      : 'Could not load transactions.';
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
}
