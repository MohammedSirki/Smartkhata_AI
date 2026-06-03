import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { siteContent } from '../../data/site-content';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly content = siteContent;
  protected readonly activeSection = signal('');
  protected readonly compact = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.onScroll();
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          this.activeSection.set(`#${visible.target.id}`);
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0.1, 0.35, 0.65] },
    );

    this.content.navLinks.forEach((link) => {
      const target = document.querySelector(link.href);
      if (target) {
        this.observer?.observe(target);
      }
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    if (this.isBrowser) {
      this.compact.set(window.scrollY > 40);
    }
  }
}
