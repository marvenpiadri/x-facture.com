import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { BusinessDocument, DocumentLineItem, DocumentParty } from '../../../../core/models/document.model';
import { CountryOption, COUNTRY_OPTIONS } from '../../../../core/data/country-options';
import { TemplateRendererComponent } from '../../../../shared/components/template-renderer/template-renderer';

@Component({
  selector: 'app-xfacture-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TemplateRendererComponent],
  templateUrl: './xfacture-page.html',
  styleUrl: './xfacture-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class XFacturePage {
  private readonly apiService = inject(ApiService);

  readonly countries: CountryOption[] = COUNTRY_OPTIONS;
  readonly isGenerating = signal(false);
  readonly error = signal<string | null>(null);
  readonly logoError = signal<string | null>(null);
  readonly draft = signal<BusinessDocument>(this.createDocument());

  readonly total = computed(() => {
    const doc = this.draft();
    const subtotal = doc.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = doc.items.reduce((sum, item) => sum + item.amount * item.taxRate / 100, 0);
    return this.round(subtotal + tax);
  });

  readonly subtotal = computed(() =>
    this.round(this.draft().items.reduce((sum, item) => sum + item.amount, 0))
  );

  readonly taxAmount = computed(() =>
    this.round(this.draft().items.reduce((sum, item) => sum + item.amount * item.taxRate / 100, 0))
  );

  readonly canGenerate = computed(() => {
    const doc = this.draft();
    return Boolean(
      doc.docNumber.trim() &&
      doc.issueDate &&
      doc.company.name?.trim() &&
      doc.company.address?.trim() &&
      doc.company.city?.trim() &&
      doc.company.postalCode?.trim() &&
      doc.company.country &&
      doc.company.taxId?.trim() &&
      doc.client.name?.trim() &&
      doc.client.address?.trim() &&
      doc.client.city?.trim() &&
      doc.client.postalCode?.trim() &&
      doc.client.country &&
      doc.client.taxId?.trim() &&
      doc.items.length > 0 &&
      doc.items.every(item => item.description.trim() && item.quantity > 0 && item.unitCost >= 0 && item.taxRate >= 0)
    );
  });

  updateHeader(field: 'docNumber' | 'issueDate' | 'dueDate' | 'currency', value: string): void {
    this.draft.update(doc => ({ ...doc, [field]: value }));
  }

  updateParty(party: 'company' | 'client', field: keyof DocumentParty, value: string): void {
    this.draft.update(doc => ({
      ...doc,
      [party]: { ...doc[party], [field]: value }
    }));
  }

  updateItem(index: number, field: keyof DocumentLineItem, value: string | number): void {
    this.draft.update(doc => {
      const items = doc.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [field]: field === 'description' ? String(value) : Number(value) || 0 };
        const quantity = Math.max(0, Number(next.quantity) || 0);
        const unitCost = Math.max(0, Number(next.unitCost) || 0);
        const discount = Math.min(100, Math.max(0, Number(next.discountPercent) || 0));
        return {
          ...next,
          quantity,
          unitCost,
          discountPercent: discount,
          amount: this.round(quantity * unitCost * (1 - discount / 100))
        };
      });
      return { ...doc, items };
    });
  }

  addItem(): void {
    this.draft.update(doc => ({
      ...doc,
      items: [
        ...doc.items,
        {
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unitCost: 0,
          taxRate: 20,
          discountPercent: 0,
          amount: 0
        }
      ]
    }));
  }

  removeItem(index: number): void {
    this.draft.update(doc => {
      if (doc.items.length === 1) return doc;
      return { ...doc, items: doc.items.filter((_, itemIndex) => itemIndex !== index) };
    });
  }

  async onLogoSelected(event: Event): Promise<void> {
    this.logoError.set(null);
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      this.logoError.set('Use a PNG, JPEG or WebP logo.');
      input.value = '';
      return;
    }

    if (file.size > 1_500_000) {
      this.logoError.set('Logo must be smaller than 1.5 MB.');
      input.value = '';
      return;
    }

    const dataUrl = await this.readFile(file);
    this.draft.update(doc => ({
      ...doc,
      company: { ...doc.company, logoUrl: dataUrl }
    }));
    input.value = '';
  }

  removeLogo(): void {
    this.draft.update(doc => ({
      ...doc,
      company: { ...doc.company, logoUrl: undefined }
    }));
  }

  async generate(): Promise<void> {
    this.error.set(null);
    if (!this.canGenerate()) {
      this.error.set('Complete the required seller, buyer, date and invoice line fields before generating Factur-X.');
      return;
    }

    this.isGenerating.set(true);
    try {
      const element = document.querySelector('#xfacture-preview-host #document-pdf-root') as HTMLElement | null;
      if (!element) throw new Error('Invoice preview is not ready.');

      const result = await this.apiService.generateFacturX({
        htmlLayout: this.createSelfContainedHtml(element),
        paperSize: 'a4',
        rawInvoiceData: this.toApiInvoice(this.draft())
      });

      const filename = result.filename || this.draft().docNumber + '-factur-x.pdf';
      this.downloadBlob(result.blob, filename);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to generate the Factur-X invoice.');
    } finally {
      this.isGenerating.set(false);
    }
  }

  private toApiInvoice(doc: BusinessDocument): Record<string, unknown> {
    return {
      id: doc.docNumber,
      invoiceNumber: doc.docNumber,
      date: doc.issueDate,
      dueDate: doc.dueDate || undefined,
      currency: doc.currency,
      seller: {
        name: doc.company.legalName || doc.company.name,
        address: {
          line1: doc.company.address,
          city: doc.company.city,
          postalCode: doc.company.postalCode,
          country: doc.company.country
        },
        vatId: doc.company.taxId
      },
      buyer: {
        name: doc.client.legalName || doc.client.name,
        address: {
          line1: doc.client.address,
          city: doc.client.city,
          postalCode: doc.client.postalCode,
          country: doc.client.country
        },
        vatId: doc.client.taxId
      },
      items: doc.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitCost,
        vatRate: item.taxRate,
        discountPercent: item.discountPercent
      })),
      amountPaid: doc.depositPaid
    };
  }

  private createDocument(): BusinessDocument {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: 'xfacture-draft',
      docNumber: 'INV-' + today.replaceAll('-', '') + '-001',
      slug: 'xfacture-draft',
      docType: 'invoices',
      docTypeLabel: 'Tax Invoice',
      status: 'draft',
      currency: 'EUR',
      issueDate: today,
      dueDate: '',
      lineLayoutMode: 'quantity',
      templateId: 'modern',
      paperSize: 'a4',
      hasPricing: true,
      items: [{
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unitCost: 0,
        taxRate: 20,
        discountPercent: 0,
        amount: 0
      }],
      subtotal: 0,
      taxRate: 20,
      taxAmount: 0,
      discountAmount: 0,
      shippingAmount: 0,
      total: 0,
      depositPaid: 0,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      company: { name: '', address: '', city: '', postalCode: '', country: '' },
      client: { name: '', address: '', city: '', postalCode: '', country: '' }
    };
  }

  private createSelfContainedHtml(element: HTMLElement): string {
    const styles = Array.from(document.querySelectorAll('style'))
      .map(style => style.textContent || '')
      .filter(Boolean)
      .join('\n');

    return '<!doctype html><html><head><meta charset="utf-8"><style>' +
      styles +
      '</style></head><body>' +
      element.outerHTML +
      '</body></html>';
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read the logo file.'));
      reader.readAsDataURL(file);
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
