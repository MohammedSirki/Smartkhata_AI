import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AiCoreAssistantComponent } from '../../shared/ai-core-assistant/ai-core-assistant.component';

@Component({
  selector: 'app-product-shell',
  imports: [RouterOutlet, AiCoreAssistantComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
