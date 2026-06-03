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

  protected readonly charts = [
    { title: 'Revenue Chart', value: 24, suffix: '%', bars: [34, 48, 42, 68, 74, 88] },
    { title: 'Expense Chart', value: 12, suffix: '%', bars: [62, 54, 58, 46, 42, 38] },
    { title: 'Profit Chart', value: 31, suffix: '%', bars: [22, 36, 48, 52, 64, 79] },
  ];

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reduced = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    gsap.registerPlugin(ScrollTrigger);
    if (this.reduced) {
      this.setFinal();
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
    const bars = root.querySelectorAll<HTMLElement>('[data-bar]');
    gsap.set(items, { autoAlpha: 0, y: 24 });
    gsap.set(bars, { scaleY: 0, transformOrigin: 'bottom' });
    this.timeline = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top 70%', once: true } })
      .to(items, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
      .to(bars, { scaleY: 1, duration: 0.8, stagger: 0.035, ease: 'power3.out' }, '-=0.45')
      .add(() => this.count(root), '-=0.65');
  }

  private count(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number(el.dataset['count'] ?? 0);
      const state = { value: 0 };
      gsap.to(state, {
        value: target,
        duration: 1,
        ease: 'power2.out',
        onUpdate: () => (el.textContent = `${Math.round(state.value)}${el.dataset['suffix'] ?? ''}`),
      });
    });
  }

  private setFinal(): void {
    this.section.nativeElement.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      el.textContent = `${el.dataset['count']}${el.dataset['suffix'] ?? ''}`;
    });
  }
}
