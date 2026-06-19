import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import gsap from 'gsap';

import { AuthService } from '../../services/auth.service';
import { AccountingStateService } from '../../services/accounting-state.service';
import { Transaction } from '../../models/transaction.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements AfterViewInit, OnInit {
  private readonly auth = inject(AuthService);
  private readonly accounting = inject(AccountingStateService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly user = this.auth.currentUser;
  protected readonly loading = this.accounting.loading;
  protected readonly stats = computed(() => [
    { label: "Today's Revenue", value: this.currency(this.accounting.dashboard()?.todayRevenue ?? 0), trend: `${this.accounting.dashboard()?.todaySalesCount ?? 0} sales`, sentiment: 'positive' },
    { label: 'Monthly Profit', value: this.currency(this.accounting.dashboard()?.monthlyProfit ?? 0), trend: `${this.marginLabel()} margin`, sentiment: 'positive' },
    { label: 'Expenses', value: this.currency(this.accounting.dashboard()?.monthlyExpenses ?? 0), trend: `${this.accounting.dashboard()?.monthlyExpenseCount ?? 0} paid`, sentiment: 'negative' },
    { label: 'Inventory Health', value: `${this.accounting.dashboard()?.inventoryHealth ?? 100}%`, trend: `${this.accounting.dashboard()?.inventoryCount ?? 0} products`, sentiment: 'neutral' },
  ]);
  protected readonly transactions = computed(() => this.accounting.sortedTransactions().slice(0, 6));
  protected readonly processing = signal(false);
  protected readonly undoing = signal(false);
  protected readonly resultVisible = signal(false);
  protected readonly error = signal('');
  protected readonly purchaseSuggestion = signal('');
  protected readonly helpOpen = signal(false);
  protected readonly lastTransactionType = signal('Transaction');
  protected readonly lastTransaction = signal<Transaction | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    entry: ['', Validators.required],
  });

  ngOnInit(): void {
    this.accounting.loadAll().subscribe({
      error: (error) => {
        const message = this.errorMessage(error);
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  protected readonly insights = computed(() => {
    const aiInsights = this.accounting.aiInsights();
    if (aiInsights.length) {
      return aiInsights.map((insight) => ({
        title: insight.title,
        text: insight.message,
      }));
    }

    const lowItem = this.accounting.inventory().find((item) => item.status === 'Critical' || item.status === 'Low');
    const dashboard = this.accounting.dashboard();
    const revenue = dashboard?.monthlyRevenue ?? 0;
    const profit = dashboard?.monthlyProfit ?? 0;
    const margin = dashboard?.monthlyRevenue ? Math.round((profit / dashboard.monthlyRevenue) * 100) : 0;

    return [
      { title: revenue > 0 ? 'Revenue is being tracked' : 'Start with your first sale', text: revenue > 0 ? `Monthly revenue is ${this.currency(revenue)}.` : 'Record a sale to see your shop income here.' },
      { title: lowItem ? 'Low stock alert' : 'Inventory looks healthy', text: lowItem ? `${lowItem.name} has ${lowItem.stock} units left.` : 'No urgent stock warning right now.' },
      { title: margin > 0 ? 'Profit margin is healthy' : 'Profit will appear after sales', text: `Current profit is ${this.currency(profit)}${margin > 0 ? ` with ${margin}% margin.` : '.'}` },
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

  submitEntry(): void {
    if (this.form.invalid || this.processing()) {
      this.form.markAllAsTouched();
      return;
    }

    this.resultVisible.set(false);
    this.error.set('');
    this.purchaseSuggestion.set('');
    this.processing.set(true);

    this.accounting.addTransaction(this.form.controls.entry.value).subscribe({
      next: (transaction) => {
        this.lastTransactionType.set(this.titleCase(transaction.type));
        this.lastTransaction.set(transaction);
        this.form.reset();
        this.processing.set(false);
        this.resultVisible.set(true);
        this.toast.success('Transaction recorded');
        this.toast.success('Inventory updated');
        this.animateSync();
      },
      error: (error) => {
        const message = this.errorMessage(error);
        this.processing.set(false);
        this.error.set(message);
        this.purchaseSuggestion.set(this.suggestionMessage(error));
        this.toast.error(message);
      },
    });
  }

  protected recordPurchaseSuggestion(): void {
    const suggestion = this.purchaseSuggestion();
    if (!suggestion) {
      return;
    }

    this.form.controls.entry.setValue(suggestion.replace(/^Try recording a purchase first, for example:\s*/i, ''));
    this.error.set('');
    this.purchaseSuggestion.set('');
  }

  protected undoLastTransaction(): void {
    if (this.undoing()) {
      return;
    }

    this.undoing.set(true);
    this.accounting.undoLastTransaction().subscribe({
      next: () => {
        this.undoing.set(false);
        this.resultVisible.set(false);
        this.lastTransaction.set(null);
        this.toast.success('Transaction successfully reversed.');
      },
      error: (error) => {
        const message = this.errorMessage(error);
        this.undoing.set(false);
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

  protected parsedByLabel(): string {
    return this.lastTransaction()?.parsedBy === 'groq' ? 'Parsed by AI' : 'Parsed by fallback parser';
  }

  private marginLabel(): string {
    const dashboard = this.accounting.dashboard();
    return `${dashboard?.monthlyRevenue ? Math.round((dashboard.monthlyProfit / dashboard.monthlyRevenue) * 100) : 0}%`;
  }

  private titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const message = (error as { error?: { message?: string } }).error?.message ?? '';
      if (message.includes('not in your inventory') || message.includes('not in stock')) {
        return 'This item is not in your inventory yet. Record a purchase first.';
      }
      return message || 'Could not process this transaction.';
    }

    return 'Could not process this transaction.';
  }

  private suggestionMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      return (error as { error?: { suggestion?: string } }).error?.suggestion ?? '';
    }

    return '';
  }

  private animateSync(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.fromTo('.result span, .stat-card', { scale: 0.98 }, { scale: 1, duration: 0.32, stagger: 0.035, ease: 'power2.out' });
  }
}
