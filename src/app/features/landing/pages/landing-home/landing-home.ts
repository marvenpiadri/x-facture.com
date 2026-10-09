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
      title: 'Free Invoice Generator & Factur-X Tools | X-Facture',
      description: 'Create invoices, quotes and receipts online for free. Generate Factur-X hybrid e-invoices with a readable PDF and embedded structured XML. No account required.',
      keywords: 'free invoice generator, free Factur-X generator, Factur-X invoice generator, create Factur-X online, invoice maker, hybrid electronic invoice, Factur-X PDF, embedded CII XML, EN 16931, quotes, receipts, x-facture',
      url: 'https://x-facture.com/'
    });
  }
}
