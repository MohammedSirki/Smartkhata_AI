import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'marketing',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'auth',
    children: [
      {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-layout/app-layout').then((m) => m.AppLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./pages/transactions/transactions').then((m) => m.Transactions),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'assistant',
        loadComponent: () => import('./pages/assistant/assistant').then((m) => m.Assistant),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
