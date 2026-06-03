import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppSidebar } from '../../components/app-sidebar/app-sidebar';
import { AppTopbar } from '../../components/app-topbar/app-topbar';
import { AiCoreAssistantComponent } from '../../shared/ai-core-assistant/ai-core-assistant.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, AppSidebar, AppTopbar, AiCoreAssistantComponent],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayoutComponent {
  protected readonly sidebarOpen = signal(false);
}
