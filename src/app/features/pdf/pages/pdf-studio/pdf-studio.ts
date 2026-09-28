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
  readonly mergeFiles = signal<File[]>([]);
  readonly pageCount = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly searchQuery = signal('');
  readonly thumbnails = signal<string[]>([]);
  readonly pageOrder = signal<number[]>([]);
  readonly selectedPages = signal<number[]>([]);
  readonly draggedPage = signal<number | null>(null);
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
    const selected = Array.from(input.files ?? []);

    if (!selected.length) return;

    if (this.activeTool() === 'merge-pdf') {
      this.addMergeFiles(selected);
    } else {
      await this.loadFile(selected[0]);
    }

    input.value = '';
  }

  addMergeFiles(files: File[]): void {
    const pdfs = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) return;
    this.mergeFiles.set([...this.mergeFiles(), ...pdfs]);
    this.file.set(this.mergeFiles()[0] ?? pdfs[0]);
    this.error.set(null);
  }

  removeMergeFile(index: number): void {
    const files = this.mergeFiles().filter((_, fileIndex) => fileIndex !== index);
    this.mergeFiles.set(files);
    this.file.set(files[0] ?? null);
  }

  async mergeSelectedFiles(): Promise<void> {
    const files = this.mergeFiles();
    if (files.length < 2) return;

    this.isProcessing.set(true);
    this.error.set(null);

    try {
      const bytes = await this.pdfEngine.merge(files.map(file => ({ file })));
      this.pdfEngine.download(bytes, 'x-facture-merged.pdf');
    } catch {
      this.error.set('The selected PDF files could not be merged.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  triggerUpload(input: HTMLInputElement): void {
    input.click();
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer?.files ?? []);
    if (!dropped.length) return;

    if (this.activeTool() === 'merge-pdf') {
      this.addMergeFiles(dropped);
    } else {
      await this.loadFile(dropped[0]);
    }
  }

  private async loadFile(selected: File): Promise<void> {
    this.error.set(null);
    this.isProcessing.set(true);
    this.file.set(selected);
    this.mergeFiles.set([]);
    this.pageCount.set(null);
    this.thumbnails.set([]);
    this.pageOrder.set([]);
    this.selectedPages.set([]);
    this.pageRotations.set({});

    try {
      const count = await this.pdfEngine.getPageCount(selected);
      this.pageCount.set(count);
      this.pageOrder.set(Array.from({ length: count }, (_, index) => index));
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
        await page.render({ canvas: canvas, canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.82));
        page.cleanup();
      }
      this.thumbnails.set(images);
    } finally {
      document.cleanup();
    }
  }

  togglePage(position: number): void {
    const selected = new Set(this.selectedPages());
    if (selected.has(position)) selected.delete(position);
    else selected.add(position);
    this.selectedPages.set([...selected].sort((a, b) => a - b));
  }

  onDragStart(position: number): void {
    this.draggedPage.set(position);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDropPage(position: number): void {
    const from = this.draggedPage();
    if (from === null || from === position) {
      this.draggedPage.set(null);
      return;
    }

    const order = [...this.pageOrder()];
    const thumbnails = [...this.thumbnails()];
    const [movedPage] = order.splice(from, 1);
    const [movedThumbnail] = thumbnails.splice(from, 1);
    order.splice(position, 0, movedPage);
    thumbnails.splice(position, 0, movedThumbnail);

    const selectedOriginalPages = this.selectedPages().map(index => this.pageOrder()[index]);
    const nextSelectedPositions = selectedOriginalPages
      .map(original => order.indexOf(original))
      .filter(index => index >= 0)
      .sort((a, b) => a - b);

    this.pageOrder.set(order);
    this.thumbnails.set(thumbnails);
    this.selectedPages.set(nextSelectedPositions);
    this.draggedPage.set(null);
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
    const positions = this.selectedPages();
    if (!currentFile || !positions.length) return;

    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const indices = positions.map(position => this.pageOrder()[position]);
      const bytes = await this.pdfEngine.extractPages(currentFile, indices);
      this.pdfEngine.download(bytes, 'x-facture-extracted.pdf');
    } catch {
      this.error.set('The selected pages could not be extracted.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async downloadOrganized(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;

    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const bytes = await this.pdfEngine.reorderPages(
        currentFile,
        this.pageOrder(),
        this.pageRotations(),
      );
      this.pdfEngine.download(bytes, 'x-facture-organized.pdf');
    } catch {
      this.error.set('The organized PDF could not be created.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async deleteSelected(): Promise<void> {
    const currentFile = this.file();
    const positions = this.selectedPages();
    if (!currentFile || !positions.length || positions.length >= (this.pageCount() ?? 0)) return;

    const deleted = new Set(positions);
    const nextOrder = this.pageOrder().filter((_, position) => !deleted.has(position));
    const nextThumbnails = this.thumbnails().filter((_, position) => !deleted.has(position));

    this.pageOrder.set(nextOrder);
    this.thumbnails.set(nextThumbnails);
    this.pageCount.set(nextOrder.length);
    this.selectedPages.set([]);
  }

  duplicateSelected(): void {
    const positions = this.selectedPages();
    if (!positions.length) return;

    const order = [...this.pageOrder()];
    const thumbnails = [...this.thumbnails()];
    let offset = 0;

    for (const position of positions) {
      const actualPosition = position + offset;
      order.splice(actualPosition + 1, 0, order[actualPosition]);
      thumbnails.splice(actualPosition + 1, 0, thumbnails[actualPosition]);
      offset += 1;
    }

    this.pageOrder.set(order);
    this.thumbnails.set(thumbnails);
    this.pageCount.set(order.length);
    this.selectedPages.set([]);
  }

  clearFile(): void {
    this.file.set(null);
    this.pageCount.set(null);
    this.error.set(null);
    this.thumbnails.set([]);
    this.selectedPages.set([]);
    this.pageRotations.set({});
    this.mergeFiles.set([]);
    this.draggedPage.set(null);
  }
}
