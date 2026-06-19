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

  protected readonly actions = ['Record Sales', 'Track Inventory', 'Manage Expenses', 'Generate Reports', 'Answer Business Questions'];

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
      gsap.set(this.workflowSection.nativeElement.querySelectorAll('[data-workflow-reveal], [data-action-card]'), {
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
    const section = this.workflowSection.nativeElement;
    const revealItems = section.querySelectorAll<HTMLElement>('[data-workflow-reveal]');
    const cards = section.querySelectorAll<HTMLElement>('[data-action-card]');

    gsap.set(revealItems, { autoAlpha: 0, y: 22 });
    gsap.set(cards, { autoAlpha: 0, y: 28 });

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
      .to(cards, { autoAlpha: 1, y: 0, duration: 0.62, stagger: 0.08 }, '-=0.35');
  }
}
