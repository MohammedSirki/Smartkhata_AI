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
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrl: './workflow.component.scss',
})
export class WorkflowComponent implements AfterViewInit, OnDestroy {
  @ViewChild('workflowSection', { static: true }) private readonly workflowSection!: ElementRef<HTMLElement>;

  protected readonly steps = [
    {
      number: '01',
      title: 'You Type Naturally',
      text: 'Example: "Sold 2 chargers for ₹500 each"',
    },
    {
      number: '02',
      title: 'AI Understands the Transaction',
      text: 'Detects sale, product, quantity, price, and total amount.',
    },
    {
      number: '03',
      title: 'Records Update Automatically',
      text: 'Inventory reduces, revenue updates, and profit is calculated.',
    },
    {
      number: '04',
      title: 'Reports Stay Ready',
      text: 'Dashboard, P&L, GST summary, and transaction history stay updated.',
    },
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
      gsap.set(this.workflowSection.nativeElement.querySelectorAll('[data-workflow-reveal]'), {
        autoAlpha: 1,
        clearProps: 'transform',
      });
      gsap.set(this.workflowSection.nativeElement.querySelector('[data-timeline-line]'), { scaleX: 1, scaleY: 1 });
      return;
    }

    this.initScrollAnimation();
  }

  ngOnDestroy(): void {
    this.timeline?.scrollTrigger?.kill();
    this.timeline?.kill();
  }

  private initScrollAnimation(): void {
    const section = this.workflowSection.nativeElement;
    const revealItems = section.querySelectorAll<HTMLElement>('[data-workflow-reveal]');
    const cards = section.querySelectorAll<HTMLElement>('[data-step-card]');
    const line = section.querySelector<HTMLElement>('[data-timeline-line]');

    gsap.set(revealItems, { autoAlpha: 0, y: 22 });
    gsap.set(cards, { autoAlpha: 0, y: 28 });
    gsap.set(line, { scaleX: 0, scaleY: 0, transformOrigin: 'left center' });

    this.timeline = gsap
      .timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          once: true,
        },
      })
      .to(revealItems, { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.08 })
      .to(line, { scaleX: 1, scaleY: 1, duration: 0.9 }, '-=0.25')
      .to(cards, { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.14 }, '-=0.65')
      .to(cards, { boxShadow: '0 0 34px rgba(217, 229, 63, 0.13)', duration: 0.35, stagger: 0.12 }, '-=0.65');
  }
}
