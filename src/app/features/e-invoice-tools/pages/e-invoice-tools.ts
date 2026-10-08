import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { StructuredDocumentParserService } from '../../../core/services/structured-document-parser.service';
import { StructuredInvoiceService } from '../../../core/services/structured-invoice.service';
import { DocumentService } from '../../../core/services/document.service';
import { Router } from '@angular/router';

interface ToolDefinition {
  id: string;
  group: 'validate' | 'convert' | 'extract';
  title: string;
  description: string;
  icon: string;
  accepts: 'pdf' | 'xml' | 'pdf-xml' | 'none';
}

const TOOLS: ToolDefinition[] = [
  { id: 'validate-factur-x', group: 'validate', title: 'Validate Factur-X', description: 'Check the embedded CII against the selected Factur-X profile XSD.', icon: 'verified', accepts: 'pdf' },
  { id: 'validate-cii', group: 'validate', title: 'Validate CII XML', description: 'Validate standalone CII XML against the selected profile schema.', icon: 'fact_check', accepts: 'xml' },
  { id: 'validate-order-x', group: 'validate', title: 'Validate Order-X', description: 'Inspect Order-X XML structure and report XML-level issues.', icon: 'rule', accepts: 'xml' },
  { id: 'edit-factur-x', group: 'validate', title: 'Edit Factur-X Invoice', description: 'Extract the structured invoice so it can be brought back into the shared document workflow.', icon: 'edit_document', accepts: 'pdf' },
  { id: 'edit-cii', group: 'validate', title: 'Edit CII XML', description: 'Open CII XML for inspection and preparation for the shared invoice form.', icon: 'edit_note', accepts: 'xml' },
  { id: 'convert', group: 'convert', title: 'Conversion Studio', description: 'Choose a source and target syntax and run the appropriate document conversion.', icon: 'swap_horiz', accepts: 'none' },
  { id: 'pdf-to-factur-x', group: 'convert', title: 'PDF to Factur-X', description: 'Prepare a legacy PDF for hybrid e-invoicing.', icon: 'picture_as_pdf', accepts: 'pdf-xml' },
  { id: 'pdf-to-ubl', group: 'convert', title: 'PDF to UBL', description: 'Extract embedded CII from a hybrid PDF and convert it to UBL. Plain PDFs are not OCR-converted.', icon: 'description', accepts: 'pdf' },
  { id: 'pdf-to-cii', group: 'convert', title: 'PDF to CII', description: 'Extract embedded CII from a hybrid PDF and export it as standalone CII. Plain PDFs are not OCR-converted.', icon: 'data_object', accepts: 'pdf' },
  { id: 'cii-to-factur-x', group: 'convert', title: 'CII to Factur-X', description: 'Embed existing CII into a PDF/A-3 Factur-X container.', icon: 'picture_as_pdf', accepts: 'pdf-xml' },
  { id: 'embed', group: 'convert', title: 'Embed XML to PDF', description: 'Embed existing CII XML into a PDF using the Factur-X engine.', icon: 'merge_type', accepts: 'pdf-xml' },
  { id: 'cii-to-ubl', group: 'convert', title: 'CII to UBL', description: 'Convert CII semantic data to UBL 2.1.', icon: 'swap_horiz', accepts: 'xml' },
  { id: 'ubl-to-cii', group: 'convert', title: 'UBL to CII', description: 'Convert UBL semantic data to CII.', icon: 'swap_horiz', accepts: 'xml' },
  { id: 'cii-to-pdf', group: 'convert', title: 'CII to PDF', description: 'Open CII in the shared X-Facture document renderer.', icon: 'picture_as_pdf', accepts: 'xml' },
  { id: 'ubl-to-pdf', group: 'convert', title: 'UBL to PDF', description: 'Open UBL in the shared X-Facture document renderer.', icon: 'picture_as_pdf', accepts: 'xml' },
  { id: 'extract-xml', group: 'extract', title: 'Extract XML', description: 'Extract the embedded XML and detected profile from a Factur-X PDF.', icon: 'data_object', accepts: 'pdf' },
  { id: 'extract-attachments', group: 'extract', title: 'Extract Attachments', description: 'Inspect files embedded in a hybrid invoice.', icon: 'attach_file', accepts: 'pdf' },
  { id: 'cii-viewer', group: 'extract', title: 'CII / UBL Viewer', description: 'Read structured invoice XML directly in the browser.', icon: 'visibility', accepts: 'xml' }
];

