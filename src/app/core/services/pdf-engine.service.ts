import { Injectable } from '@angular/core';
import { degrees, PDFDocument } from 'pdf-lib';

export interface PdfPageSelection {
  pageIndex: number;
}

export interface PdfMergeInput {
  file: File;
  rotation?: number;
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
    const output = await PDFDocument.create();

    for (const item of files) {
      const source = await this.load(item.file);
      const pages = await output.copyPages(source, source.getPageIndices());

      for (const page of pages) {
        if (item.rotation) {
          const current = page.getRotation().angle;
          page.setRotation(degrees((current + item.rotation) % 360));
        }
        output.addPage(page);
      }
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
      if (rotation) {
        page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      }
      output.addPage(page);
    });

    return output.save();
  }

  async deletePages(file: File, pageIndices: number[]): Promise<Uint8Array> {
    const source = await this.load(file);
    const deleted = new Set(pageIndices);
    const remaining = source.getPageIndices().filter(index => !deleted.has(index));
    return this.reorderPages(file, remaining);
  }

  async duplicatePages(file: File, pageIndices: number[]): Promise<Uint8Array> {
    const source = await this.load(file);
    const output = await PDFDocument.create();
    const selected = new Set(pageIndices);

    for (const index of source.getPageIndices()) {
      const pages = await output.copyPages(source, [index]);
      output.addPage(pages[0]);

      if (selected.has(index)) {
        const duplicate = await output.copyPages(source, [index]);
        output.addPage(duplicate[0]);
      }
    }

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
