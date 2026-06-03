import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

import { Transaction, TransactionType } from '../../models/transaction.model';
import { AccountingStateService } from '../../services/accounting-state.service';

type TransactionFilter = 'all' | TransactionType;

@Component({
  selector: 'app-transactions-page',
  imports: [FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements AfterViewInit {
  private readonly accounting = inject(AccountingStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly query = signal('');
  protected readonly activeFilter = signal<TransactionFilter>('all');
  protected readonly selected = signal<Transaction | null>(null);
  protected readonly copied = signal('');
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

    navigator.clipboard?.writeText(this.accounting.exportTransactions(format));
    this.copied.set(`${format.toUpperCase()} export copied.`);
  }

  protected formatDate(timestamp: string): string {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  }

  protected currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }
}
