import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { PDFDocument, degrees } from 'pdf-lib';

type PdfWorkspaceMode = 'split' | 'merge' | 'organize' | 'extract' | 'delete' | 'rotate' | 'compress' | 'image-to-pdf' | 'pdf-to-image';
interface WorkspaceFile { id: string; file: File; url: string; pageCount: number; }
interface WorkspacePage { id: string; sourceFileId: string; sourcePageIndex: number; number: number; selected: boolean; rotation: number; }

@Component({ selector: 'app-pdf-workspace', standalone: true, imports: [CommonModule, FormsModule, DragDropModule], templateUrl: './pdf-workspace.html', styleUrl: './pdf-workspace.css' })
export class PdfWorkspaceComponent implements OnDestroy {
  readonly mode = signal<PdfWorkspaceMode>('split');
  readonly files = signal<WorkspaceFile[]>([]);
  readonly pages = signal<WorkspacePage[]>([]);
  readonly activeFileId = signal<string | null>(null);
  readonly isDragging = signal(false);
  readonly isProcessing = signal(false);
  readonly splitMode = signal<'all' | 'selected' | 'range'>('all');
  readonly rangeStart = signal(1);
  readonly rangeEnd = signal(1);
  readonly errorMessage = signal('');
  private nextId = 0;

  @Input() set workspaceMode(value: string) {
    const modes: PdfWorkspaceMode[] = ['split','merge','organize','extract','delete','rotate','compress','image-to-pdf','pdf-to-image'];
    if (modes.includes(value as PdfWorkspaceMode)) this.mode.set(value as PdfWorkspaceMode);
  }

