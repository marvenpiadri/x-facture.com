import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../core/services/seo.service';

@Component({
  selector: 'app-xfacture-page',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './xfacture-page.html',
  styleUrl: './xfacture-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XFacturePage implements OnInit {
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.updateMetadata({
      title: 'XFacture Invoice Generator | CII & UBL XML | X-Facture',
      description: 'Generate structured invoice XML locally with X-Facture. Export CII and UBL invoice data from your business invoice without a backend or Gotenberg.',
      keywords: 'xfacture, xfacture invoice, XFacture XML, CII invoice, UBL invoice, electronic invoice, structured invoice, e-invoicing, X-Facture',
      url: 'https://x-facture.com/invoice/xfacture'
    });
  }
}
