import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

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
  readonly currentUser = signal<User | null>(this.readUser());

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(tap((response) => this.persistAuth(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(tap((response) => this.persistAuth(response)));
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
}
