import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import gsap from 'gsap';

import { AuthService } from '../../services/auth.service';
import { AccountingStateService } from '../../services/accounting-state.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly accounting = inject(AccountingStateService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly user = signal(this.auth.getCurrentUser());
  protected readonly stats = computed(() => [
    { label: "Today's Revenue", value: this.currency(this.todayRevenue()), trend: `${this.todaySalesCount()} sales`, sentiment: 'positive' },
    { label: 'Monthly Profit', value: this.currency(this.accounting.profit()), trend: `${this.marginLabel()} margin`, sentiment: 'positive' },
    { label: 'Expenses', value: this.currency(this.accounting.expenses()), trend: `${this.expenseCount()} paid`, sentiment: 'negative' },
    { label: 'Inventory Health', value: `${this.inventoryHealth()}%`, trend: `${this.accounting.inventory().length} products`, sentiment: 'neutral' },
  ]);
  protected readonly transactions = computed(() => this.accounting.sortedTransactions().slice(0, 6));
  protected readonly processing = signal(false);
  protected readonly resultVisible = signal(false);
  protected readonly error = signal('');
  protected readonly lastTransactionType = signal('Transaction');
  protected readonly form = this.fb.nonNullable.group({
    entry: ['', Validators.required],
  });

  protected readonly chips = [
    'Sold 2 chargers for \u20b9500 each',
    'Bought 50 pens for \u20b95 each',
    'Paid shop rent \u20b98,000',
    'Customer returned 1 charger',
  ];

  protected readonly insights = computed(() => {
    const lowItem = this.accounting.inventory().find((item) => item.status === 'Critical' || item.status === 'Low');
    const revenue = this.accounting.revenue();
    const profit = this.accounting.profit();

    return [
      revenue > 0 ? `Recorded revenue is ${this.currency(revenue)}.` : 'Start by recording your first sale.',
      lowItem ? `${lowItem.name} needs attention with ${lowItem.stock} units left.` : 'Inventory is healthy across tracked products.',
      `Current profit is ${this.currency(profit)} after expenses and cost of goods.`,
    ];
  });

  ngAfterViewInit(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.from('.page-head, .stat-card, .panel, .table-row', {
      opacity: 0,
      y: 20,
      duration: 0.58,
      stagger: 0.055,
      ease: 'power3.out',
    });
  }

  useChip(chip: string): void {
    this.form.controls.entry.setValue(chip);
  }

  submitEntry(): void {
    if (this.form.invalid || this.processing()) {
      this.form.markAllAsTouched();
      return;
    }

    this.resultVisible.set(false);
    this.error.set('');
    this.processing.set(true);

    window.setTimeout(() => {
      try {
        const transaction = this.accounting.addTransaction(this.form.controls.entry.value);
        this.lastTransactionType.set(this.titleCase(transaction.type));
        this.form.reset();
        this.processing.set(false);
        this.resultVisible.set(true);
        this.animateSync();
      } catch (error) {
        this.processing.set(false);
        this.error.set(error instanceof Error ? error.message : 'Could not process this transaction.');
      }
    }, 900);
  }

  protected formatDate(timestamp: string): string {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
  }

  protected currency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { currency: 'INR', maximumFractionDigits: 0, style: 'currency' }).format(amount);
  }

  private todayRevenue(): number {
    const today = new Date().toDateString();
    return this.accounting
      .transactions()
      .filter((transaction) => transaction.type === 'sale' && new Date(transaction.timestamp).toDateString() === today)
      .reduce((total, transaction) => total + transaction.total, 0);
  }

  private todaySalesCount(): number {
    const today = new Date().toDateString();
    return this.accounting
      .transactions()
      .filter((transaction) => transaction.type === 'sale' && new Date(transaction.timestamp).toDateString() === today).length;
  }

  private expenseCount(): number {
    return this.accounting.transactions().filter((transaction) => transaction.type === 'expense').length;
  }

  private inventoryHealth(): number {
    const inventory = this.accounting.inventory();
    if (inventory.length === 0) {
      return 100;
    }

    const healthyItems = inventory.filter((item) => item.status === 'Healthy').length;
    return Math.round((healthyItems / inventory.length) * 100);
  }

  private marginLabel(): string {
    return `${Math.round(this.accounting.grossMargin())}%`;
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private animateSync(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.fromTo('.result span, .stat-card', { scale: 0.98 }, { scale: 1, duration: 0.32, stagger: 0.035, ease: 'power2.out' });
  }
}
