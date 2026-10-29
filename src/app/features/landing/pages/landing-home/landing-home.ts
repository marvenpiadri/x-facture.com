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
import { TemplateThumbComponent } from '../../../../shared/components/template-thumb/template-thumb';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-landing-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, TemplateThumbComponent],
  templateUrl: './landing-home.html',
  styleUrl: './landing-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingHomePage implements OnInit {
  private readonly seoService = inject(SeoService);

  readonly templates = [
    { id: 'modern', label: 'Modern', blurb: 'Balanced and friendly. A safe choice for most businesses.' },
    { id: 'classic', label: 'Minimal', blurb: 'Quiet and precise. Thin lines, lots of white space.' },
    { id: 'bold', label: 'Bold', blurb: 'Strong headings and colour blocks that stand out.' }
  ];
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
