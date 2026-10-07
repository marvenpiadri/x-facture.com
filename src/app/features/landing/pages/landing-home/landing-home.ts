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
      url: 'https://x-facture.com/'
    });
  }
}
