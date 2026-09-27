import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';

interface PdfTool {
  slug: string;
  title: string;
  description: string;
  icon: string;
  mode: 'local' | 'backend' | 'future';
}

@Component({
  selector: 'app-pdf-studio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pdf-studio.html',
  styleUrl: './pdf-studio.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfStudioPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);

  readonly tools: PdfTool[] = [
    { slug: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDF files into one document and control their order.', icon: 'merge_type', mode: 'local' },
    { slug: 'split-pdf', title: 'Split PDF', description: 'Split a PDF into separate files using pages, ranges, or selected sections.', icon: 'content_cut', mode: 'local' },
    { slug: 'organize-pdf', title: 'Organize PDF', description: 'Reorder, rotate, duplicate, delete, and extract pages from a PDF.', icon: 'dashboard_customize', mode: 'local' },
    { slug: 'compress-pdf', title: 'Compress PDF', description: 'Reduce PDF file size while keeping the document practical to use.', icon: 'compress', mode: 'local' },
    { slug: 'image-to-pdf', title: 'Image to PDF', description: 'Turn JPG, PNG, and other supported images into a PDF document.', icon: 'photo_library', mode: 'local' },
    { slug: 'pdf-to-image', title: 'PDF to Image', description: 'Export PDF pages as image files for sharing or reuse.', icon: 'image', mode: 'local' },
    { slug: 'protect-pdf', title: 'Protect PDF', description: 'Prepare password and permissions protection for PDF documents.', icon: 'lock', mode: 'backend' },
    { slug: 'word-to-pdf', title: 'Word to PDF', description: 'Convert Word documents to PDF using the future shared X-Facture document service.', icon: 'description', mode: 'backend' },
    { slug: 'chat-with-pdf', title: 'Chat with PDF', description: 'Ask questions about a document and extract useful information with AI.', icon: 'chat', mode: 'future' }
  ];

  activeSlug = 'pdf';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.activeSlug = params.get('tool') || 'pdf';
      const tool = this.tools.find(item => item.slug === this.activeSlug);
      this.seoService.updateMetadata({
        title: tool ? tool.title + ' — X-Facture PDF Studio' : 'PDF Studio — X-Facture',
        description: tool ? tool.description + ' Use X-Facture PDF Studio for document and PDF workflows.' : 'Free PDF tools from X-Facture for merging, splitting, organizing, compressing, converting, and working with documents.',
        keywords: tool ? tool.title.toLowerCase() + ', pdf tools, pdf editor, x-facture' : 'pdf tools, pdf studio, merge pdf, split pdf, compress pdf, x-facture',
        url: 'https://x-facture.com/pdf' + (tool ? '/' + tool.slug : '')
      });
    });
  }

  isActive(tool: PdfTool): boolean {
    return this.activeSlug === tool.slug;
  }

  statusLabel(tool: PdfTool): string {
    if (tool.mode === 'local') return 'Browser processing';
    if (tool.mode === 'backend') return 'Backend coming soon';
    return 'Pro · Coming soon';
  }
}
