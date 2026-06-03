import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './app-topbar.html',
  styleUrl: './app-topbar.scss',
})
export class AppTopbar {
  @Output() menuClick = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly mockData = inject(MockDataService);

  protected readonly profile = signal(this.mockData.getUserProfile());
  protected readonly user = signal(this.auth.getCurrentUser());

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/']);
  }
}
