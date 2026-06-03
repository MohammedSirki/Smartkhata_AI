import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-ai-assistant',
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.scss',
})
export class AiAssistantComponent implements AfterViewInit, OnDestroy {
  @ViewChild('section', { static: true }) private readonly section!: ElementRef<HTMLElement>;
  @ViewChild('orb', { static: true }) private readonly orb!: ElementRef<HTMLElement>;

  protected readonly chats = [
    ['How much profit did I make this month?', '₹42,580\n12% higher than last month.'],
    ['Which product gives the highest margin?', 'Mobile Chargers\nProfit Margin: 31%'],
    ['What inventory is running low?', 'Earbuds\n19 units remaining.'],
  ];
  protected readonly activeIndex = signal(0);
  protected readonly answering = signal(false);

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reduced = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;
  private float?: gsap.core.Tween;
  private responseTween?: gsap.core.Tween;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const els = this.section.nativeElement.querySelectorAll('[data-reveal]');

    if (this.reduced) {
      gsap.set(els, { autoAlpha: 1, clearProps: 'transform' });
      return;
    }

    this.float = gsap.to(this.orb.nativeElement, {
      y: -16,
      duration: 3.4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    gsap.set(els, { autoAlpha: 0, y: 24 });
    this.timeline = gsap
      .timeline({ scrollTrigger: { trigger: this.section.nativeElement, start: 'top 70%', once: true } })
      .to(els, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
  }

  ngOnDestroy(): void {
    this.timeline?.scrollTrigger?.kill();
    this.timeline?.kill();
    this.float?.kill();
    this.responseTween?.kill();
  }

  protected ask(index: number): void {
    this.activeIndex.set(index);

    if (this.reduced) {
      return;
    }

    this.answering.set(true);
    this.responseTween?.kill();
    this.responseTween = gsap.delayedCall(0.72, () => this.answering.set(false));
  }
}
