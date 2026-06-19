import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './app-topbar.html',
  styleUrl: './app-topbar.scss',
})
export class AppTopbar {
  @Output() menuClick = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly user = this.auth.currentUser;

  logout(): void {
    this.auth.logout();
    this.toast.success('Logout success');
    void this.router.navigate(['/auth/login']);
  }
}
