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
  previewError = signal<string | null>(null);

  ngOnInit(): void {
    const doc = this.document();
    if (doc.templateId) this.selectedTemplate.set(doc.templateId);
    if (doc.paperSize) this.selectedPaperSize.set(doc.paperSize);

    const savedOutput = doc.specialFields?.['outputFormat'];
    const allowedOutputs: Record<string, string[]> = {
      invoices: ['pdf', 'cii', 'ubl'],
      xfacture: ['pdf', 'factur-x', 'cii', 'ubl'],
      'credit-notes': ['pdf', 'factur-x', 'cii', 'ubl'],
      'order-x': ['pdf', 'order-x']
    };
    const allowed = allowedOutputs[doc.docType] || ['pdf'];
    if (typeof savedOutput === 'string' && allowed.includes(savedOutput)) {
      this.selectedOutput.set(savedOutput as 'pdf' | 'factur-x' | 'cii' | 'ubl' | 'order-x');
    } else if (doc.docType === 'xfacture') {
      this.selectedOutput.set('factur-x');
    } else if (doc.docType === 'order-x') {
      this.selectedOutput.set('order-x');
    } else {
      this.selectedOutput.set('pdf');
    }
  }

  setTemplate(tpl: string): void { this.selectedTemplate.set(tpl); }
  setPaperSize(size: PaperSize): void { this.selectedPaperSize.set(size); }
  async onPrint(): Promise<void> {
    await document.fonts.ready;
    window.print();
  }

  async onDownloadPdf(): Promise<void> {
    this.previewError.set(null);
    this.facturXError.set(null);
    this.isGeneratingPdf.set(true);
    try {
      const element = document.getElementById('document-pdf-root');
      if (!element) throw new Error('Document PDF root element not found.');

      await this.apiService.downloadPdf(
        this.document(),
        await this.createSelfContainedHtml(element),
        this.selectedPaperSize() === 'letter' ? 'letter' : 'a4'
      );
    } catch (error) {
      console.error('[X-Facture PDF] Generation failed', {
        endpoint: '/api/generate-pdf',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      this.previewError.set(error instanceof Error ? error.message : 'Unable to generate the PDF.');
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
    this.previewError.set(null);

    if (!['xfacture', 'invoices', 'credit-notes'].includes(doc.docType)) return;

    // Keep generation tolerant of incomplete party details. The separate XML
    // health validator reports missing fields without blocking PDF/A-3 creation.
    if (!doc.items.length) {
      this.facturXError.set('Add at least one invoice line before generating the PDF.');
      return;
    }

    this.isGeneratingFacturX.set(true);
    try {
      const element = document.getElementById('document-pdf-root');
      if (!element) throw new Error('Document PDF root element not found.');

      await this.apiService.downloadFacturX(
        doc,
        await this.createSelfContainedHtml(element),
        this.selectedPaperSize() === 'letter' ? 'letter' : 'a4'
      );
    } catch (error) {
      console.error('[X-Facture Factur-X] Generation failed', {
        endpoint: '/api/generate-invoice',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      this.facturXError.set(error instanceof Error ? error.message : 'Unable to generate the Factur-X PDF.');
    } finally {
      this.isGeneratingFacturX.set(false);
    }
  }

  private async createSelfContainedHtml(element: HTMLElement): Promise<string> {
    // PDF output uses one predictable font. Remove all template font-face rules
    // and embed the app's bundled Inter font directly into the HTML payload.
    // If embedding fails, Chromium can still print using its local sans-serif fallback.
    await document.fonts.ready;

    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch {
          return [];
        }
      })
      .filter(Boolean)
      .join('\\n')
      .replace(/@import[^;]+;/g, '')
      .replace(/@font-face\\s*\\{[^}]*\\}/gi, '');

    let embeddedInterCss = '';
    try {
      embeddedInterCss = await this.createEmbeddedInterFontCss();
    } catch (error) {
      console.warn('[X-Facture PDF] Could not embed bundled Inter font; continuing with Chromium sans-serif fallback.', {
        message: error instanceof Error ? error.message : String(error)
      });
    }

    const forceInterCss = [
      '* { font-family: "Inter", Arial, sans-serif !important; }',
      '*::before, *::after { font-family: "Inter", Arial, sans-serif !important; }',
      ':root { --font-sans: "Inter", Arial, sans-serif; --font-mono: "Inter", Arial, sans-serif; }',
      'html, body, #document-pdf-root { margin: 0; font-family: "Inter", Arial, sans-serif !important; }',
      'html, body { padding: 0; background: #ffffff; }',
      '.font-mono, .doc-number-display { font-family: "Inter", Arial, sans-serif !important; font-variant-numeric: tabular-nums; }',
      '*, *::before, *::after { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }',
      '.document-render-sheet { box-sizing: border-box; }'
    ].join('\\n');

    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<style>' + styles + '\\n' + embeddedInterCss + '\\n' + forceInterCss + '</style>' +
      '</head><body>' +
      element.outerHTML +
      '</body></html>';
  }

  private async createEmbeddedInterFontCss(): Promise<string> {
    const url = new URL('/fonts/InterVariable.woff2', window.location.origin).toString();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Inter font request returned HTTP ' + response.status + '.');
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length) {
      throw new Error('Inter font file is empty.');
    }

    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
    }

    return `@font-face {
      font-family: "Inter";
      src: url("data:font/woff2;base64,${btoa(binary)}") format("woff2");
      font-style: normal;
      font-weight: 100 900;
      font-display: block;
    }`;
  }

  downloadStructured(format: 'ubl' | 'cii' | 'order-x'): void {
    const doc = this.document();
    if (format === 'order-x' && doc.docType !== 'order-x') return;
    if (format !== 'order-x' && !['invoices', 'xfacture', 'credit-notes'].includes(doc.docType)) return;
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
