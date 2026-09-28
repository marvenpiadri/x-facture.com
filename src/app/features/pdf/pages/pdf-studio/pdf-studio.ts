import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PdfEngineService } from '../../../../core/services/pdf-engine.service';

type PdfCategory = 'organize' | 'edit' | 'convert' | 'security' | 'intelligence';
type SplitMode = 'selected' | 'ranges' | 'every-page';
type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type PageNumberPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface PdfTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PdfCategory;
  route: string;
  available?: boolean;
}

interface MergePage {
  id: string;
  sourceIndex: number;
  thumbnail: string;
  rotation: number;
}

interface MergeDocument {
  id: string;
  file: File;
  pages: MergePage[];
}

@Component({
  selector: 'app-pdf-studio',
  standalone: true,
  imports: [CommonModule, RouterModule, DragDropModule],
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
  readonly mergeDocuments = signal<MergeDocument[]>([]);
  readonly pageCount = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly isProcessing = signal(false);
  readonly searchQuery = signal('');
  readonly splitMode = signal<SplitMode>('selected');
  readonly splitRanges = signal('');
  readonly splitChunkSize = signal(1);
  readonly rotateAngle = signal(90);
  readonly rotateScope = signal<'all' | 'selected'>('all');
  readonly watermarkText = signal('CONFIDENTIAL');
  readonly watermarkOpacity = signal(0.25);
  readonly watermarkFontSize = signal(42);
  readonly watermarkAngle = signal(45);
  readonly watermarkPosition = signal<WatermarkPosition>('center');
  readonly pageNumberStart = signal(1);
  readonly pageNumberFontSize = signal(10);
  readonly pageNumberPosition = signal<PageNumberPosition>('bottom-center');
  readonly cropMargin = signal(24);
  readonly editText = signal('');
  readonly editTextFontSize = signal(18);
  readonly editTextPosition = signal<'top-left' | 'center' | 'bottom-left'>('top-left');
  readonly metadata = signal({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' });
  readonly imageFiles = signal<File[]>([]);
  readonly imagePageSize = signal<'a4' | 'letter' | 'fit'>('a4');
  readonly pdfToImageScale = signal(1.5);
  readonly isFileDragActive = signal(false);
  readonly isPageDropActive = signal(false);
  readonly isMergeDropActive = signal(false);
  readonly thumbnails = signal<string[]>([]);
  readonly pageOrder = signal<number[]>([]);
  readonly selectedPages = signal<number[]>([]);
  readonly pageRotations = signal<Record<number, number>>({});
  readonly draggedPage = signal<number | null>(null);
  readonly zoom = signal(0.72);
  readonly Math = Math;

  readonly tools: PdfTool[] = [
    { id: 'organize-pdf', name: 'Organize Pages', description: 'Reorder, rotate and remove pages.', icon: 'view_carousel', category: 'organize', route: '/pdf/organize-pdf' },
    { id: 'merge-pdf', name: 'Merge PDF', description: 'Compose several PDFs at document and page level.', icon: 'merge_type', category: 'organize', route: '/pdf/merge-pdf' },
    { id: 'split-pdf', name: 'Split PDF', description: 'Extract pages, ranges or evenly sized parts.', icon: 'content_cut', category: 'organize', route: '/pdf/split-pdf' },
    { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate pages permanently.', icon: 'rotate_right', category: 'organize', route: '/pdf/rotate-pdf' },
    { id: 'flatten-pdf', name: 'Flatten PDF', description: 'Flatten interactive content into a clean document.', icon: 'layers_clear', category: 'organize', route: '/pdf/flatten-pdf', available: true },
    { id: 'remove-pages', name: 'Remove Pages', description: 'Remove selected pages while preserving the rest of the document.', icon: 'delete_sweep', category: 'organize', route: '/pdf/remove-pages', available: true },
    { id: 'extract-pages', name: 'Extract Pages', description: 'Build a new PDF from selected pages.', icon: 'content_copy', category: 'organize', route: '/pdf/extract-pages', available: true },
    { id: 'crop-pdf', name: 'Crop PDF', description: 'Trim page boundaries with controlled crop margins.', icon: 'crop', category: 'edit', route: '/pdf/crop-pdf', available: true },
    { id: 'pdf-editor', name: 'PDF Editor', description: 'Add text overlays to PDF pages.', icon: 'edit', category: 'edit', route: '/pdf/pdf-editor' , available: true },
    { id: 'add-watermark', name: 'Watermark', description: 'Stamp configurable text onto selected or all pages.', icon: 'branding_watermark', category: 'edit', route: '/pdf/add-watermark' , available: true },
    { id: 'add-page-numbers', name: 'Page Numbers', description: 'Add configurable page numbering.', icon: 'format_list_numbered', category: 'edit', route: '/pdf/add-page-numbers', available: false },
    { id: 'pdf-forms', name: 'PDF Forms', description: 'Create, fill and manage interactive PDF forms.', icon: 'assignment', category: 'edit', route: '/pdf/pdf-forms', available: false },
    { id: 'redact-pdf', name: 'Redact PDF', description: 'Permanently remove sensitive content from a document.', icon: 'visibility_off', category: 'edit', route: '/pdf/redact-pdf', available: false },
    { id: 'image-to-pdf', name: 'Image to PDF', description: 'Create PDFs from images.', icon: 'image', category: 'convert', route: '/pdf/image-to-pdf' },
    { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF content to editable documents.', icon: 'description', category: 'convert', route: '/pdf/pdf-to-word' , available: false },
    { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert office documents to PDF.', icon: 'upload_file', category: 'convert', route: '/pdf/word-to-pdf' , available: false },
    { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract structured tables.', icon: 'table_chart', category: 'convert', route: '/pdf/pdf-to-excel' , available: false },
    { id: 'pdf-to-image', name: 'PDF to Image', description: 'Export pages as images.', icon: 'photo_library', category: 'convert', route: '/pdf/pdf-to-image' },
    { id: 'epub-to-pdf', name: 'EPUB to PDF', description: 'Turn ebooks into PDF documents.', icon: 'menu_book', category: 'convert', route: '/pdf/epub-to-pdf' , available: false },
    { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Turn spreadsheets into polished PDFs.', icon: 'table_view', category: 'convert', route: '/pdf/excel-to-pdf' , available: false },
    { id: 'markdown-to-pdf', name: 'Markdown to PDF', description: 'Render Markdown as a clean document.', icon: 'code', category: 'convert', route: '/pdf/markdown-to-pdf' , available: false },
    { id: 'csv-to-pdf', name: 'CSV to PDF', description: 'Turn tabular data into a PDF report.', icon: 'table_chart', category: 'convert', route: '/pdf/csv-to-pdf', available: false },
    { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', description: 'Convert PDF pages into editable presentations.', icon: 'slideshow', category: 'convert', route: '/pdf/pdf-to-powerpoint', available: false },
    { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', description: 'Convert presentations into PDF documents.', icon: 'present_to_all', category: 'convert', route: '/pdf/powerpoint-to-pdf', available: false },
    { id: 'pdf-to-pdfa', name: 'PDF to PDF/A', description: 'Prepare PDFs for long-term archival workflows.', icon: 'archive', category: 'convert', route: '/pdf/pdf-to-pdfa', available: false },
    { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Render web content into a PDF document.', icon: 'language', category: 'convert', route: '/pdf/html-to-pdf', available: false },
    { id: 'pdf-to-markdown', name: 'PDF to Markdown', description: 'Extract structured document content as Markdown.', icon: 'code', category: 'convert', route: '/pdf/pdf-to-markdown', available: false },
    { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce size while preserving quality.', icon: 'compress', category: 'security', route: '/pdf/compress-pdf', available: false },
    { id: 'protect-pdf', name: 'Protect PDF', description: 'Secure PDFs with password protection.', icon: 'lock', category: 'security', route: '/pdf/protect-pdf' , available: false },
    { id: 'sign-pdf', name: 'Sign PDF', description: 'Prepare documents for signing.', icon: 'draw', category: 'security', route: '/pdf/sign-pdf' , available: false },
    { id: 'repair-pdf', name: 'Repair PDF', description: 'Recover and sanitize damaged PDFs.', icon: 'build', category: 'security', route: '/pdf/repair-pdf' , available: false },
    { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove PDF password protection when permitted.', icon: 'key', category: 'security', route: '/pdf/unlock-pdf' , available: false },
    { id: 'pdf-ocr', name: 'PDF OCR & Text', description: 'Extract searchable text from PDF documents.', icon: 'text_snippet', category: 'security', route: '/pdf/pdf-ocr', available: false },
    { id: 'compare-pdf', name: 'Compare PDF', description: 'Compare two document versions and reveal changes.', icon: 'compare', category: 'intelligence', route: '/pdf/compare-pdf', available: false },
    { id: 'ai-summarizer', name: 'AI Summarizer', description: 'Turn long PDFs into useful structured summaries.', icon: 'auto_awesome', category: 'intelligence', route: '/pdf/ai-summarizer', available: false },
    { id: 'translate-pdf', name: 'Translate PDF', description: 'Translate document content while preserving structure.', icon: 'translate', category: 'intelligence', route: '/pdf/translate-pdf', available: false },
    { id: 'pdf-metadata', name: 'PDF Metadata', description: 'Inspect and clean document metadata.', icon: 'info', category: 'security', route: '/pdf/pdf-metadata', available: true },
  ];

  readonly categories: PdfCategory[] = ['organize', 'edit', 'convert', 'security', 'intelligence'];
  readonly categoryLabels: Record<PdfCategory, string> = {
    organize: 'Organize',
    edit: 'Edit & Content',
    convert: 'Convert',
    security: 'Security & Utilities',
    intelligence: 'Document Intelligence',
  };

  constructor() {
    this.route.paramMap.subscribe(params => this.activeTool.set(params.get('tool') || 'organize-pdf'));
  }

  get filteredTools(): PdfTool[] {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.tools;
    return this.tools.filter(tool => `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query));
  }

  toolsFor(category: PdfCategory): PdfTool[] {
    return this.filteredTools.filter(tool => tool.category === category);
  }

  mergeDropListIds(): string[] {
    return this.mergeDocuments().map(document => `merge-pages-${document.id}`);
  }

  mergePageCount(): number {
    return this.mergeDocuments().reduce((total, document) => total + document.pages.length, 0);
  }

  setSplitMode(mode: SplitMode): void {
    this.splitMode.set(mode);
    this.error.set(null);
  }

  onSplitRanges(event: Event): void {
    this.splitRanges.set((event.target as HTMLInputElement).value);
  }

  onSplitChunkSize(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.splitChunkSize.set(Number.isFinite(value) ? Math.max(1, Math.min(100, Math.floor(value))) : 1);
  }

  onFileDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isFileDragActive.set(true);
  }

  onFileDragLeave(event: DragEvent): void {
    event.preventDefault();
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as Node | null;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) this.isFileDragActive.set(false);
  }

  onFileDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isFileDragActive.set(true);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    if (!selected.length) return;

    if (this.activeTool() === 'merge-pdf') {
      await this.addMergeFiles(selected);
    } else if (this.activeTool() === 'image-to-pdf') {
      this.imageFiles.set(selected.filter(file => file.type.startsWith('image/')));
      this.error.set(null);
    } else {
      await this.loadFile(selected[0]);
    }

    input.value = '';
  }

  async addMergeFiles(files: File[]): Promise<void> {
    const pdfs = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (!pdfs.length) return;

    this.error.set(null);
    this.isProcessing.set(true);

    try {
      const additions = await Promise.all(pdfs.map(file => this.createMergeDocument(file)));
      const documents = [...this.mergeDocuments(), ...additions];
      this.mergeDocuments.set(documents);
      this.mergeFiles.set(documents.map(document => document.file));
      this.file.set(documents[0]?.file ?? null);
    } catch {
      this.error.set('One or more PDF files could not be opened.');
    } finally {
      this.isProcessing.set(false);
      this.isMergeDropActive.set(false);
    }
  }

  private async createMergeDocument(file: File): Promise<MergeDocument> {
    const count = await this.pdfEngine.getPageCount(file);
    const thumbnails = await this.renderPdfThumbnails(file, count);
    return {
      id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      pages: Array.from({ length: count }, (_, index) => ({
        id: `${file.name}-page-${index}-${Math.random().toString(36).slice(2, 7)}`,
        sourceIndex: index,
        thumbnail: thumbnails[index],
        rotation: 0,
      })),
    };
  }

  removeMergeFile(index: number): void {
    const documents = this.mergeDocuments().filter((_, documentIndex) => documentIndex !== index);
    this.mergeDocuments.set(documents);
    this.mergeFiles.set(documents.map(document => document.file));
    this.file.set(documents[0]?.file ?? null);
  }

  onMergeDocumentDrop(event: CdkDragDrop<MergeDocument[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const documents = [...this.mergeDocuments()];
    moveItemInArray(documents, event.previousIndex, event.currentIndex);
    this.mergeDocuments.set(documents);
    this.mergeFiles.set(documents.map(document => document.file));
  }

  onMergePageDrop(event: CdkDragDrop<MergePage[]>, targetDocumentId: string): void {
    const documents = this.mergeDocuments().map(document => ({
      ...document,
      pages: [...document.pages],
    }));
    const dragData = event.item.data as { documentId?: string; pageId?: string } | undefined;
    const sourceDocumentId = dragData?.documentId ?? event.previousContainer.id.replace('merge-pages-', '');
    const source = documents.find(document => document.id === sourceDocumentId);
    const target = documents.find(document => document.id === targetDocumentId);
    if (!source || !target) return;

    if (source.id === target.id) {
      moveItemInArray(target.pages, event.previousIndex, event.currentIndex);
    } else {
      const pageIndex = dragData?.pageId
        ? source.pages.findIndex(page => page.id === dragData.pageId)
        : event.previousIndex;
      if (pageIndex < 0) return;
      const [page] = source.pages.splice(pageIndex, 1);
      if (!page) return;
      const insertionIndex = Math.min(event.currentIndex, target.pages.length);
      target.pages.splice(insertionIndex, 0, page);
    }

    this.mergeDocuments.set(documents);
    this.mergeFiles.set(documents.map(document => document.file));
    this.isMergeDropActive.set(false);
  }

  removeMergePage(documentId: string, pageId: string): void {
    const documents = this.mergeDocuments().map(document =>
      document.id === documentId
        ? { ...document, pages: document.pages.filter(page => page.id !== pageId) }
        : document
    );
    this.mergeDocuments.set(documents);
  }

  rotateMergePage(documentId: string, pageId: string): void {
    const documents = this.mergeDocuments().map(document =>
      document.id === documentId
        ? {
            ...document,
            pages: document.pages.map(page =>
              page.id === pageId ? { ...page, rotation: (page.rotation + 90) % 360 } : page
            ),
          }
        : document
    );
    this.mergeDocuments.set(documents);
  }

  async mergeSelectedFiles(): Promise<void> {
    const documents = this.mergeDocuments();
    if (documents.length < 2 || this.mergePageCount() === 0) return;

    this.isProcessing.set(true);
    this.error.set(null);

    try {
      const bytes = await this.pdfEngine.composePages(
        documents.map(document => ({
          file: document.file,
          pages: document.pages.map(page => ({ pageIndex: page.sourceIndex, rotation: page.rotation })),
        }))
      );
      this.pdfEngine.download(bytes, 'x-facture-merged.pdf');
    } catch {
      this.error.set('The composed PDF could not be created.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  triggerUpload(input: HTMLInputElement): void {
    input.click();
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isFileDragActive.set(false);
    this.isMergeDropActive.set(false);
    const dropped = Array.from(event.dataTransfer?.files ?? []);
    if (!dropped.length) return;

    if (this.activeTool() === 'merge-pdf') await this.addMergeFiles(dropped);
    else if (this.activeTool() === 'image-to-pdf') this.imageFiles.set(dropped.filter(file => file.type.startsWith('image/')));
    else await this.loadFile(dropped[0]);
  }

  private async loadFile(selected: File): Promise<void> {
    this.error.set(null);
    this.isProcessing.set(true);
    this.file.set(selected);
    this.mergeFiles.set([]);
    this.mergeDocuments.set([]);
    this.pageCount.set(null);
    this.thumbnails.set([]);
    this.pageOrder.set([]);
    this.selectedPages.set([]);
    this.pageRotations.set({});
    this.draggedPage.set(null);

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

  private async renderPdfThumbnails(file: File, count: number): Promise<string[]> {
    if (typeof window === 'undefined') return [];
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';
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
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/jpeg', 0.82));
        page.cleanup();
      }
    } finally {
      document.cleanup();
    }

    return images;
  }

  private async renderThumbnails(file: File, count: number): Promise<void> {
    this.thumbnails.set(await this.renderPdfThumbnails(file, count));
  }

  togglePage(position: number): void {
    const selected = new Set(this.selectedPages());
    if (selected.has(position)) selected.delete(position);
    else selected.add(position);
    this.selectedPages.set([...selected].sort((a, b) => a - b));
  }

  onPageDrop(event: CdkDragDrop<number[]>): void {
    this.isPageDropActive.set(false);
    if (event.previousIndex === event.currentIndex) return;

    const order = [...this.pageOrder()];
    const thumbnails = [...this.thumbnails()];
    const selectedOriginalPages = this.selectedPages().map(index => order[index]);
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    moveItemInArray(thumbnails, event.previousIndex, event.currentIndex);

    this.pageOrder.set(order);
    this.thumbnails.set(thumbnails);
    this.selectedPages.set(
      selectedOriginalPages.map(original => order.indexOf(original)).filter(index => index >= 0).sort((a, b) => a - b)
    );
  }

  onDragStarted(position: number): void {
    this.draggedPage.set(position);
    this.isPageDropActive.set(true);
  }

  onDragEnded(): void {
    this.draggedPage.set(null);
    this.isPageDropActive.set(false);
  }

  selectAll(): void {
    const count = this.pageCount() ?? 0;
    this.selectedPages.set(Array.from({ length: count }, (_, index) => index));
  }

  deselectAll(): void {
    this.selectedPages.set([]);
  }

  rotatePage(index: number): void {
    this.pageRotations.update(rotations => ({ ...rotations, [index]: ((rotations[index] ?? 0) + 90) % 360 }));
  }

  getPageRotation(index: number): number {
    return this.pageRotations()[index] ?? 0;
  }

  isRotated(index: number): boolean {
    return (this.getPageRotation(index) % 180) !== 0;
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
      const bytes = await this.pdfEngine.extractPages(currentFile, indices, this.pageRotations());
      this.pdfEngine.download(bytes, 'x-facture-extracted.pdf');
    } catch {
      this.error.set('The selected pages could not be extracted.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private parseSplitRanges(): number[] {
    const count = this.pageCount() ?? 0;
    const pages = new Set<number>();
    for (const token of this.splitRanges().split(',').map(value => value.trim()).filter(Boolean)) {
      const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw new Error('Use ranges such as 1-3, 5, 8-10.');
      const start = Number(match[1]);
      const end = Number(match[2] ?? match[1]);
      if (start < 1 || end < start || end > count) throw new Error('A split range is outside the document page count.');
      for (let page = start; page <= end; page += 1) pages.add(page - 1);
    }
    return [...pages].sort((a, b) => a - b).map(position => this.pageOrder()[position]);
  }

  async splitPdf(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;

    this.isProcessing.set(true);
    this.error.set(null);
    try {
      if (this.splitMode() === 'selected') {
        await this.extractSelected();
        return;
      }

      const count = this.pageCount() ?? 0;
      if (this.splitMode() === 'ranges') {
        const indices = this.parseSplitRanges();
        if (!indices.length) throw new Error('Enter at least one page or range.');
        const bytes = await this.pdfEngine.extractPages(currentFile, indices, this.pageRotations());
        this.pdfEngine.download(bytes, 'x-facture-split-selection.pdf');
        return;
      }

      const chunkSize = this.splitChunkSize();
      const ordered = this.pageOrder();
      for (let start = 0, part = 1; start < count; start += chunkSize, part += 1) {
        const indices = ordered.slice(start, start + chunkSize);
        const bytes = await this.pdfEngine.extractPages(currentFile, indices, this.pageRotations());
        this.pdfEngine.download(bytes, `x-facture-part-${String(part).padStart(2, '0')}.pdf`);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The PDF could not be split.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  setWatermarkText(event: Event): void { this.watermarkText.set((event.target as HTMLInputElement).value); }
  setWatermarkOpacity(event: Event): void { this.watermarkOpacity.set(Number((event.target as HTMLInputElement).value)); }
  setWatermarkFontSize(event: Event): void { this.watermarkFontSize.set(Number((event.target as HTMLInputElement).value)); }
  setWatermarkAngle(event: Event): void { this.watermarkAngle.set(Number((event.target as HTMLInputElement).value)); }
  setWatermarkPosition(position: WatermarkPosition): void { this.watermarkPosition.set(position); }

  async watermarkPdf(): Promise<void> {
    const currentFile = this.file();
    const text = this.watermarkText().trim();
    if (!currentFile || !text) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const pageIndices = this.selectedPages().length ? this.selectedPages().map(position => this.pageOrder()[position]) : undefined;
      const bytes = await this.pdfEngine.addWatermark(currentFile, text, {
        opacity: this.watermarkOpacity(),
        fontSize: this.watermarkFontSize(),
        angle: this.watermarkAngle(),
        position: this.watermarkPosition(),
        pageIndices,
      });
      this.pdfEngine.download(bytes, 'x-facture-watermarked.pdf');
    } catch { this.error.set('The watermark could not be added.'); }
    finally { this.isProcessing.set(false); }
  }

  setPageNumberStart(event: Event): void { this.pageNumberStart.set(Math.max(1, Math.floor(Number((event.target as HTMLInputElement).value) || 1))); }
  setPageNumberFontSize(event: Event): void { this.pageNumberFontSize.set(Math.max(6, Math.min(36, Math.floor(Number((event.target as HTMLInputElement).value) || 10)))); }
  setPageNumberPosition(position: PageNumberPosition): void { this.pageNumberPosition.set(position); }

  async numberPages(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const bytes = await this.pdfEngine.addPageNumbers(currentFile, {
        start: this.pageNumberStart(),
        position: this.pageNumberPosition(),
        fontSize: this.pageNumberFontSize(),
      });
      this.pdfEngine.download(bytes, 'x-facture-numbered.pdf');
    } catch { this.error.set('Page numbers could not be added.'); }
    finally { this.isProcessing.set(false); }
  }

  setCropMargin(margin: number): void { this.cropMargin.set(margin); }

  async cropPdf(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const pageIndices = this.selectedPages().length ? this.selectedPages().map(position => this.pageOrder()[position]) : undefined;
      const bytes = await this.pdfEngine.cropPages(currentFile, { margin: this.cropMargin(), pageIndices });
      this.pdfEngine.download(bytes, 'x-facture-cropped.pdf');
    } catch { this.error.set('The PDF pages could not be cropped.'); }
    finally { this.isProcessing.set(false); }
  }

  setEditText(event: Event): void { this.editText.set((event.target as HTMLInputElement).value); }
  setEditTextFontSize(event: Event): void { this.editTextFontSize.set(Math.max(6, Math.min(72, Math.floor(Number((event.target as HTMLInputElement).value) || 18)))); }
  setEditTextPosition(position: 'top-left' | 'center' | 'bottom-left'): void { this.editTextPosition.set(position); }

  async addTextToPdf(): Promise<void> {
    const currentFile = this.file();
    const text = this.editText().trim();
    if (!currentFile || !text) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const pageIndices = this.selectedPages().length ? this.selectedPages().map(position => this.pageOrder()[position]) : undefined;
      const firstPage = (await this.pdfEngine.getPageCount(currentFile)) > 0 ? 0 : 0;
      const positions = {
        'top-left': { x: 24, y: 760 },
        center: { x: 220, y: 400 },
        'bottom-left': { x: 24, y: 24 },
      } as const;
      const position = positions[this.editTextPosition()];
      const bytes = await this.pdfEngine.addText(currentFile, text, {
        fontSize: this.editTextFontSize(),
        x: position.x,
        y: position.y,
        pageIndices,
      });
      void firstPage;
      this.pdfEngine.download(bytes, 'x-facture-edited.pdf');
    } catch { this.error.set('The text could not be added to the PDF.'); }
    finally { this.isProcessing.set(false); }
  }

  setRotateAngle(angle: number): void {
    this.rotateAngle.set(angle);
  }

  setRotateScope(scope: 'all' | 'selected'): void {
    this.rotateScope.set(scope);
  }

  async rotatePdf(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const order = this.pageOrder();
      const selected = new Set(this.selectedPages().map(position => order[position]));
      const rotations = Object.fromEntries(
        order.map(index => {
          const current = this.pageRotations()[index] ?? 0;
          const shouldRotate = this.rotateScope() === 'all' || selected.has(index);
          return [index, shouldRotate ? (current + this.rotateAngle()) % 360 : current];
        })
      );
      const bytes = await this.pdfEngine.reorderPages(currentFile, order, rotations);
      this.pdfEngine.download(bytes, 'x-facture-rotated.pdf');
    } catch {
      this.error.set('The PDF could not be rotated.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async flattenPdf(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const bytes = await this.pdfEngine.flatten(currentFile);
      this.pdfEngine.download(bytes, 'x-facture-flattened.pdf');
    } catch {
      this.error.set('This PDF could not be flattened.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async loadMetadata(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;
    this.isProcessing.set(true);
    try {
      this.metadata.set(await this.pdfEngine.getMetadata(currentFile));
    } catch {
      this.error.set('The PDF metadata could not be read.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  onMetadataField(field: 'title' | 'author' | 'subject' | 'keywords', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.metadata.update(current => ({ ...current, [field]: value }));
  }

  async saveMetadata(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const bytes = await this.pdfEngine.updateMetadata(currentFile, this.metadata());
      this.pdfEngine.download(bytes, 'x-facture-metadata.pdf');
    } catch {
      this.error.set('The PDF metadata could not be updated.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  setImagePageSize(size: 'a4' | 'letter' | 'fit'): void {
    this.imagePageSize.set(size);
  }

  async createPdfFromImages(): Promise<void> {
    const files = this.imageFiles();
    if (!files.length) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const bytes = await this.pdfEngine.imagesToPdf(files, this.imagePageSize());
      this.pdfEngine.download(bytes, 'x-facture-images.pdf');
    } catch {
      this.error.set('The selected images could not be converted to PDF.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  setPdfToImageScale(scale: number): void {
    this.pdfToImageScale.set(scale);
  }

  async exportPdfToImages(): Promise<void> {
    const currentFile = this.file();
    if (!currentFile || typeof window === 'undefined') return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';
      const document = await pdfjs.getDocument({ data: new Uint8Array(await currentFile.arrayBuffer()) }).promise;
      const indices = this.selectedPages().length
        ? this.selectedPages().map(position => this.pageOrder()[position])
        : Array.from({ length: document.numPages }, (_, index) => index);

      for (const index of indices) {
        const page = await document.getPage(index + 1);
        const viewport = page.getViewport({ scale: this.pdfToImageScale() });
        const canvas = window.document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) continue;
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement('a');
          anchor.href = url;
          anchor.download = `x-facture-page-${String(index + 1).padStart(2, '0')}.png`;
          anchor.click();
          setTimeout(() => URL.revokeObjectURL(url), 3000);
        }
        page.cleanup();
      }
      document.cleanup();
    } catch {
      this.error.set('The PDF pages could not be exported as images.');
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
      const bytes = await this.pdfEngine.reorderPages(currentFile, this.pageOrder(), this.pageRotations());
      this.pdfEngine.download(bytes, 'x-facture-organized.pdf');
    } catch {
      this.error.set('The organized PDF could not be created.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async removeSelectedPages(): Promise<void> {
    const currentFile = this.file();
    const positions = this.selectedPages();
    if (!currentFile || !positions.length || positions.length >= (this.pageCount() ?? 0)) return;
    this.isProcessing.set(true);
    this.error.set(null);
    try {
      const deleted = new Set(positions);
      const remaining = this.pageOrder().filter((_, position) => !deleted.has(position));
      const bytes = await this.pdfEngine.reorderPages(currentFile, remaining, this.pageRotations());
      this.pdfEngine.download(bytes, 'x-facture-pages-removed.pdf');
    } catch {
      this.error.set('The selected pages could not be removed.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  canDeleteSelected(): boolean {
    const count = this.pageCount();
    const selected = this.selectedPages().length;
    return selected > 0 && count !== null && selected < count;
  }

  deleteSelected(): void {
    const positions = this.selectedPages();
    if (!positions.length || positions.length >= (this.pageCount() ?? 0)) return;
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
    this.pageOrder.set([]);
    this.selectedPages.set([]);
    this.mergeFiles.set([]);
    this.mergeDocuments.set([]);
    this.imageFiles.set([]);
    this.draggedPage.set(null);
    this.isFileDragActive.set(false);
    this.isMergeDropActive.set(false);
    this.isPageDropActive.set(false);
  }

  pageNumber(document: MergeDocument, index: number): string {
    return `Page ${index + 1}`;
  }
}
