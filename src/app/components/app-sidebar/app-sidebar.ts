import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface AppNavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.html',
  styleUrl: './app-sidebar.scss',
})
export class AppSidebar {
  @Input() open = false;
  @Output() closeSidebar = new EventEmitter<void>();

  protected readonly navItems: AppNavItem[] = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'D' },
    { label: 'Transactions', path: '/app/transactions', icon: 'T' },
    { label: 'Inventory', path: '/app/inventory', icon: 'I' },
    { label: 'Reports', path: '/app/reports', icon: 'R' },
    { label: 'AI Assistant', path: '/app/assistant', icon: 'AI' },
    { label: 'Settings', path: '/app/settings', icon: 'S' },
  ];
}
