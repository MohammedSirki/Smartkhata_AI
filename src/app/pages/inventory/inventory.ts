import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';

import { InventoryItem } from '../../models/inventory.model';
import { AccountingStateService } from '../../services/accounting-state.service';

type InventoryFilter = 'All' | InventoryItem['status'];

@Component({
  selector: 'app-inventory-page',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements AfterViewInit {
  private readonly accounting = inject(AccountingStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly items = this.accounting.inventory;
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

  protected exportInventory(): void {
    const data = this.accounting.exportInventory('csv');
    if (!this.isBrowser) {
      return;
    }

    navigator.clipboard?.writeText(data);
  }
}
