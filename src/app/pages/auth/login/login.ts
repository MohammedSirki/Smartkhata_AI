import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import gsap from 'gsap';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly submitted = signal(false);
  protected readonly authError = signal('');
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],
  });

  ngAfterViewInit(): void {
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
      stagger: 0.07,
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

    const { email, password } = this.form.getRawValue();
    const success = this.auth.login({ email, password });

    if (!success) {
      this.authError.set('No matching SmartKhata account was found. Create an account first or check your password.');
      return;
    }

    void this.router.navigate(['/app/dashboard']);
  }

  protected showError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }
}
