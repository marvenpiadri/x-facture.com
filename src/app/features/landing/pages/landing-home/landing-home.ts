import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { SeoService } from '../../../../core/services/seo.service';
import { DOCUMENT_TYPE_CONFIGS } from '../../../../core/config/document-type-config';
import { DocumentTypeConfig } from '../../../../core/models/document-type-config.model';
import { CurrencyService } from '../../../../core/services/currency.service';
import { FooterComponent } from '../footer/footer.component';

interface ProCalculatorCard {
  id: string;
  slug: string;
  title: string;
  badge: string;
  description: string;
  icon: string;
  highlight: string;
  tags: string[];
}

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './landing-home.html',
  styleUrl: './landing-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingHomePage implements OnInit {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private currencyService = inject(CurrencyService);
  private seoService = inject(SeoService);

  readonly docConfigs: DocumentTypeConfig[] = Object.values(DOCUMENT_TYPE_CONFIGS);

  // Dedicated Master SEO Calculators
  readonly featuredCalculators: ProCalculatorCard[] = [
    {
      id: 'stripe-paypal',
      slug: 'stripe-paypal-fee-calculator',
      title: 'Stripe & PayPal Fee Calculator',
      badge: 'POPULAR',
      description: 'Accurately compute payment gateway merchant fees, reverse invoice surcharges, and net payout amounts for international and domestic transactions.',
      icon: 'payments',
      highlight: 'Avoid 2.9% - 4.4% margin loss',
      tags: ['Stripe US/Intl', 'PayPal Commerce', 'ACH Debit', 'Surcharge Engine']
    },
    {
      id: 'cash-burn',
      slug: 'cash-burn-runway-calculator',
      title: 'Cash Burn Rate & Runway Calculator',
      badge: 'STARTUP MODEL',
      description: 'Simulate gross burn, net burn, monthly revenue growth, and zero cash date with interactive multi-scenario forecasting charts.',
      icon: 'hourglass_bottom',
      highlight: 'Zero cash date projections',
      tags: ['Gross vs Net Burn', 'Runway Months', 'Revenue Growth %', 'Chart.js Simulation']
    },
    {
      id: 'gross-margin',
      slug: 'gross-margin-markup-calculator',
      title: 'Gross Margin vs. Markup Calculator',
      badge: 'PROFIT ENGINE',
      description: 'Convert between profit margin % and markup %, compute optimal sale prices, and evaluate product profitability thresholds.',
      icon: 'price_check',
      highlight: 'Solve Margin vs Markup mistakes',
      tags: ['Cost of Goods (COGS)', 'Target Margin %', 'Markup Multiplier', 'Breakeven Units']
    },
    {
      id: 'late-fee',
      slug: 'late-fee-interest-calculator',
      title: 'Late Payment Fee & Overdue Interest',
      badge: 'DEBT RECOVERY',
      description: 'Calculate statutory commercial interest, compounding penalties, and total debt due on overdue business invoices.',
      icon: 'timer_off',
      highlight: 'Statutory interest & fixed penalties',
      tags: ['Daily Overdue Rate', 'Statutory 8% + Base', 'Grace Periods', 'Compound APR']
    },
    {
      id: 'tax-vat',
      slug: 'sales-tax-vat-splitter',
      title: 'Sales Tax & VAT Reverse Splitter',
      badge: 'TAX ENGINE',
      description: 'Reverse calculate pre-tax net values from gross receipts or add multi-tier VAT, GST, and regional state sales taxes effortlessly.',
      icon: 'pie_chart',
      highlight: 'Inclusive vs Exclusive tax split',
      tags: ['Global VAT Presets', 'Reverse Tax Extraction', 'Multi-Rate GST', 'Receipt Itemization']
    }
  ];

  ngOnInit(): void {
    this.seoService.updateMetadata({
      title: 'x-facture | Invoicing, Retail POS & Pro Financial Calculators',
      description: 'Free offline-first commercial invoicing, retail cash register POS, real-time financial ledger, and standalone pro business calculators.',
      keywords: 'free invoice generator, pos terminal web app, stripe fee calculator, cash burn runway calculator, gross margin calculator, late fee calculator, vat splitter, offline invoice app'
    });
  }
}
