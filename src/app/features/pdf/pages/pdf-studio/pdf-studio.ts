import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PdfEngineService } from '../../../core/services/pdf-engine.service';

type PdfCategory = 'organize' | 'edit' | 'convert' | 'security';

interface PdfTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PdfCategory;
  route: string;
}

@Component({
  selector: 'app-pdf-studio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pdf-studio.html',
  styleUrl: './pdf-studio.css',
})
export class PdfStudioPage {
  private readonly route = inject(ActivatedRoute);
  readonly pdfEngine = inject(PdfEngineService);

  readonly activeTool = signal<string>('organize-pdf');
  readonly file = signal<File | null>(null);
  readonly pageCount = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly isProcessing = signal(false);

  readonly tools: PdfTool[] = [
    { id: 'organize-pdf', name: 'Organize Pages', description: 'Reorder, rotate and remove pages.', icon: 'view_carousel', category: 'organize', route: '/pdf/organize-pdf' },
    { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine files in the order you choose.', icon: 'merge_type', category: 'organize', route: '/pdf/merge-pdf' },
    { id: 'split-pdf', name: 'Split PDF', description: 'Extract pages or page ranges.', icon: 'content_cut', category: 'organize', route: '/pdf/split-pdf' },
    { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate pages permanently.', icon: 'rotate_right', category: 'organize', route: '/pdf/rotate-pdf' },
    { id: 'pdf-editor', name: 'PDF Editor', description: 'Edit and annotate PDF content.', icon: 'edit', category: 'edit', route: '/pdf/pdf-editor' },
    { id: 'add-watermark', name: 'Watermark', description: 'Stamp text or branding onto pages.', icon: 'branding_watermark', category: 'edit', route: '/pdf/add-watermark' },
    { id: 'add-page-numbers', name: 'Page Numbers', description: 'Add configurable page numbering.', icon: 'format_list_numbered', category: 'edit', route: '/pdf/add-page-numbers' },
    { id: 'image-to-pdf', name: 'Image to PDF', description: 'Create PDFs from images.', icon: 'image', category: 'convert', route: '/pdf/image-to-pdf' },
    { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF content to editable documents.', icon: 'description', category: 'convert', route: '/pdf/pdf-to-word' },
    { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert office documents to PDF.', icon: 'upload_file', category: 'convert', route: '/pdf/word-to-pdf' },
    { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract structured tables.', icon: 'table_chart', category: 'convert', route: '/pdf/pdf-to-excel' },
    { id: 'pdf-to-image', name: 'PDF to Image', description: 'Export pages as images.', icon: 'photo_library', category: 'convert', route: '/pdf/pdf-to-image' },
    { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce size while preserving quality.', icon: 'compress', category: 'security', route: '/pdf/compress-pdf' },
    { id: 'protect-pdf', name: 'Protect PDF', description: 'Secure PDFs with password protection.', icon: 'lock', category: 'security', route: '/pdf/protect-pdf' },
    { id: 'sign-pdf', name: 'Sign PDF', description: 'Prepare documents for signing.', icon: 'draw', category: 'security', route: '/pdf/sign-pdf' },
    { id: 'repair-pdf', name: 'Repair PDF', description: 'Recover and sanitize damaged PDFs.', icon: 'build', category: 'security', route: '/pdf/repair-pdf' },
  ];

  readonly categoryLabels: Record<PdfCategory, string> = {
    organize: 'Organize',
    edit: 'Edit & Content',
    convert: 'Convert',
    security: 'Security & Utilities',
  };

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.activeTool.set(params.get('tool') || 'organize-pdf');
    });
  }

  toolsFor(category: PdfCategory): PdfTool[] {
    return this.tools.filter(tool => tool.category === category);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];

    if (!selected) return;

    this.error.set(null);
    this.file.set(selected);

    try {
      this.pageCount.set(await this.pdfEngine.getPageCount(selected));
    } catch {
      this.pageCount.set(null);
      this.error.set('This file could not be opened as a valid PDF.');
    } finally {
      input.value = '';
    }
  }

  triggerUpload(input: HTMLInputElement): void {
    input.click();
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const dropped = event.dataTransfer?.files?.[0];
    if (!dropped) return;

    this.error.set(null);
    this.file.set(dropped);

    try {
      this.pageCount.set(await this.pdfEngine.getPageCount(dropped));
    } catch {
      this.pageCount.set(null);
      this.error.set('This file could not be opened as a valid PDF.');
    }
  }

  clearFile(): void {
    this.file.set(null);
    this.pageCount.set(null);
    this.error.set(null);
  }
}
