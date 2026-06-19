import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/api.models';
import { ApiService } from './api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  businessName: string;
  email: string;
  password: string;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          theme: 'outline' | 'filled_blue' | 'filled_black';
          size: 'large' | 'medium' | 'small';
          text: 'continue_with' | 'signin_with' | 'signup_with';
          shape: 'rectangular' | 'pill' | 'circle' | 'square';
          width?: number;
        },
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly tokenKey = 'smartkhata_token';
  private readonly userKey = 'smartkhata_user';
  private googleScriptPromise: Promise<void> | null = null;
  readonly currentUser = signal<User | null>(this.readUser());

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(tap((response) => this.persistAuth(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(tap((response) => this.persistAuth(response)));
  }

  loginWithGoogleCredential(credential: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/google', { credential }).pipe(tap((response) => this.persistAuth(response)));
  }

  async renderGoogleButton(
    elementId: string,
    handlers: {
      onCredential?: () => void;
      onError?: (error: unknown) => void;
    } = {},
  ): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    if (!environment.googleClientId) {
      throw new Error('Google sign-in is not configured. Add your Google OAuth web client ID to environment.googleClientId.');
    }

    await this.loadGoogleIdentityScript();

    const container = document.getElementById(elementId);
    if (!container || !window.google) {
      return;
    }

    container.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: ({ credential }) => {
        if (!credential) {
          handlers.onError?.(new Error('Google did not return a credential.'));
          return;
        }

        handlers.onCredential?.();
        this.loginWithGoogleCredential(credential).subscribe({
          error: (error) => handlers.onError?.(error),
        });
      },
    });
    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: Math.min(container.clientWidth || 360, 400),
    });
  }

  getMe() {
    return this.api.get<{ success: boolean; user: User }>('/auth/me').pipe(
      tap((response) => {
        if (response.user) {
          this.storeUser(response.user);
        }
      }),
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }

    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.tokenKey) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  updateStoredUser(user: User): void {
    this.storeUser(user);
  }

  authErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (error.error as { message?: string })?.message || 'Authentication failed. Please try again.';
    }

    return 'Authentication failed. Please try again.';
  }

  private persistAuth(response: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, response.token);
    }

    this.storeUser(response.user);
    void this.router.navigate(['/app/dashboard']);
  }

  private storeUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    this.currentUser.set(user);
  }

  private readUser(): User | null {
    if (!this.isBrowser) {
      return null;
    }

    const value = localStorage.getItem(this.userKey);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as User;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }

  private loadGoogleIdentityScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.googleScriptPromise) {
      return this.googleScriptPromise;
    }

    this.googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google sign-in.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google sign-in.'));
      document.head.appendChild(script);
    });

    return this.googleScriptPromise;
  }
}
