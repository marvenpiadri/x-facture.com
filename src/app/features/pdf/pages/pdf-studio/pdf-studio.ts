import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PdfEngineService } from '../../../../core/services/pdf-engine.service';

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
  readonly searchQuery = signal('');
  readonly thumbnails = signal<string[]>([]);
  readonly selectedPages = signal<number[]>([]);
  readonly pageRotations = signal<Record<number, number>>({});
  readonly zoom = signal(0.72);
  readonly Math = Math;

  readonly tools: PdfTool[] = [
    { id: 'organize-pdf', name: 'Organize Pages', description: 'Reorder, rotate and remove pages.', icon: 'view_carousel', category: 'organize', route: '/pdf/organize-pdf' },
    { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine files in the order you choose.', icon: 'merge_type', category: 'organize', route: '/pdf/merge-pdf' },
    { id: 'split-pdf', name: 'Split PDF', description: 'Extract pages or page ranges.', icon: 'content_cut', category: 'organize', route: '/pdf/split-pdf' },
    { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate pages permanently.', icon: 'rotate_right', category: 'organize', route: '/pdf/rotate-pdf' },
    { id: 'flatten-pdf', name: 'Flatten PDF', description: 'Flatten interactive content into a clean document.', icon: 'layers_clear', category: 'organize', route: '/pdf/flatten-pdf' },
    { id: 'pdf-editor', name: 'PDF Editor', description: 'Edit and annotate PDF content.', icon: 'edit', category: 'edit', route: '/pdf/pdf-editor' },
    { id: 'add-watermark', name: 'Watermark', description: 'Stamp text or branding onto pages.', icon: 'branding_watermark', category: 'edit', route: '/pdf/add-watermark' },
    { id: 'add-page-numbers', name: 'Page Numbers', description: 'Add configurable page numbering.', icon: 'format_list_numbered', category: 'edit', route: '/pdf/add-page-numbers' },
    { id: 'image-to-pdf', name: 'Image to PDF', description: 'Create PDFs from images.', icon: 'image', category: 'convert', route: '/pdf/image-to-pdf' },
    { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF content to editable documents.', icon: 'description', category: 'convert', route: '/pdf/pdf-to-word' },
    { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert office documents to PDF.', icon: 'upload_file', category: 'convert', route: '/pdf/word-to-pdf' },
    { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract structured tables.', icon: 'table_chart', category: 'convert', route: '/pdf/pdf-to-excel' },
    { id: 'pdf-to-image', name: 'PDF to Image', description: 'Export pages as images.', icon: 'photo_library', category: 'convert', route: '/pdf/pdf-to-image' },
    { id: 'epub-to-pdf', name: 'EPUB to PDF', description: 'Turn ebooks into PDF documents.', icon: 'menu_book', category: 'convert', route: '/pdf/epub-to-pdf' },
    { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Turn spreadsheets into polished PDFs.', icon: 'table_view', category: 'convert', route: '/pdf/excel-to-pdf' },
    { id: 'markdown-to-pdf', name: 'Markdown to PDF', description: 'Render Markdown as a clean document.', icon: 'code', category: 'convert', route: '/pdf/markdown-to-pdf' },
    { id: 'csv-to-pdf', name: 'CSV to PDF', description: 'Turn tabular data into a PDF report.', icon: 'table_chart', category: 'convert', route: '/pdf/csv-to-pdf' },
    { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce size while preserving quality.', icon: 'compress', category: 'security', route: '/pdf/compress-pdf' },
    { id: 'protect-pdf', name: 'Protect PDF', description: 'Secure PDFs with password protection.', icon: 'lock', category: 'security', route: '/pdf/protect-pdf' },
    { id: 'sign-pdf', name: 'Sign PDF', description: 'Prepare documents for signing.', icon: 'draw', category: 'security', route: '/pdf/sign-pdf' },
    { id: 'repair-pdf', name: 'Repair PDF', description: 'Recover and sanitize damaged PDFs.', icon: 'build', category: 'security', route: '/pdf/repair-pdf' },
    { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove PDF password protection when permitted.', icon: 'key', category: 'security', route: '/pdf/unlock-pdf' },
    { id: 'pdf-ocr', name: 'PDF OCR & Text', description: 'Extract searchable text from PDF documents.', icon: 'text_snippet', category: 'security', route: '/pdf/pdf-ocr' },
    { id: 'pdf-metadata', name: 'PDF Metadata', description: 'Inspect and clean document metadata.', icon: 'info', category: 'security', route: '/pdf/pdf-metadata' },
  ];

  readonly categories: PdfCategory[] = ['organize', 'edit', 'convert', 'security'];

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

  get filteredTools(): PdfTool[] {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.tools;
    return this.tools.filter(tool =>
      `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query)
    );
  }

  toolsFor(category: PdfCategory): PdfTool[] {
    return this.filteredTools.filter(tool => tool.category === category);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0];

    if (!selected) return;
    await this.loadFile(selected);
    input.value = '';
  }

  triggerUpload(input: HTMLInputElement): void {
    input.click();
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const dropped = event.dataTransfer?.files?.[0];
    if (!dropped) return;
    await this.loadFile(dropped);
  }

  private async loadFile(selected: File): Promise<void> {
    this.error.set(null);
    this.isProcessing.set(true);
    this.file.set(selected);
    this.pageCount.set(null);
    this.thumbnails.set([]);
    this.selectedPages.set([]);
    this.pageRotations.set({});

    try {
      const count = await this.pdfEngine.getPageCount(selected);
      this.pageCount.set(count);
      this.selectedPages.set(Array.from({ length: count }, (_, index) => index));
      await this.renderThumbnails(selected, count);
    } catch {
      this.pageCount.set(null);
      this.file.set(null);
      this.error.set('This file could not be opened as a valid PDF.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async renderThumbnails(file: File, count: number): Promise<void> {
    if (typeof window === 'undefined') return;

    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';

    const bytes = new Uint8Array(await file.arrayBuffer());
    const document = await pdfjs.getDocument({ data: bytes }).promise;
    const images: string[] = [];

    try {
      for (let index = 1; index <= count; index += 1) {
        const page = await document.getPage(index);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(0.72, 120 / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = window.document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        if (!context) continue;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.82));
        page.cleanup();
      }
      this.thumbnails.set(images);
    } finally {
      await document.destroy();
    }
  }

  togglePage(index: number): void {
    const selected = new Set(this.selectedPages());
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
    this.selectedPages.set([...selected].sort((a, b) => a - b));
  }

  selectAll(): void {
    const count = this.pageCount() ?? 0;
    this.selectedPages.set(Array.from({ length: count }, (_, index) => index));
  }

  deselectAll(): void {
    this.selectedPages.set([]);
  }

  rotatePage(index: number): void {
    const rotations = { ...this.pageRotations() };
    rotations[index] = ((rotations[index] ?? 0) + 90) % 360;
    this.pageRotations.set(rotations);
  }

  isSelected(index: number): boolean {
    return this.selectedPages().includes(index);
  }

  async extractSelected(): Promise<void> {
    const currentFile = this.file();
    const selected = this.selectedPages();
    if (!currentFile || !selected.length) return;

    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const bytes = await this.pdfEngine.extractPages(currentFile, selected);
      this.pdfEngine.download(bytes, 'x-facture-extracted.pdf');
    } catch {
      this.error.set('The selected pages could not be extracted.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  clearFile(): void {
    this.file.set(null);
    this.pageCount.set(null);
    this.error.set(null);
    this.thumbnails.set([]);
    this.selectedPages.set([]);
    this.pageRotations.set({});
  }
}
