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
  selector: 'app-ai-demo',
  templateUrl: './ai-demo.component.html',
  styleUrl: './ai-demo.component.scss',
})
export class AiDemoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('demoSection', { static: true }) private readonly demoSection!: ElementRef<HTMLElement>;
  @ViewChild('typedText', { static: true }) private readonly typedText!: ElementRef<HTMLElement>;

  protected readonly benefits = [
    'Capture sales, expenses, and stock movement from one sentence.',
    'Reduce manual bookkeeping errors before they reach reports.',
    'Keep inventory and dashboard numbers updated in real time.',
  ];

  protected readonly checklist = [
    'Sale recorded',
    'Inventory reduced by 2',
    'Revenue added: ₹1,000',
    'Profit calculated',
    'Dashboard updated',
  ];

  protected readonly jsonPreview = `{
  type: "sale",
  item: "charger",
  quantity: 2,
  unitPrice: 500,
  total: 1000
}`;

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
      this.typedText.nativeElement.textContent = 'Sold 2 chargers for ₹500 each';
      gsap.set(this.demoSection.nativeElement.querySelectorAll('[data-demo-reveal]'), {
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
    const section = this.demoSection.nativeElement;
    const text = { value: '' };
    const revealItems = section.querySelectorAll<HTMLElement>('[data-demo-reveal]');
    const processing = section.querySelector<HTMLElement>('[data-processing]');
    const checks = section.querySelectorAll<HTMLElement>('[data-check]');
    const jsonCard = section.querySelector<HTMLElement>('[data-json-card]');

    gsap.set(revealItems, { autoAlpha: 0, y: 22 });
    gsap.set(processing, { autoAlpha: 0 });
    gsap.set(checks, { autoAlpha: 0, x: -14 });
    gsap.set(jsonCard, { autoAlpha: 0, y: 22, scale: 0.98 });

    this.timeline = gsap
      .timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          once: true,
        },
      })
      .to(revealItems, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 })
      .to(
        text,
        {
          value: 'Sold 2 chargers for ₹500 each',
          duration: 1.35,
          ease: 'none',
          onUpdate: () => {
            this.typedText.nativeElement.textContent = text.value;
          },
        },
        '-=0.2',
      )
      .to(processing, { autoAlpha: 1, duration: 0.35 }, '+=0.1')
      .to(processing, { autoAlpha: 0.72, duration: 0.45, yoyo: true, repeat: 1 })
      .to(checks, { autoAlpha: 1, x: 0, duration: 0.42, stagger: 0.11 }, '-=0.15')
      .to(jsonCard, { autoAlpha: 1, y: 0, scale: 1, duration: 0.62 }, '-=0.2');
  }
}
