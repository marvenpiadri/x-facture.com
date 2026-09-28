import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PdfEngineService } from '../../../../core/services/pdf-engine.service';

type PdfCategory = 'organize' | 'edit' | 'convert' | 'security';
type SplitMode = 'selected' | 'ranges' | 'every-page';

interface PdfTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PdfCategory;
  route: string;
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
  readonly draggedPage = signal<number | null>(null);
  readonly zoom = signal(0.72);
  readonly Math = Math;

  readonly tools: PdfTool[] = [
    { id: 'organize-pdf', name: 'Organize Pages', description: 'Reorder, rotate and remove pages.', icon: 'view_carousel', category: 'organize', route: '/pdf/organize-pdf' },
    { id: 'merge-pdf', name: 'Merge PDF', description: 'Compose several PDFs at document and page level.', icon: 'merge_type', category: 'organize', route: '/pdf/merge-pdf' },
    { id: 'split-pdf', name: 'Split PDF', description: 'Extract pages, ranges or evenly sized parts.', icon: 'content_cut', category: 'organize', route: '/pdf/split-pdf' },
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
    const sourceDocumentId = event.previousContainer.id.replace('merge-pages-', '');
    const source = documents.find(document => document.id === sourceDocumentId);
    const target = documents.find(document => document.id === targetDocumentId);
    if (!source || !target) return;

    if (source.id === target.id) {
      moveItemInArray(target.pages, event.previousIndex, event.currentIndex);
    } else {
      const [page] = source.pages.splice(event.previousIndex, 1);
      if (!page) return;
      target.pages.splice(event.currentIndex, 0, page);
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
      const bytes = await this.pdfEngine.extractPages(currentFile, indices);
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
    return [...pages].sort((a, b) => a - b);
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
        const bytes = await this.pdfEngine.extractPages(currentFile, indices);
        this.pdfEngine.download(bytes, 'x-facture-split-selection.pdf');
        return;
      }

      const chunkSize = this.splitChunkSize();
      const ordered = this.pageOrder();
      for (let start = 0, part = 1; start < count; start += chunkSize, part += 1) {
        const indices = ordered.slice(start, start + chunkSize);
        const bytes = await this.pdfEngine.extractPages(currentFile, indices);
        this.pdfEngine.download(bytes, `x-facture-part-${String(part).padStart(2, '0')}.pdf`);
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'The PDF could not be split.');
    } finally {
      this.isProcessing.set(false);
    }
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
      const indices = this.selectedPages().map(position => this.pageOrder()[position]);
      const bytes = this.rotateScope() === 'selected' && indices.length
        ? await this.pdfEngine.rotateSelectedPages(currentFile, indices, this.rotateAngle())
        : await this.pdfEngine.rotatePages(currentFile, this.rotateAngle());
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
    this.draggedPage.set(null);
    this.isFileDragActive.set(false);
    this.isMergeDropActive.set(false);
    this.isPageDropActive.set(false);
  }

  pageNumber(document: MergeDocument, index: number): string {
    return `Page ${index + 1}`;
  }
}
