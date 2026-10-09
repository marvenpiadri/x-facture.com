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
  onPrint(): void { window.print(); }

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
      this.facturXError.set(error instanceof Error ? error.message : 'Unable to generate the Factur-X PDF.');
    } finally {
      this.isGeneratingFacturX.set(false);
    }
  }

  private async createSelfContainedHtml(element: HTMLElement): Promise<string> {
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
      .join('\n')
      .replace(/@import[^;]+;/g, '');

    // Download the exact font faces used by the preview and inline them as data
    // URLs. The server-side PDF renderer cannot rely on the user's font cache or
    // external Google Fonts access, so the HTML snapshot carries its own fonts.
    const embeddedFonts = await this.createEmbeddedFontCss();

    const pdfBaseStyles = [
      '* { box-sizing: border-box; }',
      'html, body { margin: 0; padding: 0; background: #ffffff; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }',
      '*, *::before, *::after { -webkit-font-smoothing: antialiased !important; -moz-osx-font-smoothing: grayscale !important; text-rendering: optimizeLegibility !important; }',
      '.font-mono, code, pre { font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace !important; }',
      '.document-render-sheet { box-sizing: border-box; }'
    ].join('\n');

    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<style>' + embeddedFonts + '\n' + pdfBaseStyles + '\n' + styles + '</style>' +
      '</head><body>' +
      element.outerHTML +
      '</body></html>';
  }

  private async createEmbeddedFontCss(): Promise<string> {
    const stylesheetUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap';
    try {
      const response = await fetch(stylesheetUrl);
      if (!response.ok) return '';
      let css = await response.text();
      const fontUrls = [...new Set(Array.from(css.matchAll(/url\((https:\/\/[^)]+\.woff2[^)]*)\)/g), match => match[1]))];
      const embedded = await Promise.all(fontUrls.map(async url => {
        try {
          const fontResponse = await fetch(url);
          if (!fontResponse.ok) return null;
          const bytes = new Uint8Array(await fontResponse.arrayBuffer());
          let binary = '';
          const chunkSize = 0x8000;
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
          }
          return { url, data: 'data:font/woff2;base64,' + btoa(binary) };
        } catch {
          return null;
        }
      }));
      for (const font of embedded) {
        if (font) css = css.split(font.url).join(font.data);
      }
      return css;
    } catch {
      return '';
    }
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
