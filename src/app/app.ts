import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, HostListener, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements AfterViewInit, OnInit {
  protected readonly title = signal('SmartKhata-Ai');
  protected readonly loading = signal(true);
  protected readonly scrollProgress = signal(0);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.updateScrollProgress();
    });
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      this.loading.set(false);
      return;
    }

    this.updateScrollProgress();
    window.setTimeout(() => this.loading.set(false), 1450);
  }

  @HostListener('window:scroll')
  protected updateScrollProgress(): void {
    if (!this.isBrowser) {
      return;
    }

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    this.scrollProgress.set(Math.min(100, Math.max(0, progress)));
  }
}
