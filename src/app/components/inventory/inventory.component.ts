import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({ selector: 'app-inventory', templateUrl: './inventory.component.html', styleUrl: './inventory.component.scss' })
export class InventoryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('section', { static: true }) private readonly section!: ElementRef<HTMLElement>;
  protected readonly items = [
    { name: 'Chargers', stock: 128, status: 'Healthy' },
    { name: 'Mobile Covers', stock: 42, status: 'Low' },
    { name: 'Earbuds', stock: 19, status: 'Critical' },
    { name: 'Power Banks', stock: 87, status: 'Healthy' },
  ];
  protected readonly features = ['Low stock alerts', 'Auto stock updates', 'Inventory valuation', 'Stock movement tracking'];
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reduced = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    gsap.registerPlugin(ScrollTrigger);
    const els = this.section.nativeElement.querySelectorAll('[data-reveal]');
    if (this.reduced) { gsap.set(els, { autoAlpha: 1, clearProps: 'transform' }); return; }
    gsap.set(els, { autoAlpha: 0, y: 24 });
    this.timeline = gsap.timeline({ scrollTrigger: { trigger: this.section.nativeElement, start: 'top 70%', once: true } })
      .to(els, { autoAlpha: 1, y: 0, duration: .7, stagger: .08, ease: 'power3.out' });
  }
  ngOnDestroy(): void { this.timeline?.scrollTrigger?.kill(); this.timeline?.kill(); }
}
