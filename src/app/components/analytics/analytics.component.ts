import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('section', { static: true }) private readonly section!: ElementRef<HTMLElement>;

  protected readonly insights = [
    { title: 'Revenue increased 18% this week.', text: 'SmartKhata highlights changes in plain language.' },
    { title: 'Chargers are your best-selling product.', text: 'Know what is moving without digging through numbers.' },
    { title: 'Earbuds stock may run out in 4 days.', text: 'Get simple restock reminders before shelves go empty.' },
    { title: 'Profit margin is healthy.', text: 'Understand if the shop is earning enough after costs.' },
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reduced = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    gsap.registerPlugin(ScrollTrigger);
    if (this.reduced) {
      gsap.set(this.section.nativeElement.querySelectorAll('[data-reveal]'), { autoAlpha: 1, clearProps: 'transform' });
      return;
    }
    this.animate();
  }

  ngOnDestroy(): void {
    this.timeline?.scrollTrigger?.kill();
    this.timeline?.kill();
  }

  private animate(): void {
    const root = this.section.nativeElement;
    const items = root.querySelectorAll<HTMLElement>('[data-reveal]');
    gsap.set(items, { autoAlpha: 0, y: 24 });
    this.timeline = gsap
      .timeline({ scrollTrigger: { trigger: root, start: 'top 70%', once: true } })
      .to(items, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
  }
}
