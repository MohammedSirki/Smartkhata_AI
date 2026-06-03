import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({ selector: 'app-pricing', templateUrl: './pricing.component.html', styleUrl: './pricing.component.scss' })
export class PricingComponent implements AfterViewInit, OnDestroy {
  @ViewChild('section', { static: true }) private readonly section!: ElementRef<HTMLElement>;
  protected readonly plans = [
    { name: 'Starter', price: '₹0', note: 'Forever Free', cta: 'Get Started Free', features: ['100 transactions/month', 'Basic reports', 'Inventory tracking', 'Mobile access'] },
    { name: 'Pro', price: '₹299/month', note: 'Most Popular', cta: 'Start Free Trial', popular: true, features: ['Unlimited transactions', 'Hindi + English AI', 'GST-ready reports', 'Full inventory management', 'Excel & PDF export'] },
    { name: 'Business', price: '₹799/month', note: '', cta: 'Contact Sales', features: ['Unlimited users', 'Multi-location inventory', 'CA sharing portal', 'Custom reports', 'API access'] },
  ];
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reduced = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;
  ngAfterViewInit(): void {
    if (!this.isBrowser) return; gsap.registerPlugin(ScrollTrigger);
    const els = this.section.nativeElement.querySelectorAll('[data-reveal]');
    if (this.reduced) { gsap.set(els, { autoAlpha: 1, clearProps: 'transform' }); return; }
    gsap.set(els, { autoAlpha: 0, y: 24 });
    this.timeline = gsap.timeline({ scrollTrigger: { trigger: this.section.nativeElement, start: 'top 70%', once: true } })
      .to(els, { autoAlpha: 1, y: 0, duration: .7, stagger: .08, ease: 'power3.out' });
  }
  ngOnDestroy(): void { this.timeline?.scrollTrigger?.kill(); this.timeline?.kill(); }
}
