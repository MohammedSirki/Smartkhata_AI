import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({ selector: 'app-cta', templateUrl: './cta.component.html', styleUrl: './cta.component.scss' })
export class CtaComponent implements AfterViewInit, OnDestroy {
  @ViewChild('section', { static: true }) private readonly section!: ElementRef<HTMLElement>;
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly reduced = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private timeline?: gsap.core.Timeline;
  ngAfterViewInit(): void {
    if (!this.isBrowser) return; gsap.registerPlugin(ScrollTrigger);
    const els = this.section.nativeElement.querySelectorAll('[data-reveal]');
    if (this.reduced) { gsap.set(els, { autoAlpha: 1, clearProps: 'transform' }); return; }
    gsap.set(els, { autoAlpha: 0, y: 24 });
    this.timeline = gsap.timeline({ scrollTrigger: { trigger: this.section.nativeElement, start: 'top 75%', once: true } })
      .to(els, { autoAlpha: 1, y: 0, duration: .8, stagger: .1, ease: 'power3.out' });
  }
  ngOnDestroy(): void { this.timeline?.scrollTrigger?.kill(); this.timeline?.kill(); }
}
