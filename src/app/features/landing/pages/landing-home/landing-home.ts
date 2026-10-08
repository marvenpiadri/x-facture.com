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

  ngOnInit(): void {
    this.seoService.updateMetadata({
      title: 'x-facture • Professional POS & Invoicing',
      description: 'Manage sales, products, customers and business documents with x-facture. Create professional invoices and run your POS workflow without unnecessary setup.',
      keywords: 'professional POS, invoicing software, invoice generator, business management, sales management, inventory, customer management, receipts, quotes',
      title: 'x-facture • Free Invoice Generator & Factur-X Invoices',
      description: 'Create free invoices online with x-facture and download a standard PDF or a Factur-X hybrid e-invoice with embedded structured XML. Learn what Factur-X is, plus quotes, receipts and business tools.',
      keywords: 'x-facture, Factur-X, Factur-X invoice, electronic invoice, e-invoice, hybrid PDF XML invoice, free invoice generator, invoice maker, create invoice online, free invoicing, quote generator, receipt generator, business tools, financial calculators, free POS, PDF tools',
      url: 'https://x-facture.com/'
    });
  }
}