@Component({
  selector: 'app-e-invoice-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './e-invoice-tools.html',
  styleUrl: './e-invoice-tools.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EInvoiceToolsPage {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private parser = inject(StructuredDocumentParserService);
  private structured = inject(StructuredInvoiceService);
  private documentService = inject(DocumentService);
  private router = inject(Router);

  readonly tools = TOOLS;
  readonly activeId = signal('validate-factur-x');
  readonly selectedProfile = signal('en16931');
  readonly selectedFile = signal<File | null>(null);
  readonly selectedXml = signal('');
  readonly result = signal<Record<string, unknown> | null>(null);
  readonly resultText = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  readonly activeTool = computed(() => TOOLS.find(t => t.id === this.activeId()) || TOOLS[0]);

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('tool');
      if (id && TOOLS.some(t => t.id === id)) this.selectTool(id);
    });
  }

  selectTool(id: string): void {
    this.activeId.set(id);
    this.result.set(null);
    this.resultText.set('');
    this.error.set('');
    this.selectedFile.set(null);
    this.selectedXml.set('');
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] || null;
    this.selectedFile.set(file);
    this.error.set('');
    if (file?.type.includes('xml') || file?.name.toLowerCase().endsWith('.xml')) {
      const reader = new FileReader();
      reader.onload = () => this.selectedXml.set(String(reader.result || ''));
      reader.readAsText(file);
    } else {
      this.selectedXml.set('');
    }
  }

  onXmlInput(value: string): void {
    this.selectedXml.set(value);
    this.result.set(null);
    this.resultText.set('');
  }

  async run(): Promise<void> {
    const tool = this.activeTool();
    this.busy.set(true);
    this.error.set('');
    this.result.set(null);
    this.resultText.set('');
    try {
      if (tool.id === 'cii-viewer' || tool.id === 'validate-cii' || tool.id === 'validate-order-x') {
        const xml = this.selectedXml();
        if (!xml.trim()) throw new Error('Paste or upload XML first.');
        if (tool.id === 'cii-viewer') {
          const parsed = new DOMParser().parseFromString(xml, 'application/xml');
          const parseError = parsed.querySelector('parsererror');
          if (parseError) throw new Error('The XML is not well formed.');
          const doc = this.parser.parse(xml, 'invoices');
          this.result.set({
            format: parsed.documentElement.localName === 'Invoice' ? 'UBL 2.1' : 'CII / Factur-X',
            documentNumber: doc.docNumber,
            issueDate: doc.issueDate,
            currency: doc.currency,
            seller: doc.company,
            buyer: doc.client,
            lines: doc.items,
            totals: { subtotal: doc.subtotal, tax: doc.taxAmount, total: doc.total, balanceDue: doc.balanceDue }
          });
          this.resultText.set(xml);
        } else if (tool.id === 'validate-order-x') {
          this.result.set(await this.api.validateOrderX(xml));
        } else {
          this.result.set(await this.api.validateEInvoice({ xml, profile: this.selectedProfile() }));
        }
        return;
      }

      if (tool.id === 'validate-factur-x' || tool.id === 'extract-xml' || tool.id === 'edit-factur-x') {
        const file = this.selectedFile();
        if (!file) throw new Error('Upload a Factur-X PDF first.');
        const base64 = await this.fileToBase64(file);
        if (tool.id === 'extract-xml' || tool.id === 'edit-factur-x') {
          const extracted = await this.api.extractFacturXXml(base64);
          this.result.set(extracted as unknown as Record<string, unknown>);
          this.resultText.set(extracted.xml);
          if (tool.id === 'edit-factur-x') {
            const parsed = this.parser.parse(extracted.xml, 'invoices');
            await this.documentService.saveDocument(parsed);
            this.router.navigate(['/invoices', parsed.docNumber, 'edit']);
          }
        } else {
          this.result.set(await this.api.validateEInvoice({ pdfBase64: base64, profile: this.selectedProfile() }));
        }
        return;
      }

      if (['cii-to-ubl', 'ubl-to-cii'].includes(tool.id)) {
        const xml = this.selectedXml();
        if (!xml.trim()) throw new Error('Provide source XML first.');
        const parsed = this.parser.parse(xml, 'invoices');
        const output = tool.id === 'cii-to-ubl'
          ? this.structured.generateUblInvoice(parsed)
          : this.structured.generateCiiInvoice(parsed);
        this.downloadText(output, parsed.docNumber + (tool.id === 'cii-to-ubl' ? '.ubl.xml' : '.cii.xml'));
        this.resultText.set(output);
        return;
      }

      if (tool.id === 'cii-to-pdf' || tool.id === 'ubl-to-pdf') {
        const xml = this.selectedXml();
        if (!xml.trim()) throw new Error('Provide source XML first.');
        const parsed = this.parser.parse(xml, 'invoices');
        await this.documentService.saveDocument(parsed);
        this.router.navigate(['/invoices', parsed.docNumber, 'preview']);
        return;
      }

      if (tool.id === 'pdf-to-cii' || tool.id === 'pdf-to-ubl') {
        const file = this.selectedFile();
        if (!file) throw new Error('Upload a PDF first.');
        const base64 = await this.fileToBase64(file);
        const extracted = await this.api.extractFacturXXml(base64);
        const parsed = this.parser.parse(extracted.xml, 'invoices');
        const output = tool.id === 'pdf-to-cii'
          ? this.structured.generateCiiInvoice(parsed)
          : this.structured.generateUblInvoice(parsed);
        this.downloadText(output, parsed.docNumber + (tool.id === 'pdf-to-cii' ? '.cii.xml' : '.ubl.xml'));
        this.result.set({ source: 'embedded XML', detectedProfile: extracted.profile, output: tool.id === 'pdf-to-cii' ? 'CII' : 'UBL 2.1' });
        this.resultText.set(output);
        return;
      }

      if (tool.id === 'extract-attachments') {
        const file = this.selectedFile();
        if (!file) throw new Error('Upload a Factur-X PDF first.');
        const base64 = await this.fileToBase64(file);
        const attachments = await this.api.extractFacturXAttachments(base64);
        this.result.set(attachments as unknown as Record<string, unknown>);
        return;
      }

      if (tool.id === 'embed' || tool.id === 'cii-to-factur-x') {
        const file = this.selectedFile();
        const xml = this.selectedXml();
        if (!file || !xml.trim()) throw new Error('Upload the PDF and provide the CII XML.');
        const base64 = await this.fileToBase64(file);
        const output = await this.api.embedXmlToPdf({ pdfBase64: base64, xml, profile: this.selectedProfile() });
        this.download(output.blob, output.filename);
        this.resultText.set('Factur-X PDF generated successfully.');
        return;
      }

      if (tool.id === 'edit-cii') {
        const parsed = this.parser.parse(this.selectedXml(), 'invoices');
        await this.documentService.saveDocument(parsed);
        this.router.navigate(['/invoices', parsed.docNumber, 'edit']);
        return;
      }
      this.resultText.set('');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'The operation failed.');
    } finally {
      this.busy.set(false);
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read the file.'));
      reader.readAsDataURL(file);
    });
    return dataUrl.split(',')[1] || '';
  }

  downloadAttachment(attachment: { name: string; mimeType: string; dataBase64: string }): void {
    const binary = atob(attachment.dataBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    this.download(new Blob([bytes], { type: attachment.mimeType || 'application/octet-stream' }), attachment.name || 'attachment');
  }

  private downloadText(content: string, filename: string): void {
    this.download(new Blob([content], { type: 'application/xml;charset=utf-8' }), filename);
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
