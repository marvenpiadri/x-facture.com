import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BusinessDocument } from '../../../core/models/document.model';
import { CurrencyService } from '../../../core/services/currency.service';
import { CalculationService, DocumentTotalsResult } from '../../../core/services/calculation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-template-renderer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './template-renderer.html',
  styleUrl: './template-renderer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateRendererComponent {
  private currencyService = inject(CurrencyService);
  private calculationService = inject(CalculationService);

  document = input.required<BusinessDocument>();
  templateId = input<string>();
  paperSize = input<string>();

  // Derived active template ID (allows preview bar to switch live)
  activeTemplate = computed(() => {
    return this.templateId() || this.document().templateId || 'modern';
  });

  // Derived active paper size
  activePaperSize = computed(() => {
    return this.paperSize() || this.document().paperSize || 'a4';
  });

  currencySymbol = computed(() => {
    return this.currencyService.getSymbol(this.document().currency);
  });

  calculatedTotals = computed<DocumentTotalsResult>(() => {
    const doc = this.document();
    return this.calculationService.calculateDocumentTotals(
      doc.items || [],
      doc.taxRate || 0,
      doc.discountAmount || 0,
      doc.shippingAmount || 0,
      doc.depositPaid || 0,
      doc.discounts || [],
      doc.deliveryDiscount || 0,
      doc.deliveryTaxRate || 0
    );
  });

  taxBreakdown = computed(() => {
    return this.calculatedTotals().taxBreakdown || [];
  });

  /** VAT categories are shown only when the invoice contains an explicit code. */
  hasVatCategories = computed(() => this.taxBreakdown().some(row => this.taxCategoryLabel(row.taxRate)));

  taxCategoryLabel(rate: number): string {
    const matchingItem = (this.document().items || []).find(item =>
      Math.abs(Number(item.taxRate) - Number(rate)) < 0.01
    );

    return matchingItem?.taxCategoryCode?.trim() ?? '';
  }

  formatCurrency(amount: number | undefined | null): string {
    return this.currencyService.format(amount, this.document().currency);
  }
}
