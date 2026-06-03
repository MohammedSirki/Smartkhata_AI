import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import gsap from 'gsap';

import { MockDataService } from '../../services/mock-data.service';
import { AccountingStateService } from '../../services/accounting-state.service';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly mockData = inject(MockDataService);
  private readonly accounting = inject(AccountingStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly profile = this.mockData.getUserProfile();

  protected readonly form = this.fb.nonNullable.group({
    ownerName: [this.profile.ownerName, Validators.required],
    businessName: [this.profile.businessName, Validators.required],
    email: [this.profile.email, [Validators.required, Validators.email]],
    phone: [this.profile.phone],
    gstNumber: [this.profile.gstNumber],
    currency: [this.profile.currency],
    language: [this.profile.language],
    theme: [this.profile.theme],
    notifications: [this.profile.notifications],
  });

  protected readonly saved = false;
  protected readonly backupText = signal('');
  protected readonly dataMessage = signal('');

  ngAfterViewInit(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.from('.page-head, .settings-card', {
      opacity: 0,
      y: 18,
      duration: 0.58,
      stagger: 0.07,
      ease: 'power3.out',
    });
  }

  reset(): void {
    this.form.reset(this.profile);
  }

  clearAllData(): void {
    this.accounting.clearAllData();
    this.dataMessage.set('All local accounting data cleared.');
  }

  backupData(): void {
    this.backupText.set(this.accounting.backupData());
    this.dataMessage.set('Backup generated below.');
  }

  restoreData(): void {
    try {
      this.accounting.restoreData(this.backupText());
      this.dataMessage.set('Backup restored successfully.');
    } catch {
      this.dataMessage.set('Backup JSON could not be restored.');
    }
  }
}
