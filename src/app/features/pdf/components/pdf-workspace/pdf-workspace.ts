import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type PdfWorkspaceMode = 'split' | 'merge' | 'organize' | 'extract' | 'delete' | 'rotate' | 'compress' | 'image-to-pdf' | 'pdf-to-image';

interface WorkspaceFile { id: string; file: File; url: string; }
interface WorkspacePage { number: number; selected: boolean; rotation: number; }

@Component({
  selector: 'app-pdf-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-workspace.html',
  styleUrl: './pdf-workspace.css'
})
export class PdfWorkspaceComponent implements OnDestroy {
  readonly mode = signal<PdfWorkspaceMode>('split');

  @Input() set workspaceMode(value: string) { this.setMode(value); }
  readonly files = signal<WorkspaceFile[]>([]);
  readonly pages = signal<WorkspacePage[]>([]);
  readonly activeFileId = signal<string | null>(null);
  readonly isDragging = signal(false);
  readonly isProcessing = signal(false);
  readonly splitMode = signal<'all' | 'selected' | 'range'>('all');
  readonly rangeStart = signal(1);
  readonly rangeEnd = signal(1);
  private nextId = 0;

  setMode(value: string): void {
    const modes: PdfWorkspaceMode[] = ['split','merge','organize','extract','delete','rotate','compress','image-to-pdf','pdf-to-image'];
    if (modes.includes(value as PdfWorkspaceMode)) this.mode.set(value as PdfWorkspaceMode);
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) await this.addFiles(Array.from(input.files));
    input.value = '';
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files.length) await this.addFiles(Array.from(event.dataTransfer.files));
  }

  allowDrop(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  leaveDrop(): void { this.isDragging.set(false); }

  private async addFiles(incoming: File[]): Promise<void> {
    const accepted = incoming.filter(file => file.type === 'application/pdf' || file.type.startsWith('image/'));
    const added = accepted.map(file => ({ id: `pdf-${++this.nextId}`, file, url: URL.createObjectURL(file) }));
    if (!added.length) return;
    this.files.set([...this.files(), ...added]);
    if (!this.activeFileId()) {
      this.activeFileId.set(added[0].id);
      this.pages.set([{ number: 1, selected: true, rotation: 0 }]);
    }
  }

  removeFile(id: string): void {
    const target = this.files().find(file => file.id === id);
    if (target) URL.revokeObjectURL(target.url);
    const remaining = this.files().filter(file => file.id !== id);
    this.files.set(remaining);
    if (this.activeFileId() === id) {
      this.activeFileId.set(remaining[0]?.id ?? null);
      this.pages.set(remaining[0] ? [{ number: 1, selected: true, rotation: 0 }] : []);
    }
  }

  selectFile(id: string): void {
    this.activeFileId.set(id);
    this.pages.set([{ number: 1, selected: true, rotation: 0 }]);
  }

  togglePage(number: number): void {
    this.pages.update(items => items.map(page => page.number === number ? { ...page, selected: !page.selected } : page));
  }

  selectAllPages(): void { this.pages.update(items => items.map(page => ({ ...page, selected: true }))); }
  clearPageSelection(): void { this.pages.update(items => items.map(page => ({ ...page, selected: false }))); }

  rotatePage(number: number): void {
    this.pages.update(items => items.map(page => page.number === number ? { ...page, rotation: (page.rotation + 90) % 360 } : page));
  }

  deleteSelectedPages(): void {
    this.pages.set(this.pages().filter(page => !page.selected).map((page, index) => ({ ...page, number: index + 1, selected: false })));
  }

  get activeFile(): WorkspaceFile | undefined { return this.files().find(file => file.id === this.activeFileId()); }
  get selectedCount(): number { return this.pages().filter(page => page.selected).length; }

  get title(): string {
    const labels: Record<PdfWorkspaceMode, string> = {
      split:'Split PDF', merge:'Merge PDF', organize:'Organize PDF', extract:'Extract PDF pages',
      delete:'Delete PDF pages', rotate:'Rotate PDF', compress:'Compress PDF',
      'image-to-pdf':'Image to PDF', 'pdf-to-image':'PDF to Image'
    };
    return labels[this.mode()];
  }

  get description(): string {
    const labels: Record<PdfWorkspaceMode, string> = {
      split:'Select pages, ranges, or sections and prepare separate PDF files.',
      merge:'Add documents, arrange them in the order you want, then combine them.',
      organize:'Reorder, rotate, duplicate, delete, and select pages from one workspace.',
      extract:'Choose the pages you want to keep and create a new document.',
      delete:'Select pages to remove from the document.', rotate:'Select pages and rotate them without leaving the workspace.',
      compress:'Prepare a smaller version of your PDF.', 'image-to-pdf':'Add images and arrange them before creating a PDF.',
      'pdf-to-image':'Open a PDF and prepare its pages for image export.'
    };
    return labels[this.mode()];
  }

  async execute(): Promise<void> {
    if (!this.files().length) return;
    this.isProcessing.set(true);
    await new Promise(resolve => setTimeout(resolve, 350));
    this.isProcessing.set(false);
  }

  ngOnDestroy(): void { for (const file of this.files()) URL.revokeObjectURL(file.url); }
}
