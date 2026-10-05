import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CalculatorDefinition, getCalculatorBySlug } from '../../calculators/calculator-registry';
import { DOCUMENT_TYPE_CONFIGS } from '../config/document-type-config';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  robots?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly siteUrl = 'https://x-facture.com';
  private readonly siteName = 'x-facture';
  private readonly defaultImage = `${this.siteUrl}/x-facture-LOGO-PFP.png`;

  constructor() {
    this.guardDocumentTitle();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateForUrl(event.urlAfterRedirects));
    this.updateForUrl(this.router.url || '/');
  }

  updateMetadata(data: SeoMetadata): void {
    const pathname = this.document?.location?.pathname || this.router.url || '';
    const url = this.normalizeUrl(data.url || `${this.siteUrl}${pathname}`);
    const image = data.image || this.defaultImage;
    const robots = data.robots || 'index, follow';
    const title = this.normalizeTitle(data.title);

    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: data.description });
    this.metaService.updateTag({ name: 'robots', content: robots });
    this.metaService.updateTag({ name: 'googlebot', content: robots });
    if (data.keywords) this.metaService.updateTag({ name: 'keywords', content: data.keywords });
    else this.metaService.removeTag('name="keywords"');

    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: data.description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: this.siteName });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: data.title });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    this.updateCanonicalLink(url);
  }

  updateCalculatorMetadata(calculator: CalculatorDefinition): void {
    const url = `${this.siteUrl}/calculators/${calculator.slug}`;
    this.updateMetadata({ title: calculator.title, description: calculator.description, keywords: calculator.keywords.join(', '), url, type: 'website' });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        this.organizationSchema(),
        {
          '@type': 'WebApplication',
          '@id': `${url}#calculator`,
          name: calculator.name,
          url,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          isAccessibleForFree: true,
          description: calculator.description,
          keywords: calculator.keywords.join(', '),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          provider: { '@id': `${this.siteUrl}#organization` }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumbs`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'x-facture', item: this.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Business Calculators', item: `${this.siteUrl}/calculators` },
            { '@type': 'ListItem', position: 3, name: this.normalizeTitle(calculator.name), item: url }
          ]
        }
      ]
    });
  }

  updateCalculatorMetadataBySlug(slug: string): void {
    const calculator = getCalculatorBySlug(slug);
    if (calculator) this.updateCalculatorMetadata(calculator);
  }

  private updateForUrl(rawUrl: string): void {
    const path = rawUrl.split('?')[0].split('#')[0] || '/';
    const segments = path.split('/').filter(Boolean);

    if (segments[0] === 'calculators' && segments[1]) {
      const calculator = getCalculatorBySlug(segments[1]);
      if (calculator) {
        this.updateCalculatorMetadata(calculator);
        return;
      }
    }

    if (segments[0] === 'calculators') {
      this.updateMetadata({
        title: 'x-facture • Business Calculators & Financial Tools',
        description: 'Free business calculators for pricing, margins, taxes, payments, loans, cash flow, inventory, marketing and everyday financial decisions.',
        keywords: 'business calculators, financial calculators, pricing calculator, profit calculator, cash flow calculator, tax calculator, loan calculator, invoice calculator',
        url: `${this.siteUrl}/calculators`
      });
      this.setSiteSchema(`${this.siteUrl}/calculators`, 'Business Calculators & Financial Tools');
      return;
    }

    if (segments[0] === 'pdf') {
      const pdfTools: Record<string, { title: string; description: string; keywords: string }> = {
        'organize-pdf': { title: 'Free PDF Organizer Online', description: 'Organize PDF pages for free directly in your browser with x-facture. Reorder, rotate and manage documents without installation.', keywords: 'free PDF organizer, organize PDF, reorder PDF pages, rotate PDF pages, PDF page organizer' },
        'merge-pdf': { title: 'Free PDF Merger Online', description: 'Merge PDF files for free directly in your browser. Combine documents and move individual pages between PDFs with x-facture.', keywords: 'free PDF merger, merge PDF, combine PDF files, merge PDF pages' },
        'split-pdf': { title: 'Free PDF Splitter Online', description: 'Split PDF files for free directly in your browser by selected pages, ranges or page groups.', keywords: 'free PDF splitter, split PDF, extract PDF pages, PDF splitter' },
        'rotate-pdf': { title: 'Free PDF Rotator Online', description: 'Rotate PDF pages for free and export the corrected document directly in your browser.', keywords: 'free PDF rotator, rotate PDF, rotate PDF pages' },
        'flatten-pdf': { title: 'Free PDF Flatten Tool Online', description: 'Flatten PDF files for free into a clean document directly in your browser with x-facture.', keywords: 'free PDF flatten tool, flatten PDF, flatten PDF forms' },
        'crop-pdf': { title: 'Free PDF Cropper Online', description: 'Crop PDF pages for free with an interactive crop box and independent edge controls.', keywords: 'free PDF cropper, crop PDF, PDF cropper, crop PDF pages' },
        'pdf-editor': { title: 'Free PDF Editor Online', description: 'Edit PDFs for free in your browser by adding positioned text to PDF pages with x-facture.', keywords: 'free PDF editor, PDF editor, edit PDF, add text to PDF' },
        'add-watermark': { title: 'Free PDF Watermark Tool', description: 'Add watermarks to PDF files for free directly in your browser with configurable text controls.', keywords: 'free PDF watermark, PDF watermark, add watermark to PDF' },
        'add-page-numbers': { title: 'Free PDF Page Number Tool', description: 'Add page numbers to PDF files for free with customizable prefixes, suffixes and positioning.', keywords: 'free PDF page numbers, PDF page numbers, number PDF pages' },
        'image-to-pdf': { title: 'Free Image to PDF Converter', description: 'Convert images to PDF for free and arrange pages with size, orientation and fit controls.', keywords: 'free image to PDF, image to PDF, JPG to PDF, PNG to PDF' },
        'pdf-to-image': { title: 'Free PDF to Image Converter', description: 'Convert PDF pages to PNG or JPEG images for free directly in your browser.', keywords: 'free PDF to image, PDF to image, PDF to JPG, PDF to PNG' },
        'pdf-metadata': { title: 'Free PDF Metadata Tool', description: 'Inspect and update PDF metadata for free, including title, author, subject and keywords.', keywords: 'free PDF metadata, PDF metadata, edit PDF metadata' }
      };

      const tool = segments[1] ? pdfTools[segments[1]] : undefined;
      if (tool) {
        const url = `${this.siteUrl}/pdf/${segments[1]}`;
        this.updateMetadata({ title: `PDFeus • ${tool.title}`, description: tool.description, keywords: tool.keywords, url });
        this.setPdfSchema(url, tool.title);
        return;
      }

      if (segments.length === 1) {
        const url = `${this.siteUrl}/pdf`;
        this.updateMetadata({
          title: 'PDFeus • Free PDF Tools & Document Engine',
          description: '100% free browser-first PDF tools for organizing, merging, splitting, editing and converting documents with PDFeus.',
          keywords: 'PDFeus, free PDF tools, 100% free PDF tools, free PDF editor, free PDF merger, free PDF splitter, PDF converter, document engine',
          url
        });
        this.setPdfSchema(url, 'PDF Tools & Document Engine');
        return;
      }
    }

    const docType = segments[0];
    const docConfig = docType ? DOCUMENT_TYPE_CONFIGS[docType] : undefined;
    if (docConfig && segments.length === 2 && segments[1] === 'new') {
      const url = `${this.siteUrl}/${docConfig.routeSegment}/new`;
      const singular = docConfig.singularName.replace(/\s*\/.*$/, '').trim();
      const titleMap: Record<string, string> = {
        'invoices': 'Create Free Invoices Online',
        'proforma-invoices': 'Create Free Proforma Invoices Online',
        'commercial-invoices': 'Create Free Commercial Invoices Online',
        'quotes': 'Create Free Quotes & Estimates Online',
        'purchase-orders': 'Create Free Purchase Orders Online',
        'receipts': 'Create Free Sales Receipts Online',
        'credit-notes': 'Create Free Credit Notes Online',
        'delivery-notes': 'Create Free Delivery Notes Online',
        'timesheet-invoices': 'Create Free Timesheet Invoices Online',
        'work-orders': 'Create Free Work Orders Online',
        'statements': 'Create Free Statements of Account Online',
        'service-agreements': 'Create Free Service Agreements Online',
        'retainer-invoices': 'Create Free Retainer Invoices Online',
        'bills-of-lading': 'Create Free Bills of Lading Online',
        'custom-documents': 'Create Free Business Documents Online'
      };
      const pageTitle = titleMap[docConfig.routeSegment] || `Create Free ${docConfig.singularName} Online`;
      this.updateMetadata({
        title: `${pageTitle} • x-facture`,
        description: `Create ${singular.toLowerCase()}s online for free with x-facture. Add your business, client, items, pricing and document details, then save your document.`,
        keywords: `create free ${singular.toLowerCase()} online, free ${singular.toLowerCase()} generator, online ${singular.toLowerCase()} maker, create ${singular.toLowerCase()}, x-facture`,
        url
      });
      this.setDocumentCreationSchema(url, pageTitle, docConfig.routeSegment);
      return;
    }
    if (docConfig && segments.length === 1) {
      const url = `${this.siteUrl}/${docConfig.routeSegment}`;
      this.updateMetadata({
        title: `x-facture • ${docConfig.pluralName} | Free Business Documents`,
        description: `${docConfig.description} Create and manage ${docConfig.pluralName.toLowerCase()} with x-facture's free business document tools.`,
        keywords: `${docConfig.pluralName.toLowerCase()}, ${docConfig.singularName.toLowerCase()}, business documents, invoicing, free business tools`,
        url
      });
      this.setSiteSchema(url, docConfig.pluralName);
      return;
    }

    const routeSeo: Record<string, SeoMetadata> = {
      '/': { title: 'x-facture • Free Invoicing & PDF Tools, Business Calculators', description: '100% free business tools for entrepreneurs and companies: invoicing, free PDF tools, receipts, POS, financial calculators, cash-flow tools, pricing, taxes and business records.', keywords: 'free business tools, free invoicing, free PDF tools, free PDF editor, free PDF merger, invoice generator, POS, business finance, pricing tools, cash flow, tax calculator', url: this.siteUrl },
      '/home': { title: 'x-facture • Business Finance & Invoicing Tools', description: 'Practical free business tools for invoicing, POS, financial calculations, pricing, taxes and everyday business operations.', url: `${this.siteUrl}/home`, robots: 'noindex, follow' },
      '/dashboard': { title: 'x-facture • Business Dashboard', description: 'Business dashboard for monitoring sales, transactions, records and operating activity in x-facture.', url: `${this.siteUrl}/dashboard`, robots: 'noindex, nofollow' },
      '/store/pos': { title: 'x-facture • Free POS & Cash Register', description: 'Practical point-of-sale and cash register tools for retail transactions, checkout and change calculation.', keywords: 'free POS, cash register, point of sale, retail POS, checkout software', url: `${this.siteUrl}/store/pos` },
      '/ledger': { title: 'x-facture • Business Financial Ledger', description: 'Track business revenue, expenses and payment records with x-facture’s practical financial ledger.', keywords: 'business ledger, financial ledger, income expense tracker, payment ledger', url: `${this.siteUrl}/ledger` },
      '/invoices/new': { title: 'Create Free Invoices Online • x-facture', description: 'Create professional invoices online for free with x-facture. Add your business and client details, line items, taxes and payment information, then save your invoice.', keywords: 'create free invoices online, free invoice generator, online invoice maker, create invoice, free invoice template, business invoice', url: `${this.siteUrl}/invoices/new` },
      '/clients': { title: 'x-facture • Client Directory & CRM', description: 'Organize customer accounts, billing contacts and client information for everyday business operations.', keywords: 'client management, CRM, customer directory, billing contacts', url: `${this.siteUrl}/clients` },
      '/products': { title: 'x-facture • Products & Services Catalog', description: 'Manage products, services, pricing, SKUs and inventory information for your business.', keywords: 'product catalog, service catalog, SKU management, inventory, business products', url: `${this.siteUrl}/products` },
      '/settings': { title: 'x-facture • Company & Business Settings', description: 'Configure company details, tax settings, currency and business preferences in x-facture.', url: `${this.siteUrl}/settings`, robots: 'noindex, nofollow' }
    };

    const metadata = routeSeo[path] ?? {
      title: 'x-facture • Free Business Tools',
      description: 'Practical free business tools for invoicing, finance, pricing, taxes, payments and operations.',
      url: `${this.siteUrl}${path}`,
      robots: 'noindex, nofollow'
    };
    this.updateMetadata(metadata);
    if (path === '/') this.setHomepageSchema();
    else if (path === '/invoices/new') this.setInvoiceCreationSchema(metadata.url || `${this.siteUrl}/invoices/new`);
    else this.setSiteSchema(metadata.url || this.siteUrl, metadata.title);
  }

  private normalizeTitle(title: string): string {
    return title
      .replace(/[\u2014\u2013]/g, '•')
      .replace(/\s*•\s*/g, ' • ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private guardDocumentTitle(): void {
    if (typeof MutationObserver === 'undefined') return;

    const sanitize = (): void => {
      const titleElement = this.document.querySelector('title');
      if (!titleElement) return;

      const currentTitle = titleElement.textContent || '';
      const normalizedTitle = this.normalizeTitle(currentTitle);
      if (currentTitle !== normalizedTitle) {
        titleElement.textContent = normalizedTitle;
      }
    };

    sanitize();

    const observer = new MutationObserver(sanitize);
    observer.observe(this.document.head, { childList: true, subtree: true, characterData: true });
  }

  private setHomepageSchema(): void {
    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        this.organizationSchema(),
        { '@type': 'WebSite', '@id': `${this.siteUrl}#website`, name: this.siteName, url: this.siteUrl, publisher: { '@id': `${this.siteUrl}#organization` } },
        { '@type': 'WebPage', '@id': `${this.siteUrl}#webpage`, name: 'x-facture | Free Invoicing & PDF Tools, Business Calculators', url: this.siteUrl, isPartOf: { '@id': `${this.siteUrl}#website` }, about: { '@id': `${this.siteUrl}#organization` } }
      ]
    });
  }

  private setInvoiceCreationSchema(url: string): void {
    this.setDocumentCreationSchema(url, 'Create Free Invoices Online', 'invoices');
  }

  private setDocumentCreationSchema(url: string, pageTitle: string, routeSegment: string): void {
    const collectionUrl = `${this.siteUrl}/${routeSegment}`;
    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        this.organizationSchema(),
        { '@type': 'WebSite', '@id': `${this.siteUrl}#website`, name: this.siteName, url: this.siteUrl, publisher: { '@id': `${this.siteUrl}#organization` } },
        { '@type': 'WebPage', '@id': `${url}#webpage`, name: pageTitle, url, isPartOf: { '@id': `${this.siteUrl}#website` }, about: { '@id': `${this.siteUrl}#organization` } },
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumbs`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'x-facture', item: this.siteUrl },
            { '@type': 'ListItem', position: 2, name: this.normalizeTitle(DOCUMENT_TYPE_CONFIGS[routeSegment]?.pluralName || routeSegment), item: collectionUrl },
            { '@type': 'ListItem', position: 3, name: pageTitle, item: url }
          ]
        }
      ]
    });
  }

  private setPdfSchema(url: string, pageName: string): void {
    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        this.organizationSchema(),
        { '@type': 'WebSite', '@id': `${this.siteUrl}#website`, name: this.siteName, url: this.siteUrl, publisher: { '@id': `${this.siteUrl}#organization` } },
        { '@type': 'WebPage', '@id': `${url}#webpage`, name: pageName, url, isPartOf: { '@id': `${this.siteUrl}#website` } },
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumbs`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'x-facture', item: this.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'PDFeus', item: `${this.siteUrl}/pdf` },
            ...(url === `${this.siteUrl}/pdf` ? [] : [{ '@type': 'ListItem', position: 3, name: pageName, item: url }])
          ]
        }
      ]
    });
  }

  private organizationSchema(): Record<string, unknown> {
    return { '@type': 'Organization', '@id': `${this.siteUrl}#organization`, name: this.siteName, url: this.siteUrl, logo: `${this.siteUrl}/x-facture-LOGO-PFP.png` };
  }

  private setSiteSchema(url: string, pageName: string): void {
    const normalizedPageName = this.normalizeTitle(pageName);

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        this.organizationSchema(),
        { '@type': 'WebSite', '@id': `${this.siteUrl}#website`, name: this.siteName, url: this.siteUrl, publisher: { '@id': `${this.siteUrl}#organization` } },
        { '@type': 'WebPage', '@id': `${url}#webpage`, name: normalizedPageName, url, isPartOf: { '@id': `${this.siteUrl}#website` }, about: { '@id': `${this.siteUrl}#organization` } },
        {
          '@type': 'BreadcrumbList',
          '@id': `${url}#breadcrumbs`,
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'x-facture', item: this.siteUrl },
            { '@type': 'ListItem', position: 2, name: normalizedPageName, item: url }
          ]
        }
      ]
    });
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url, this.siteUrl);
      parsed.hash = '';
      parsed.search = '';
      return parsed.toString().replace(/\/$/, '') || this.siteUrl;
    } catch { return url; }
  }

  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) link.setAttribute('href', url);
    else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  setJsonLd(data: unknown): void {
    let script = this.document.querySelector('script[type="application/ld+json"]#dynamic-json-ld');
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('id', 'dynamic-json-ld');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

}
