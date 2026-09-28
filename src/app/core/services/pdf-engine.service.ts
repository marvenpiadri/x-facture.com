import { Injectable } from '@angular/core';
import { degrees, PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface PdfPageSelection { pageIndex: number; }
export interface PdfMergeInput { file: File; rotation?: number; }
export interface PdfComposePage { pageIndex: number; rotation?: number; }
export interface PdfComposeInput { file: File; pages: PdfComposePage[]; }

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export type ImagePdfPageSize = 'a4' | 'letter' | 'fit';

@Injectable({ providedIn: 'root' })
export class PdfEngineService {
  async read(file: File): Promise<ArrayBuffer> { return file.arrayBuffer(); }

  async load(file: File): Promise<PDFDocument> {
    return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  }

  async getPageCount(file: File): Promise<number> {
    const pdf = await this.load(file);
    return pdf.getPageCount();
  }

  async merge(files: PdfMergeInput[]): Promise<Uint8Array> {
    return this.composePages(files.map(item => ({ file: item.file, pages: [] })));
  }

  async composePages(inputs: PdfComposeInput[]): Promise<Uint8Array> {
    const output = await PDFDocument.create();
    for (const input of inputs) {
      const source = await this.load(input.file);
      const indices = input.pages.length
        ? input.pages.map(page => page.pageIndex).filter(index => index >= 0 && index < source.getPageCount())
        : source.getPageIndices();
      const pages = await output.copyPages(source, indices);
      pages.forEach((page, position) => {
        const rotation = input.pages[position]?.rotation ?? 0;
        if (rotation) page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
        output.addPage(page);
      });
    }
    return output.save();
  }

  async extractPages(file: File, pageIndices: number[], rotations: Record<number, number> = {}): Promise<Uint8Array> {
    const source = await this.load(file);
    const output = await PDFDocument.create();
    const validIndices = pageIndices.filter(index => index >= 0 && index < source.getPageCount());
    const pages = await output.copyPages(source, validIndices);
    pages.forEach((page, position) => {
      const sourceIndex = validIndices[position];
      const rotation = rotations[sourceIndex] ?? 0;
      if (rotation) page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      output.addPage(page);
    });
    return output.save();
  }

  async reorderPages(file: File, orderedIndices: number[], rotations: Record<number, number> = {}): Promise<Uint8Array> {
    const source = await this.load(file);
    const output = await PDFDocument.create();
    const validIndices = orderedIndices.filter(index => index >= 0 && index < source.getPageCount());
    const pages = await output.copyPages(source, validIndices);
    pages.forEach((page, position) => {
      const rotation = rotations[validIndices[position]] ?? 0;
      if (rotation) page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      output.addPage(page);
    });
    return output.save();
  }

  async rotatePages(file: File, angle: number): Promise<Uint8Array> {
    const pdf = await this.load(file);
    pdf.getPages().forEach(page => page.setRotation(degrees((page.getRotation().angle + angle) % 360)));
    return pdf.save();
  }

  async rotateSelectedPages(file: File, pageIndices: number[], angle: number): Promise<Uint8Array> {
    const source = await this.load(file);
    const selected = new Set(pageIndices);
    const output = await PDFDocument.create();
    const indices = source.getPageIndices();
    const pages = await output.copyPages(source, indices);
    pages.forEach((page, index) => {
      if (selected.has(index)) page.setRotation(degrees((page.getRotation().angle + angle) % 360));
      output.addPage(page);
    });
    return output.save();
  }


  async addWatermark(
    file: File,
    text: string,
    options: { opacity: number; fontSize: number; angle: number; position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; pageIndices?: number[] } = {
      opacity: 0.25,
      fontSize: 42,
      angle: 45,
      position: 'center',
    }
  ): Promise<Uint8Array> {
    const pdf = await this.load(file);
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const selected = options.pageIndices ? new Set(options.pageIndices) : null;

    pdf.getPages().forEach((page, index) => {
      if (selected && !selected.has(index)) return;
      const width = page.getWidth();
      const height = page.getHeight();
      const textWidth = font.widthOfTextAtSize(text, options.fontSize);
      const margin = 24;
      let x = (width - textWidth) / 2;
      let y = (height - options.fontSize) / 2;

      if (options.position === 'top-left') { x = margin; y = height - options.fontSize - margin; }
      if (options.position === 'top-right') { x = width - textWidth - margin; y = height - options.fontSize - margin; }
      if (options.position === 'bottom-left') { x = margin; y = margin; }
      if (options.position === 'bottom-right') { x = width - textWidth - margin; y = margin; }

      page.drawText(text, {
        x,
        y,
        size: options.fontSize,
        font,
        color: rgb(0.35, 0.35, 0.35),
        opacity: Math.min(1, Math.max(0.05, options.opacity)),
        rotate: degrees(options.angle),
      });
    });

    return pdf.save();
  }

  async addPageNumbers(
    file: File,
    options: { start: number; position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'; fontSize: number } = {
      start: 1,
      position: 'bottom-center',
      fontSize: 10,
    }
  ): Promise<Uint8Array> {
    const pdf = await this.load(file);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();

    pages.forEach((page, index) => {
      const label = String(options.start + index);
      const width = page.getWidth();
      const height = page.getHeight();
      const textWidth = font.widthOfTextAtSize(label, options.fontSize);
      const margin = 24;
      let x = (width - textWidth) / 2;
      let y = margin;

      if (options.position === 'top-left') { x = margin; y = height - options.fontSize - margin; }
      if (options.position === 'top-center') { x = (width - textWidth) / 2; y = height - options.fontSize - margin; }
      if (options.position === 'top-right') { x = width - textWidth - margin; y = height - options.fontSize - margin; }
      if (options.position === 'bottom-left') { x = margin; y = margin; }
      if (options.position === 'bottom-right') { x = width - textWidth - margin; y = margin; }

      page.drawText(label, { x, y, size: options.fontSize, font, color: rgb(0.25, 0.25, 0.25) });
    });

    return pdf.save();
  }

  async cropPages(
    file: File,
    options: { margin: number; pageIndices?: number[] }
  ): Promise<Uint8Array> {
    const pdf = await this.load(file);
    const selected = options.pageIndices ? new Set(options.pageIndices) : null;

    pdf.getPages().forEach((page, index) => {
      if (selected && !selected.has(index)) return;
      const width = page.getWidth();
      const height = page.getHeight();
      const margin = Math.max(0, Math.min(options.margin, Math.min(width, height) / 2 - 1));
      page.setCropBox(margin, margin, width - margin * 2, height - margin * 2);
    });

    return pdf.save();
  }

  async addText(
    file: File,
    text: string,
    options: { fontSize: number; x: number; y: number; pageIndices?: number[] }
  ): Promise<Uint8Array> {
    const pdf = await this.load(file);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const selected = options.pageIndices ? new Set(options.pageIndices) : null;

    pdf.getPages().forEach((page, index) => {
      if (selected && !selected.has(index)) return;
      page.drawText(text, {
        x: options.x,
        y: options.y,
        size: options.fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    });

    return pdf.save();
  }

  async flatten(file: File): Promise<Uint8Array> {
    const pdf = await this.load(file);
    pdf.getForm().flatten();
    return pdf.save();
  }

  async getMetadata(file: File): Promise<PdfMetadata> {
    const pdf = await this.load(file);
    return {
      title: pdf.getTitle() ?? '',
      author: pdf.getAuthor() ?? '',
      subject: pdf.getSubject() ?? '',
      keywords: pdf.getKeywords() ?? '',
      creator: pdf.getCreator() ?? '',
      producer: pdf.getProducer() ?? '',
    };
  }

  async updateMetadata(file: File, metadata: Partial<PdfMetadata>): Promise<Uint8Array> {
    const pdf = await this.load(file);
    if (metadata.title !== undefined) pdf.setTitle(metadata.title);
    if (metadata.author !== undefined) pdf.setAuthor(metadata.author);
    if (metadata.subject !== undefined) pdf.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) pdf.setKeywords(metadata.keywords.split(',').map(value => value.trim()).filter(Boolean));
    if (metadata.creator !== undefined) pdf.setCreator(metadata.creator);
    if (metadata.producer !== undefined) pdf.setProducer(metadata.producer);
    return pdf.save();
  }

  async imagesToPdf(files: File[], pageSize: ImagePdfPageSize = 'a4'): Promise<Uint8Array> {
    const output = await PDFDocument.create();
    const sizes = {
      a4: [595.28, 841.89],
      letter: [612, 792],
    } as const;

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      const image = isPng ? await output.embedPng(bytes) : await output.embedJpg(bytes);
      const imageWidth = image.width;
      const imageHeight = image.height;
      let width: number;
      let height: number;

      if (pageSize === 'fit') {
        width = imageWidth;
        height = imageHeight;
      } else {
        const [portraitWidth, portraitHeight] = sizes[pageSize];
        const landscape = imageWidth > imageHeight;
        width = landscape ? portraitHeight : portraitWidth;
        height = landscape ? portraitWidth : portraitHeight;
      }

      const page = output.addPage([width, height]);
      const margin = pageSize === 'fit' ? 0 : 24;
      const maxWidth = Math.max(1, width - margin * 2);
      const maxHeight = Math.max(1, height - margin * 2);
      const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);
      const drawWidth = imageWidth * scale;
      const drawHeight = imageHeight * scale;

      page.drawImage(image, {
        x: (width - drawWidth) / 2,
        y: (height - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });
    }

    return output.save();
  }

  download(bytes: Uint8Array, fileName: string): void {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
}
