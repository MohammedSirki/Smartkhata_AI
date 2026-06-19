import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, ElementRef, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import gsap from 'gsap';

import { AccountingStateService } from '../../services/accounting-state.service';
import { ToastService } from '../../services/toast.service';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  answeredBy?: 'groq' | 'fallback';
}

@Component({
  selector: 'app-assistant-page',
  imports: [ReactiveFormsModule],
  templateUrl: './assistant.html',
  styleUrl: './assistant.scss',
})
export class Assistant implements AfterViewInit {
  @ViewChild('history') private readonly history?: ElementRef<HTMLElement>;

  private readonly fb = inject(FormBuilder);
  private readonly accounting = inject(AccountingStateService);
  private readonly toast = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly thinking = signal(false);
  protected readonly prompts = [
    'How much profit did I make?',
    'What inventory is low?',
    "Show today's sales.",
    'What are my expenses?',
    'Create today\'s business summary.',
  ];
  protected readonly navItems = ['New Chat', 'Profit Analysis', 'Inventory Questions', 'GST Help', 'Reports', 'Saved Answers'];
  protected readonly form = this.fb.nonNullable.group({
    prompt: ['', Validators.required],
  });
  protected readonly messages = signal<ChatMessage[]>([
    { role: 'ai', text: 'Ask SmartKhata about your business.' },
  ]);

  ngAfterViewInit(): void {
    if (!this.isBrowser || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    gsap.from('.assistant-nav, .assistant-chat, .prompt-chip', {
      opacity: 0,
      y: 18,
      duration: 0.58,
      stagger: 0.055,
      ease: 'power3.out',
    });
  }

  sendPrompt(prompt = this.form.controls.prompt.value): void {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt || this.thinking()) {
      return;
    }

    this.messages.update((messages) => [...messages, { role: 'user', text: cleanPrompt }]);
    this.form.reset();
    this.thinking.set(true);
    this.scrollToBottom();

    this.accounting.askAssistant(cleanPrompt).subscribe({
      next: (response) => {
        this.messages.update((messages) => [...messages, { role: 'ai', text: response.reply, answeredBy: response.answeredBy }]);
        this.thinking.set(false);
        this.scrollToBottom();
      },
      error: (error) => {
        const message = this.errorMessage(error);
        this.messages.update((messages) => [...messages, { role: 'ai', text: message }]);
        this.thinking.set(false);
        this.toast.error(message);
        this.scrollToBottom();
      },
    });
  }

  private errorMessage(error: unknown): string {
    return typeof error === 'object' && error !== null && 'error' in error
      ? ((error as { error?: { message?: string } }).error?.message ?? 'SmartKhata could not answer right now.')
      : 'SmartKhata could not answer right now.';
  }

  private scrollToBottom(): void {
    if (!this.isBrowser) {
      return;
    }

    window.setTimeout(() => {
      const element = this.history?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
