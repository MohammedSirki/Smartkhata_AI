export interface SiteSection {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
}

export const siteContent = {
  brand: 'SmartKhata AI',
  navLinks: [
    { label: 'Demo', href: '#ai-demo' },
    { label: 'Workflow', href: '#workflow' },
    { label: 'Analytics', href: '#analytics' },
    { label: 'Pricing', href: '#pricing' },
  ],
  sections: {
    hero: {
      id: 'hero',
      label: 'Hero',
      eyebrow: 'Premium SaaS landing page',
      title: 'SmartKhata AI',
      description: 'Placeholder hero section for the SmartKhata AI landing page.',
    },
    aiDemo: {
      id: 'ai-demo',
      label: 'AI Demo',
      eyebrow: 'Product demo',
      title: 'AI demo placeholder',
      description: 'Reserved area for the future interactive AI demo.',
    },
    dashboardPreview: {
      id: 'dashboard-preview',
      label: 'Dashboard Preview',
      eyebrow: 'Dashboard',
      title: 'Dashboard preview placeholder',
      description: 'Reserved area for dashboard screenshots and product panels.',
    },
    workflow: {
      id: 'workflow',
      label: 'Workflow',
      eyebrow: 'Process',
      title: 'Workflow placeholder',
      description: 'Reserved area for the operating workflow.',
    },
    analytics: {
      id: 'analytics',
      label: 'Analytics',
      eyebrow: 'Insights',
      title: 'Analytics placeholder',
      description: 'Reserved area for charts, metrics, and reporting blocks.',
    },
    inventory: {
      id: 'inventory',
      label: 'Inventory',
      eyebrow: 'Stock management',
      title: 'Inventory placeholder',
      description: 'Reserved area for inventory management content.',
    },
    aiAssistant: {
      id: 'ai-assistant',
      label: 'AI Assistant',
      eyebrow: 'Assistant',
      title: 'AI assistant placeholder',
      description: 'Reserved area for assistant conversations and automation.',
    },
    pricing: {
      id: 'pricing',
      label: 'Pricing',
      eyebrow: 'Plans',
      title: 'Pricing placeholder',
      description: 'Reserved area for pricing cards.',
    },
    cta: {
      id: 'cta',
      label: 'CTA',
      eyebrow: 'Get started',
      title: 'CTA placeholder',
      description: 'Reserved area for the final conversion section.',
    },
  },
};
