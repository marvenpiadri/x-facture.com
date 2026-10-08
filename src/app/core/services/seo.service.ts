import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DOCUMENT_TYPE_CONFIGS } from '../config/document-type-config';
import { getCreatePageContent, CreatePageFaq } from '../config/document-create-content';

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
    const robots = data.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
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
    this.metaService.updateTag({ property: 'og:locale', content: 'en_US' });
    this.metaService.updateTag({ property: 'og:image', content: image });
    this.metaService.updateTag({ property: 'og:image:alt', content: `${this.siteName} logo` });
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });
    this.metaService.updateTag({ name: 'twitter:image:alt', content: `${this.siteName} logo` });
    this.updateCanonicalLink(url);
  }

  private updateForUrl(rawUrl: string): void {
    const path = rawUrl.split('?')[0].split('#')[0] || '/';
    const segments = path.split('/').filter(Boolean);

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
        this.updateMetadata({ title: `x-facture • ${tool.title}`, description: tool.description, keywords: tool.keywords, url });
        this.setPdfSchema(url, tool.title);
        return;
      }

      if (segments.length === 1) {
        const url = `${this.siteUrl}/pdf`;
        this.updateMetadata({
          title: 'x-facture • Free PDF Tools & Document Engine',
          description: '100% free browser-first PDF tools for organizing, merging, splitting, editing and converting documents with x-facture.',
          keywords: 'x-facture, free PDF tools, 100% free PDF tools, free PDF editor, free PDF merger, free PDF splitter, PDF converter, document engine',
          url
        });
        this.setPdfSchema(url, 'PDF Tools & Document Engine');
        return;
      }
    }

    const docType = segments[0];
    const docConfig = docType ? DOCUMENT_TYPE_CONFIGS[docType] : undefined;
    if (docConfig && segments.length === 2 && segments[1] === 'create') {
      const url = `${this.siteUrl}/${docConfig.routeSegment}/create`;
      const searchIntentMap: Record<string, { title: string; description: string; keywords: string }> = {
        'invoices': {
          title: 'Create Free Invoices Online with Factur-X • x-facture',
          description: 'Create professional invoices online for free with x-facture. Download a standard PDF or a Factur-X hybrid e-invoice with embedded structured XML, plus CII and UBL structured invoice exports.',
          keywords: 'free invoice generator, create invoice online, invoice maker, Factur-X invoice, Factur-X PDF, electronic invoice, e-invoice, hybrid PDF XML invoice, CII invoice, UBL invoice, printable invoice'
        },
        'proforma-invoices': {
          title: 'Create Free Proforma Invoices Online',
          description: 'Create a proforma invoice online for free for quotes, pre-shipment billing and advance commercial documentation before a final sale.',
          keywords: 'proforma invoice generator, create proforma invoice, proforma invoice template, free proforma invoice, preliminary invoice'
        },
        'commercial-invoices': {
          title: 'Create Free Commercial Invoices Online',
          description: 'Create a commercial invoice for international trade, customs paperwork and cross-border shipments with clear goods, values and party details.',
          keywords: 'commercial invoice generator, customs invoice, international invoice, export invoice, import invoice, commercial invoice template'
        },
        'quotes': {
          title: 'Create Free Quotes & Estimates Online',
          description: 'Create a clear business quote or estimate online for free. Present services, quantities, pricing and terms before a customer approves the work.',
          keywords: 'free quote generator, estimate maker, business quotation template, price quote, service estimate, sales quote'
        },
        'purchase-orders': {
          title: 'Create Free Purchase Orders Online',
          description: 'Create a purchase order online for free to authorize supplier purchases with item details, quantities, prices and delivery information.',
          keywords: 'purchase order generator, create purchase order, free PO template, supplier purchase order, purchase order maker'
        },
        'receipts': {
          title: 'Create Free Sales Receipts Online',
          description: 'Create a sales receipt online for free as proof of payment for retail, service and counter transactions with clear buyer and transaction details.',
          keywords: 'receipt generator, sales receipt maker, payment receipt template, free receipt generator, printable sales receipt'
        },
        'credit-notes': {
          title: 'Create Free Credit Notes Online',
          description: 'Create a credit note online for free to record refunds, returned goods, pricing corrections and reductions against a customer balance.',
          keywords: 'credit note generator, credit memo maker, refund credit note, credit note template, sales return document'
        },
        'delivery-notes': {
          title: 'Create Free Delivery Notes Online',
          description: 'Create a delivery note or packing slip online for free to document goods shipped, quantities delivered and receiving details without showing prices.',
          keywords: 'delivery note generator, packing slip maker, delivery note template, goods dispatch note, packing list'
        },
        'timesheet-invoices': {
          title: 'Create Free Timesheet Invoices Online',
          description: 'Create an hourly timesheet invoice online for free. Turn logged hours, billable rates and service work into a clear client invoice.',
          keywords: 'timesheet invoice generator, hourly invoice maker, freelancer invoice, billable hours invoice, time tracking invoice'
        },
        'work-orders': {
          title: 'Create Free Work Orders Online',
          description: 'Create a work order or job ticket online for free to organize service requests, technician tasks, labor, materials and job instructions.',
          keywords: 'work order generator, job ticket template, service work order, maintenance work order, technician job sheet'
        },
        'statements': {
          title: 'Create Free Statements of Account Online',
          description: 'Create a statement of account online for free to summarize customer charges, credits, payments and outstanding balances across a billing period.',
          keywords: 'statement of account generator, customer statement, account statement template, outstanding balance statement, billing statement'
        },
        'service-agreements': {
          title: 'Create Free Service Agreements Online',
          description: 'Create a service agreement online for free to outline recurring services, deliverables, rates, responsibilities and commercial terms.',
          keywords: 'service agreement generator, service contract template, SLA agreement, consulting agreement, service terms document'
        },
        'retainer-invoices': {
          title: 'Create Free Retainer Invoices Online',
          description: 'Create a retainer invoice online for free for advance deposits, recurring advisory work and reserved service capacity.',
          keywords: 'retainer invoice generator, retainer billing, advance invoice, recurring retainer invoice, consulting retainer'
        },
        'bills-of-lading': {
          title: 'Create Free Bills of Lading Online',
          description: 'Create a bill of lading online for free to organize cargo, shipper, consignee, carrier and freight details for commercial transport.',
          keywords: 'bill of lading generator, BOL template, freight document, shipping document, cargo bill of lading'
        },
        'custom-documents': {
          title: 'Create Free Business Documents Online',
          description: 'Create a flexible business document online for free when a standard invoice, quote or order is not the right format for your workflow.',
          keywords: 'business document generator, custom business document, free business document template, custom document maker, business form generator'
        }
      };
      const intent = searchIntentMap[docConfig.routeSegment] || {
        title: `Create Free ${docConfig.singularName} Online`,
        description: `Create a ${docConfig.singularName.toLowerCase()} online for free with x-facture. Add the details your business needs and prepare a print-ready document.`,
        keywords: `free ${docConfig.singularName.toLowerCase()} generator, create ${docConfig.singularName.toLowerCase()} online, ${docConfig.singularName.toLowerCase()} template`
      };
      const pageTitle = intent.title;
      this.updateMetadata({
        title: `${pageTitle} • x-facture`,
        description: intent.description,
        keywords: `${intent.keywords}, x-facture`,
        url
      });
      this.setDocumentCreationSchema(url, pageTitle, docConfig.routeSegment, getCreatePageContent(docConfig.routeSegment).faqs);
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
      '/': { title: 'x-facture • Free Invoice Generator & Factur-X Invoices', description: 'Create free invoices online with x-facture. Download a standard PDF or a Factur-X hybrid e-invoice with embedded structured XML, and learn what Factur-X means for electronic invoicing.', keywords: 'x-facture, Factur-X, Factur-X invoice, electronic invoice, e-invoice, hybrid PDF XML invoice, free invoice generator, free invoicing, invoice maker, business tools, PDF tools', url: this.siteUrl },
      '/home': { title: 'x-facture • Business Finance & Invoicing Tools', description: 'Practical free business tools for invoicing, POS, financial calculations, pricing, taxes and everyday business operations.', url: `${this.siteUrl}/home`, robots: 'noindex, follow' },
      '/dashboard': { title: 'x-facture • Business Dashboard', description: 'Business dashboard for monitoring sales, transactions, records and operating activity in x-facture.', url: `${this.siteUrl}/dashboard`, robots: 'noindex, nofollow' },
      '/store/pos': { title: 'x-facture • Free POS & Cash Register', description: 'Practical point-of-sale and cash register tools for retail transactions, checkout and change calculation.', keywords: 'free POS, cash register, point of sale, retail POS, checkout software', url: `${this.siteUrl}/store/pos` },
      '/ledger': { title: 'x-facture • Business Financial Ledger', description: 'Track business revenue, expenses and payment records with x-facture’s practical financial ledger.', keywords: 'business ledger, financial ledger, income expense tracker, payment ledger', url: `${this.siteUrl}/ledger` },
      '/invoices/create': { title: 'Create Free Invoices Online with Factur-X • x-facture', description: 'Create professional invoices online for free with x-facture. Download a standard PDF or a Factur-X hybrid e-invoice with embedded structured XML, plus CII and UBL exports.', keywords: 'create free invoices online, free invoice generator, online invoice maker, Factur-X invoice, Factur-X PDF, electronic invoice, e-invoice, hybrid PDF XML invoice, CII invoice, UBL invoice, business invoice', url: `${this.siteUrl}/invoices/create` },
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
    else if (path === '/invoices/create') this.setInvoiceCreationSchema(metadata.url || `${this.siteUrl}/invoices/create`);
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
    const faqQuestions = [
      ['What is Factur-X?', 'Factur-X is a hybrid electronic invoice format that combines a readable PDF with structured XML invoice data embedded in the PDF.'],
      ['What is a Factur-X invoice?', 'A Factur-X invoice gives people a normal PDF invoice while providing structured invoice data that compatible business software can process automatically.'],
      ['Why use Factur-X instead of a normal PDF?', 'A normal PDF is primarily human-readable. Factur-X adds structured invoice data for automated processing and electronic invoicing workflows.'],
      ['Does x-facture support Factur-X?', 'Yes. Eligible invoice documents in x-facture can be downloaded either as a standard PDF or as a Factur-X hybrid PDF with structured invoice data.'],
      ['Does Factur-X apply to quotes and estimates?', 'Factur-X is an electronic invoice format, so x-facture keeps Factur-X associated with invoice-oriented documents rather than ordinary quotes and estimates.']
    ];

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        this.organizationSchema(),
        { '@type': 'WebSite', '@id': `${this.siteUrl}#website`, name: this.siteName, url: this.siteUrl, publisher: { '@id': `${this.siteUrl}#organization` } },
        {
          '@type': 'WebPage',
          '@id': `${this.siteUrl}#webpage`,
          name: 'x-facture | Free Invoice Generator & Factur-X Invoices',
          url: this.siteUrl,
          isPartOf: { '@id': `${this.siteUrl}#website` },
          about: { '@id': `${this.siteUrl}#organization` }
        },
        {
          '@type': 'FAQPage',
          '@id': `${this.siteUrl}#facturx-faq`,
          mainEntity: faqQuestions.map(([name, text]) => ({
            '@type': 'Question',
            name,
            acceptedAnswer: { '@type': 'Answer', text }
          }))
        }
      ]
    });
  }

  private setInvoiceCreationSchema(url: string): void {
    this.setDocumentCreationSchema(url, 'Create Free Invoices Online', 'invoices');
  }

  private setDocumentCreationSchema(url: string, pageTitle: string, routeSegment: string, faqs: CreatePageFaq[] = []): void {
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
        },
        ...(faqs.length ? [{
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer }
          }))
        }] : [])
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
            { '@type': 'ListItem', position: 2, name: 'PDF Tools', item: `${this.siteUrl}/pdf` },
            ...(url === `${this.siteUrl}/pdf` ? [] : [{ '@type': 'ListItem', position: 3, name: pageName, item: url }])
          ]
        }
      ]
    });
  }

  private organizationSchema(): Record<string, unknown> {
    return { '@type': 'Organization', '@id': `${this.siteUrl}#organization`, name: this.siteName, url: this.siteUrl, logo: `${this.siteUrl}/x-facture-LOGO-PFP.png` };
  }

  private buildBreadcrumbs(url: string, pageName: string): Record<string, unknown>[] {
    const path = new URL(url, this.siteUrl).pathname.replace(/^\/+|\/+$/g, '');
    const parts = path ? path.split('/') : [];
    if (!parts.length) return [];

    const labels: Record<string, string> = {
      pdf: 'PDF Tools', calculators: 'Business Calculators', ledger: 'Financial Ledger', clients: 'Clients', products: 'Products & Services',
      invoices: 'Invoices', 'proforma-invoices': 'Proforma Invoices', 'commercial-invoices': 'Commercial Invoices', quotes: 'Quotes',
      'purchase-orders': 'Purchase Orders', receipts: 'Receipts', 'credit-notes': 'Credit Notes', 'delivery-notes': 'Delivery Notes',
      'timesheet-invoices': 'Timesheet Invoices', 'work-orders': 'Work Orders', statements: 'Statements', 'service-agreements': 'Service Agreements',
      'retainer-invoices': 'Retainer Invoices', 'bills-of-lading': 'Bills of Lading', 'custom-documents': 'Custom Documents',
      store: 'Store', pos: 'POS', invoice: 'Invoice'
    };
    const items: Record<string, unknown>[] = [{ '@type': 'ListItem', position: 1, name: 'x-facture', item: this.siteUrl }];
    let current = '';
    parts.forEach((part, index) => {
      current += '/' + part;
      const isLast = index === parts.length - 1;
      items.push({ '@type': 'ListItem', position: index + 2, name: isLast ? this.normalizeTitle(pageName) : (labels[part] || part.replace(/-/g, ' ')), ...(isLast ? {} : { item: this.siteUrl + current }) });
    });
    return items;
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
          itemListElement: this.buildBreadcrumbs(url, normalizedPageName)
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
