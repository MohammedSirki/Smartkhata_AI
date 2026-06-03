import { Component } from '@angular/core';

@Component({ selector: 'app-footer', templateUrl: './footer.component.html', styleUrl: './footer.component.scss' })
export class FooterComponent {
  protected readonly year = 2025;
  protected readonly columns = [
    ['Product', 'Features', 'Pricing', 'Roadmap', 'Changelog'],
    ['Company', 'About', 'Blog', 'Careers', 'Contact'],
    ['Support', 'Help Center', 'WhatsApp Support', 'Status'],
  ];
}
