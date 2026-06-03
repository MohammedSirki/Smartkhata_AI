import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export interface SmartKhataUser {
  fullName: string;
  businessName: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends SmartKhataUser {}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly userKey = 'smartkhata_user';
  private readonly sessionKey = 'smartkhata_session';
  private readonly currentUserSignal = signal<SmartKhataUser | null>(this.readSessionUser());

  login(credentials: LoginCredentials): boolean {
    const storedUser = this.readStoredUser();

    if (
      !storedUser ||
      storedUser.email.toLowerCase() !== credentials.email.toLowerCase() ||
      storedUser.password !== credentials.password
    ) {
      return false;
    }

    this.writeSession(storedUser);
    return true;
  }

  register(payload: RegisterPayload): void {
    const user: SmartKhataUser = {
      ...payload,
      email: payload.email.toLowerCase(),
    };

    if (!this.isBrowser) {
      this.currentUserSignal.set(user);
      return;
    }

    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.writeSession(user);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.sessionKey);
    }

    this.currentUserSignal.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUserSignal() !== null;
  }

  getCurrentUser(): SmartKhataUser | null {
    return this.currentUserSignal();
  }

  private writeSession(user: SmartKhataUser): void {
    if (this.isBrowser) {
      localStorage.setItem(this.sessionKey, JSON.stringify(user));
    }

    this.currentUserSignal.set(user);
  }

  private readSessionUser(): SmartKhataUser | null {
    return this.readJson(this.sessionKey);
  }

  private readStoredUser(): SmartKhataUser | null {
    return this.readJson(this.userKey);
  }

  private readJson(key: string): SmartKhataUser | null {
    if (!this.isBrowser) {
      return null;
    }

    const value = localStorage.getItem(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as SmartKhataUser;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }
}
