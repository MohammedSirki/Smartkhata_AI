import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import gsap from 'gsap';

import { ApiDataResponse, ProfileData, User } from '../../models/api.models';
import { AccountingStateService } from '../../services/accounting-state.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements AfterViewInit, OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accounting = inject(AccountingStateService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly form = this.fb.nonNullable.group({
    ownerName: ['', Validators.required],
    businessName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    gstNumber: [''],
    currency: [''],
    language: [''],
  });

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly profileMissing = signal(false);
  protected readonly backupText = signal('');
  protected readonly dataMessage = signal('');
  private readonly lastProfile = signal<ProfileData | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

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

  saveChanges(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const { ownerName, ...formValue } = this.form.getRawValue();
    const payload = { ...formValue, fullName: ownerName };
    this.saving.set(true);
    this.error.set('');

    this.api.put<ApiDataResponse<ProfileData>>('/profile', payload).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.applyProfile(response.data);
        this.toast.success('Profile updated successfully');
      },
      error: (error) => {
        const message = this.errorMessage(error);
        this.saving.set(false);
        this.error.set(message);
        this.toast.error(message);
      },
    });
  }

  reset(): void {
    this.applyProfile(this.lastProfile());
  }

  clearAllData(): void {
    this.accounting.clearAllData();
    this.dataMessage.set('Local view cleared. MongoDB records remain available after refresh.');
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
      this.dataMessage.set('Restore is unavailable while SmartKhata is connected to MongoDB.');
    }
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.get<ApiDataResponse<ProfileData>>('/profile').subscribe({
      next: (response) => {
        this.loading.set(false);
        this.applyProfile(response.data);
      },
      error: (error) => {
        const message = this.errorMessage(error);
        this.loading.set(false);
        this.error.set(message);
        this.profileMissing.set(true);
        this.toast.error(message);
      },
    });
  }

  private applyProfile(profile: ProfileData | null): void {
    const safeProfile = profile ?? this.emptyProfile();
    const fullName = safeProfile.fullName || safeProfile.ownerName || '';
    this.lastProfile.set(safeProfile);
    this.profileMissing.set(!Object.values(safeProfile).some((value) => String(value || '').trim()));
    this.form.patchValue({
      ownerName: fullName,
      businessName: safeProfile.businessName || '',
      email: safeProfile.email || '',
      phone: safeProfile.phone || '',
      gstNumber: safeProfile.gstNumber || '',
      currency: safeProfile.currency || '',
      language: safeProfile.language || '',
    });

    this.auth.updateStoredUser({
      ...(this.auth.getCurrentUser() ?? { id: '', fullName: '', email: '' }),
      fullName,
      businessName: safeProfile.businessName || '',
      email: safeProfile.email || '',
    } as User);
  }

  private emptyProfile(): ProfileData {
    return {
      ownerName: '',
      fullName: '',
      businessName: '',
      email: '',
      phone: '',
      gstNumber: '',
      currency: '',
      language: '',
    };
  }

  private errorMessage(error: unknown): string {
    return typeof error === 'object' && error !== null && 'error' in error
      ? ((error as { error?: { message?: string } }).error?.message ?? 'Could not load profile information.')
      : 'Could not load profile information.';
  }
}
