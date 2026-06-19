import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

import { InventoryItem } from '../../models/inventory.model';
import { AccountingStateService } from '../../services/accounting-state.service';
import { ToastService } from '../../services/toast.service';

type InventoryFilter = 'All' | InventoryItem['status'];

@Component({
  selector: 'app-inventory-page',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements AfterViewInit, OnInit {
  private readonly accounting = inject(AccountingStateService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly items = this.accounting.inventory;
  protected readonly loading = signal(false);
  protected readonly deletingId = signal('');
  protected readonly error = signal('');
  protected readonly query = signal('');
  protected readonly activeFilter = signal<InventoryFilter>('All');
  protected readonly filters: InventoryFilter[] = ['All', 'Healthy', 'Low', 'Critical'];

  protected readonly filteredItems = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.items().filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(query);
      const matchesFilter = filter === 'All' || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  });

  protected readonly totalStockValue = computed(() =>
    this.items().reduce((total, item) => total + item.stock * item.costPrice, 0),
  );
  protected readonly lowItems = computed(() => this.items().filter((item) => item.status === 'Low').length);
  protected readonly criticalItems = computed(() => this.items().filter((item) => item.status === 'Critical').length);

  ngOnInit(): void {
    this.loading.set(true);
    this.accounting.loadInventory().subscribe({
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

    gsap.from('.page-head, .summary-card, .toolbar, .product-card', {
      opacity: 0,
      y: 18,
      duration: 0.55,
      stagger: 0.055,
      ease: 'power3.out',
    });
  }

  protected exportInventory(format: 'json' | 'csv'): void {
    if (!this.isBrowser) {
      return;
    }

    this.accounting.downloadExport('inventory', format).subscribe({
      next: (response) => {
        this.downloadBlob(response.body, this.filename(response.headers.get('content-disposition'), `inventory.${format}`));
        this.toast.success('Export complete');
      },
      error: (error) => this.toast.error(this.errorMessage(error, 'Could not export inventory.')),
    });
  }

  protected deleteItem(item: InventoryItem): void {
    const confirmed = !this.isBrowser || window.confirm(`Delete ${item.name} completely from inventory?`);
    if (!confirmed || this.deletingId()) {
      return;
    }

    this.deletingId.set(item.id);
    this.accounting.deleteInventoryItem(item.id).subscribe({
      next: () => {
        this.deletingId.set('');
        this.toast.success('Inventory item deleted');
      },
      error: (error) => {
        const message = this.errorMessage(error, 'Could not delete inventory item.');
        this.deletingId.set('');
        this.toast.error(message);
      },
    });
  }

  private errorMessage(error: unknown, fallback = 'Could not load inventory.'): string {
    return typeof error === 'object' && error !== null && 'error' in error
      ? ((error as { error?: { message?: string } }).error?.message ?? fallback)
      : fallback;
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
