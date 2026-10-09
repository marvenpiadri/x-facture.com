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
      title: 'Free Invoice & Factur-X Generator Online | X-Facture',
      description: 'Create invoices online for free with X-Facture. Download a standard PDF or a Factur-X hybrid e-invoice with embedded structured XML. No account required.',
      keywords: 'free Factur-X generator, Factur-X invoice generator, create Factur-X online, free invoice generator, Factur-X PDF, hybrid electronic invoice, embedded XML invoice, EN 16931, x-facture',
      url: 'https://x-facture.com/'
    });
  }
}
