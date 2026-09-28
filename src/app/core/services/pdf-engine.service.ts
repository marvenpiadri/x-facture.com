import { Injectable } from '@angular/core';
import { degrees, PDFDocument } from 'pdf-lib';

export interface PdfPageSelection {
  pageIndex: number;
}

export interface PdfMergeInput {
  file: File;
  rotation?: number;
}

export interface PdfComposePage {
  pageIndex: number;
  rotation?: number;
}

export interface PdfComposeInput {
  file: File;
  pages: PdfComposePage[];
}

@Injectable({ providedIn: 'root' })
export class PdfEngineService {
  async read(file: File): Promise<ArrayBuffer> {
    return file.arrayBuffer();
  }

  async load(file: File): Promise<PDFDocument> {
    return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  }

  async getPageCount(file: File): Promise<number> {
    const pdf = await this.load(file);
    return pdf.getPageCount();
  }

  async merge(files: PdfMergeInput[]): Promise<Uint8Array> {
    return this.composePages(
      files.map(item => ({
        file: item.file,
        pages: [],
      })),
    );
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
        if (rotation) {
          page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
        }
        output.addPage(page);
      });
    }

    return output.save();
  }

  async extractPages(file: File, pageIndices: number[]): Promise<Uint8Array> {
    const source = await this.load(file);
    const output = await PDFDocument.create();
    const validIndices = pageIndices.filter(index => index >= 0 && index < source.getPageCount());
    const pages = await output.copyPages(source, validIndices);
    pages.forEach(page => output.addPage(page));
    return output.save();
  }

  async reorderPages(
    file: File,
    orderedIndices: number[],
    rotations: Record<number, number> = {},
  ): Promise<Uint8Array> {
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
    pdf.getPages().forEach(page => {
      page.setRotation(degrees((page.getRotation().angle + angle) % 360));
    });
    return pdf.save();
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