  async onFilesSelected(event: Event): Promise<void> { const input = event.target as HTMLInputElement; if (input.files?.length) await this.addFiles(Array.from(input.files)); input.value = ''; }
  async onDrop(event: DragEvent): Promise<void> { event.preventDefault(); this.isDragging.set(false); if (event.dataTransfer?.files.length) await this.addFiles(Array.from(event.dataTransfer.files)); }
  allowDrop(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  leaveDrop(): void { this.isDragging.set(false); }

  private async addFiles(incoming: File[]): Promise<void> {
    this.errorMessage.set('');
    const accepted = incoming.filter(file => file.type === 'application/pdf' || file.type.startsWith('image/'));
    const added: WorkspaceFile[] = [];
    for (const file of accepted) {
      try { const pageCount = file.type === 'application/pdf' ? await this.detectPdfPageCount(file) : 1; added.push({ id: 'pdf-' + (++this.nextId), file, url: URL.createObjectURL(file), pageCount }); }
      catch { this.errorMessage.set('Could not open ' + file.name + '.'); }
    }
    if (!added.length) return;
    this.files.set([...this.files(), ...added]);
    if (!this.activeFileId()) this.selectFile(added[0].id);
  }

  private async detectPdfPageCount(file: File): Promise<number> { const document = await PDFDocument.load(await file.arrayBuffer()); return document.getPageCount(); }

  removeFile(id: string): void {
    const target = this.files().find(file => file.id === id); if (target) URL.revokeObjectURL(target.url);
    const remaining = this.files().filter(file => file.id !== id); this.files.set(remaining);
    if (this.activeFileId() === id) { this.activeFileId.set(remaining[0]?.id ?? null); this.pages.set(remaining[0] ? this.buildPages(remaining[0]) : []); }
  }
  selectFile(id: string): void { const file = this.files().find(item => item.id === id); this.activeFileId.set(id); this.pages.set(file ? this.buildPages(file) : []); this.rangeStart.set(1); this.rangeEnd.set(file?.pageCount ?? 1); }
  private buildPages(file: WorkspaceFile): WorkspacePage[] { return Array.from({length: file.pageCount}, (_, index) => ({ id: file.id + '-page-' + index, sourceFileId: file.id, sourcePageIndex: index, number: index + 1, selected: true, rotation: 0 })); }
  togglePage(number: number): void { this.pages.update(items => items.map(page => page.number === number ? {...page, selected: !page.selected} : page)); }
  selectAllPages(): void { this.pages.update(items => items.map(page => ({...page, selected: true}))); }
  clearPageSelection(): void { this.pages.update(items => items.map(page => ({...page, selected: false}))); }
  dropPage(event: CdkDragDrop<WorkspacePage[]>): void {
    const items = [...this.pages()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.pages.set(items.map((page, index) => ({ ...page, number: index + 1 })));
  }

  rotatePage(number: number): void { this.pages.update(items => items.map(page => page.number === number ? {...page, rotation: (page.rotation + 90) % 360} : page)); }
  get activeFile(): WorkspaceFile | undefined { return this.files().find(file => file.id === this.activeFileId()); }
  get selectedCount(): number { return this.pages().filter(page => page.selected).length; }
  get title(): string { return ({split:'Split PDF',merge:'Merge PDF',organize:'Organize PDF',extract:'Extract PDF pages',delete:'Delete PDF pages',rotate:'Rotate PDF',compress:'Compress PDF','image-to-pdf':'Image to PDF','pdf-to-image':'PDF to Image'} as Record<PdfWorkspaceMode,string>)[this.mode()]; }
  get description(): string { return ({split:'Select pages, ranges, or sections and prepare separate PDF files.',merge:'Add documents, arrange them in the order you want, then combine them.',organize:'Reorder, rotate, duplicate, delete, and select pages from one workspace.',extract:'Choose the pages you want to keep and create a new document.',delete:'Select pages to remove from the document.',rotate:'Select pages and rotate them without leaving the workspace.',compress:'Prepare a smaller version of your PDF.','image-to-pdf':'Add images and arrange them before creating a PDF.','pdf-to-image':'Open a PDF and prepare its pages for image export.'} as Record<PdfWorkspaceMode,string>)[this.mode()]; }
  previewUrl(pageNumber: number): string | null { const file = this.activeFile; const page = this.pages().find(item => item.number === pageNumber); return file && page ? file.url + '#page=' + (page.sourcePageIndex + 1) + '&view=FitH' : null; }

  async execute(): Promise<void> {
    if (!this.files().length || this.isProcessing()) return;
    this.errorMessage.set(''); this.isProcessing.set(true);
    try { switch (this.mode()) {
      case 'split': await this.executeSplit(); break;
      case 'merge': await this.executeMerge(); break;
      case 'extract': await this.executeSelectedPages('Extracted pages'); break;
      case 'delete': await this.executeDelete(); break;
      case 'organize': case 'rotate': await this.executeCurrentDocument(this.mode() === 'rotate' ? 'Rotated PDF' : 'Organized PDF'); break;
      case 'image-to-pdf': await this.executeImageToPdf(); break;
      case 'compress': this.errorMessage.set('Compression will be connected to the shared PDF processing API.'); break;
      case 'pdf-to-image': this.errorMessage.set('PDF to image export will be added with the page renderer.'); break;
    }} catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Could not process this document.'); } finally { this.isProcessing.set(false); }
  }
  private async executeSplit(): Promise<void> {
    const file = this.activeFile; if (!file || file.file.type !== 'application/pdf') return;
    if (this.splitMode() === 'range') { const start = Math.max(1, Math.min(this.rangeStart(), file.pageCount)); const end = Math.max(start, Math.min(this.rangeEnd(), file.pageCount)); await this.createPdfFromPageIndices(file, Array.from({length:end-start+1},(_,i)=>start-1+i), file.file.name.replace(/\.pdf$/i,'') + '-pages-' + start + '-' + end + '.pdf'); return; }
    const selected = this.splitMode() === 'all' ? this.pages().map(page => page.sourcePageIndex) : this.pages().filter(page => page.selected).map(page => page.sourcePageIndex);
    if (!selected.length) throw new Error('Select at least one page.');
    for (const index of selected) await this.createPdfFromPageIndices(file, [index], file.file.name.replace(/\.pdf$/i,'') + '-page-' + (index + 1) + '.pdf');
  }
  private async executeSelectedPages(label: string): Promise<void> { const file=this.activeFile; const selected=this.pages().filter(page=>page.selected).map(page=>page.sourcePageIndex); if(!file||!selected.length) throw new Error('Select at least one page.'); await this.createPdfFromPageIndices(file,selected,file.file.name.replace(/\.pdf$/i,'')+'-'+label.toLowerCase().replace(/\s+/g,'-')+'.pdf'); }
  private async executeDelete(): Promise<void> { const file=this.activeFile; if(!file) return; const kept=this.pages().filter(page=>!page.selected).map(page=>page.sourcePageIndex); if(!kept.length) throw new Error('At least one page must remain.'); await this.createPdfFromPageIndices(file,kept,file.file.name.replace(/\.pdf$/i,'')+'-without-selected-pages.pdf'); }
  private async executeCurrentDocument(label: string): Promise<void> { const file=this.activeFile; if(!file) return; const source=await PDFDocument.load(await file.file.arrayBuffer()); const output=await PDFDocument.create(); const copied=await output.copyPages(source,this.pages().map(page=>page.sourcePageIndex)); copied.forEach((page,index)=>{const rotation=this.pages()[index]?.rotation??0;if(rotation)page.setRotation(degrees(rotation));output.addPage(page);}); await this.downloadPdf(await output.save(),file.file.name.replace(/\.pdf$/i,'')+'-'+label.toLowerCase().replace(/\s+/g,'-')+'.pdf'); }
  private async createPdfFromPageIndices(file: WorkspaceFile, indices: number[], filename: string): Promise<void> { const source=await PDFDocument.load(await file.file.arrayBuffer()); const output=await PDFDocument.create(); const copied=await output.copyPages(source,indices); copied.forEach((page,index)=>{const workspacePage=this.pages().find(item=>item.sourcePageIndex===indices[index]);if(workspacePage?.rotation)page.setRotation(degrees(workspacePage.rotation));output.addPage(page);}); await this.downloadPdf(await output.save(),filename); }
  private async executeMerge(): Promise<void> { const pdfFiles=this.files().filter(file=>file.file.type==='application/pdf'); if(!pdfFiles.length) throw new Error('Add at least one PDF file.'); const output=await PDFDocument.create(); for(const file of pdfFiles){const source=await PDFDocument.load(await file.file.arrayBuffer()); const copied=await output.copyPages(source,source.getPageIndices()); copied.forEach(page=>output.addPage(page));} await this.downloadPdf(await output.save(),'merged-document.pdf'); }
  private async executeImageToPdf(): Promise<void> { const images=this.files().filter(file=>file.file.type.startsWith('image/')); if(!images.length) throw new Error('Add at least one image.'); const output=await PDFDocument.create(); for(const image of images){const bytes=await image.file.arrayBuffer(); const embedded=image.file.type==='image/png'?await output.embedPng(bytes):await output.embedJpg(bytes); const page=output.addPage([embedded.width,embedded.height]); page.drawImage(embedded,{x:0,y:0,width:embedded.width,height:embedded.height});} await this.downloadPdf(await output.save(),'images.pdf'); }
  private async downloadPdf(bytes: Uint8Array, filename: string): Promise<void> { const blob=new Blob([bytes],{type:'application/pdf'}); const url=URL.createObjectURL(blob); const anchor=document.createElement('a'); anchor.href=url; anchor.download=filename; anchor.click(); URL.revokeObjectURL(url); }
  ngOnDestroy(): void { for(const file of this.files()) URL.revokeObjectURL(file.url); }
}
