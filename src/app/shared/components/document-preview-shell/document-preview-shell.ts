import {
  ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BusinessDocument, DocumentStatus, PaperSize } from '../../../core/models/document.model';
import { DocumentTypeConfig } from '../../../core/models/document-type-config.model';
import { TemplateRendererComponent } from '../template-renderer/template-renderer';
import { DocumentService } from '../../../core/services/document.service';
import { StructuredInvoiceService } from '../../../core/services/structured-invoice.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-document-preview-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, TemplateRendererComponent],
  templateUrl: './document-preview-shell.html',
  styleUrl: './document-preview-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentPreviewShellComponent implements OnInit {
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private structuredInvoiceService = inject(StructuredInvoiceService);
  private apiService = inject(ApiService);

  document = input.required<BusinessDocument>();
  config = input.required<DocumentTypeConfig>();
  statusChange = output<DocumentStatus>();
  delete = output<void>();

  selectedTemplate = signal<string>('modern');
  selectedPaperSize = signal<PaperSize>('a4');
  selectedOutput = signal<'pdf' | 'factur-x' | 'cii' | 'ubl' | 'order-x'>('pdf');
  isGeneratingPdf = signal<boolean>(false);
  isGeneratingFacturX = signal<boolean>(false);
  facturXError = signal<string | null>(null);

  ngOnInit(): void {
    if (this.document().templateId) this.selectedTemplate.set(this.document().templateId);
    if (this.document().paperSize) this.selectedPaperSize.set(this.document().paperSize);
    const output = this.document().specialFields?.['outputFormat'];
    // Ordinary invoices must not silently turn into Factur-X because of an old saved draft.
    if (this.document().docType === 'invoices' && output === 'factur-x') {
      this.selectedOutput.set('pdf');
    } else if (output === 'pdf' || output === 'factur-x' || output === 'cii' || output === 'ubl' || output === 'order-x') {
      this.selectedOutput.set(output);
    }
  }

  setTemplate(tpl: string): void { this.selectedTemplate.set(tpl); }
  setPaperSize(size: PaperSize): void { this.selectedPaperSize.set(size); }
  onPrint(): void { window.print(); }

  async onDownloadPdf(): Promise<void> {
    this.isGeneratingPdf.set(true);
    try {
      const element = document.getElementById('document-pdf-root');
      if (!element) throw new Error('Document PDF root element not found.');

      await this.apiService.downloadPdf(
        this.document(),
        this.createSelfContainedHtml(element),
        this.selectedPaperSize() === 'letter' ? 'letter' : 'a4'
      );
    } catch (error) {
      console.error('PDF generation failed:', error);
    } finally {
      this.isGeneratingPdf.set(false);
    }
  }

  async downloadSelectedOutput(): Promise<void> {
    const output = this.selectedOutput();
    if (output === 'pdf') return this.onDownloadPdf();
    if (output === 'factur-x') return this.onDownloadFacturX();
    if (output === 'cii') return this.downloadStructured('cii');
    if (output === 'ubl') return this.downloadStructured('ubl');
    return this.downloadStructured('order-x');
  }

  async onDownloadFacturX(): Promise<void> {
    const doc = this.document();
    this.facturXError.set(null);

    if (!['xfacture', 'invoices', 'credit-notes'].includes(doc.docType)) return;

    const missing: string[] = [];
    if (!doc.company.name?.trim()) missing.push('seller name');
    if (!doc.company.address?.trim()) missing.push('seller address');
    if (!doc.client.name?.trim()) missing.push('buyer name');
    if (!doc.client.address?.trim()) missing.push('buyer address');
    if (!doc.issueDate) missing.push('issue date');
    if (!doc.items.length) missing.push('at least one line item');

    if (missing.length) {
      this.facturXError.set('Complete the following Factur-X fields in this form: ' + missing.join(', ') + '.');
      return;
    }

    this.isGeneratingFacturX.set(true);
    try {
      const element = document.getElementById('document-pdf-root');
      if (!element) throw new Error('Document PDF root element not found.');

      await this.apiService.downloadFacturX(
        doc,
        this.createSelfContainedHtml(element),
        this.selectedPaperSize() === 'letter' ? 'letter' : 'a4'
      );
    } catch (error) {
      this.facturXError.set(error instanceof Error ? error.message : 'Unable to generate the Factur-X PDF.');
    } finally {
      this.isGeneratingFacturX.set(false);
    }
  }

  private createSelfContainedHtml(element: HTMLElement): string {
    /*
     * The preview is the source of truth for the PDF. Collect the actual
     * stylesheet rules currently applied to the document instead of only
     * Angular's <style> tags. This keeps global tokens, box-sizing and the
     * invoice renderer styles in the server-side HTML snapshot.
     */
    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch {
          // Cross-origin stylesheets (for example Google Fonts) are added
          // explicitly below and cannot always be read through cssRules.
          return [];
        }
      })
      .filter(Boolean)
      .join('\n');

    const pdfBaseStyles = [
      '* { box-sizing: border-box; }',
      'html, body { margin: 0; padding: 0; background: #ffffff; }',
      'body { font-family: Inter, sans-serif; }',
      '.document-render-sheet { box-sizing: border-box; }'
    ].join('\n');

    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap">' +
      '<style>' + pdfBaseStyles + '\n' + styles + '</style>' +
      '</head><body>' +
      element.outerHTML +
      '</body></html>';
  }

  downloadStructured(format: 'ubl' | 'cii' | 'order-x'): void {
    const doc = this.document();
    if (format === 'order-x' && doc.docType !== 'order-x') return;
    if (format !== 'order-x' && doc.docType !== 'invoices' && doc.docType !== 'credit-notes') return;
    this.structuredInvoiceService.download(doc, format);
  }

  async onDuplicate(): Promise<void> {
    const doc = this.document();
    const cloned = await this.documentService.duplicateDocument(doc.id);
    if (cloned) this.router.navigate(['/' + cloned.docType + '/' + cloned.docNumber + '/edit']);
  }

  onEdit(): void {
    const doc = this.document();
    this.router.navigate(['/' + doc.docType + '/' + doc.docNumber + '/edit']);
  }

  updateStatus(status: DocumentStatus): void { this.statusChange.emit(status); }

  confirmDelete(): void {
    if (confirm('Are you sure you want to delete ' + this.document().docNumber + '? This cannot be undone.')) {
      this.delete.emit();
    }
  }
}
