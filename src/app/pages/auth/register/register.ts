import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly authError = signal('');
  protected readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', Validators.required],
      businessName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: Register.passwordsMatch },
  );

  ngAfterViewInit(): void {
    void this.setupGoogleButton();

    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.from('.auth-copy > *, .auth-card', {
      opacity: 0,
      y: 24,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
    });

    gsap.from('.field', {
      opacity: 0,
      y: 16,
      duration: 0.55,
      stagger: 0.06,
      delay: 0.25,
      ease: 'power2.out',
    });
  }

  submit(): void {
    this.submitted.set(true);
    this.authError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { confirmPassword: _confirmPassword, ...payload } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Register success');
      },
      error: (error) => {
        const message = this.auth.authErrorMessage(error);
        this.loading.set(false);
        this.authError.set(message);
        this.toast.error(message);
      },
    });
  }

  protected showError(controlName: 'fullName' | 'businessName' | 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected confirmMismatch(): boolean {
    return this.form.hasError('passwordMismatch') && (this.form.controls.confirmPassword.touched || this.submitted());
  }

  private static passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value as string | undefined;
    const confirmPassword = control.get('confirmPassword')?.value as string | undefined;

    return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
  }

  private async setupGoogleButton(): Promise<void> {
    try {
      await this.auth.renderGoogleButton('google-register-button', {
        onCredential: () => {
          this.loading.set(true);
          this.authError.set('');
        },
        onError: (error) => {
          const message = this.auth.authErrorMessage(error);
          this.loading.set(false);
          this.authError.set(message);
          this.toast.error(message);
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in is unavailable.';
      this.authError.set(message);
    }
  }
}
