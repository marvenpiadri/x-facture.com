import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { DOCUMENT_TYPE_CONFIGS } from '../../../../core/config/document-type-config';
import { DocumentTypeConfig } from '../../../../core/models/document-type-config.model';
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
  private readonly seoService = inject(SeoService);

  readonly docConfigs: DocumentTypeConfig[] = Object.values(DOCUMENT_TYPE_CONFIGS);

  readonly featuredCalculators: ProCalculatorCard[] = [
    {
      id: 'stripe-paypal', slug: 'stripe-paypal-fee-calculator', title: 'Stripe & PayPal Fee Calculator', badge: 'POPULAR',
      description: 'Accurately compute payment gateway merchant fees, reverse invoice surcharges, and net payout amounts for international and domestic transactions.', icon: 'payments', highlight: 'Avoid payment-fee margin loss', tags: ['Stripe US/Intl', 'PayPal Commerce', 'ACH Debit', 'Surcharge Engine']
    },
    {
      id: 'cash-burn', slug: 'cash-burn-runway-calculator', title: 'Cash Burn Rate & Runway Calculator', badge: 'STARTUP MODEL',
      description: 'Simulate gross burn, net burn, monthly revenue growth, and zero cash date with interactive multi-scenario forecasting charts.', icon: 'hourglass_bottom', highlight: 'Zero cash date projections', tags: ['Gross vs Net Burn', 'Runway Months', 'Revenue Growth', 'Forecasting']
    },
    {
      id: 'gross-margin', slug: 'gross-margin-markup-calculator', title: 'Gross Margin vs. Markup Calculator', badge: 'PROFIT ENGINE',
      description: 'Convert between profit margin and markup, compute optimal sale prices, and evaluate product profitability thresholds.', icon: 'price_check', highlight: 'Margin vs markup analysis', tags: ['COGS', 'Target Margin', 'Markup', 'Selling Price']
    },
    {
      id: 'late-fee', slug: 'late-fee-interest-calculator', title: 'Late Payment Fee & Overdue Interest', badge: 'BILLING',
      description: 'Calculate modeled interest and late fees on overdue business invoices using configurable rates and grace periods.', icon: 'timer_off', highlight: 'Overdue invoice modeling', tags: ['Daily Rate', 'Grace Periods', 'Late Fees', 'Interest']
    },
    {
      id: 'tax-vat', slug: 'sales-tax-vat-splitter', title: 'Sales Tax & VAT Reverse Splitter', badge: 'TAX ENGINE',
      description: 'Reverse calculate pre-tax values from gross receipts or add VAT, GST and sales tax to net prices.', icon: 'pie_chart', highlight: 'Inclusive vs exclusive tax', tags: ['VAT', 'GST', 'Sales Tax', 'Tax Split']
    }
  ];

  ngOnInit(): void {
    this.seoService.updateMetadata({
      title: 'x-facture • Free Invoice Generator & Business Tools',
      description: 'Create professional invoices, quotes and receipts for free with x-facture. Use business documents, financial calculators, POS and PDF tools without signing up.',
      keywords: 'free invoice generator, invoice maker, create invoice online, free invoicing, quote generator, receipt generator, business tools, financial calculators, free POS, PDF tools',
      url: 'https://x-facture.com/'
    });
  }
}
