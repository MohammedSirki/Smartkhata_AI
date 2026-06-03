import { Component } from '@angular/core';

import { AiAssistantComponent } from '../../components/ai-assistant/ai-assistant.component';
import { AiDemoComponent } from '../../components/ai-demo/ai-demo.component';
import { AnalyticsComponent } from '../../components/analytics/analytics.component';
import { CtaComponent } from '../../components/cta/cta.component';
import { DashboardPreviewComponent } from '../../components/dashboard-preview/dashboard-preview.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { InventoryComponent } from '../../components/inventory/inventory.component';
import { Navbar } from '../../components/navbar/navbar';
import { PricingComponent } from '../../components/pricing/pricing.component';
import { WorkflowComponent } from '../../components/workflow/workflow.component';

@Component({
  selector: 'app-home',
  imports: [
    Navbar,
    HeroComponent,
    AiDemoComponent,
    DashboardPreviewComponent,
    WorkflowComponent,
    AnalyticsComponent,
    InventoryComponent,
    AiAssistantComponent,
    PricingComponent,
    CtaComponent,
    FooterComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {}
