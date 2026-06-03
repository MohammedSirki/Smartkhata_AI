import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-dashboard-preview',
  templateUrl: './dashboard-preview.component.html',
  styleUrl: './dashboard-preview.component.scss',
})
export class DashboardPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dashboardSection', { static: true }) private readonly dashboardSection!: ElementRef<HTMLElement>;

  protected readonly metricCards = [
    { label: "Today's Revenue", value: 52000, prefix: '₹', suffix: '' },
    { label: 'Profit This Month', value: 18400, prefix: '₹', suffix: '' },
    { label: 'Inventory Health', value: 98, prefix: '', suffix: '%' },
    { label: 'Low Stock Alerts', value: 7, prefix: '', suffix: '' },
  ];

  protected readonly transactions = [
    { label: 'Sold 2 chargers', value: '₹1,000' },
    { label: 'Bought 50 pens', value: '₹250' },
    { label: 'Expense: Rent', value: '₹8,000' },
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly prefersReducedMotion =
    this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (this.prefersReducedMotion) {
      this.setFinalNumbers();
      gsap.set(this.dashboardSection.nativeElement.querySelectorAll('[data-dashboard-reveal]'), {
        autoAlpha: 1,
        clearProps: 'transform',
      });
      return;
    }

    this.initScrollAnimation();
  }

  ngOnDestroy(): void {
    this.timeline?.scrollTrigger?.kill();
    this.timeline?.kill();
  }

  private initScrollAnimation(): void {
    const section = this.dashboardSection.nativeElement;
    const revealItems = section.querySelectorAll<HTMLElement>('[data-dashboard-reveal]');
    const counters = section.querySelectorAll<HTMLElement>('[data-counter]');
    const transactions = section.querySelectorAll<HTMLElement>('[data-transaction]');

    gsap.set(revealItems, { autoAlpha: 0, y: 24 });
    gsap.set(transactions, { autoAlpha: 0, x: 22 });

    this.timeline = gsap
      .timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          once: true,
        },
      })
      .to(revealItems, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 })
      .add(() => this.animateCounters(counters), '-=0.35')
      .to(transactions, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.12 }, '-=0.05');
  }

  private animateCounters(counters: NodeListOf<HTMLElement>): void {
    counters.forEach((counter) => {
      const value = Number(counter.dataset['value'] ?? 0);
      const prefix = counter.dataset['prefix'] ?? '';
      const suffix = counter.dataset['suffix'] ?? '';
      const state = { value: 0 };

      gsap.to(state, {
        value,
        duration: 1.15,
        ease: 'power2.out',
        onUpdate: () => {
          counter.textContent = this.formatValue(state.value, prefix, suffix);
        },
      });
    });
  }

  private setFinalNumbers(): void {
    this.dashboardSection.nativeElement.querySelectorAll<HTMLElement>('[data-counter]').forEach((counter) => {
      const value = Number(counter.dataset['value'] ?? 0);
      const prefix = counter.dataset['prefix'] ?? '';
      const suffix = counter.dataset['suffix'] ?? '';
      counter.textContent = this.formatValue(value, prefix, suffix);
    });
  }

  private formatValue(value: number, prefix: string, suffix: string): string {
    return `${prefix}${Math.round(value).toLocaleString('en-IN')}${suffix}`;
  }
}
