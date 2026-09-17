import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CalculatorDefinition, getCalculatorBySlug } from '../../calculators/calculator-registry';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly siteUrl = 'https://x-facture.com';
  private readonly siteName = 'X-Facture';
  private readonly defaultImage = `${this.siteUrl}/x-facture-LOGO-PFP.png`;

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const slug = event.urlAfterRedirects.split('?')[0].split('#')[0].split('/').filter(Boolean).pop() ?? '';
        if (event.urlAfterRedirects.startsWith('/calculators/') && getCalculatorBySlug(slug)) {
          this.updateCalculatorMetadataBySlug(slug);
        }
      });
  }

  updateMetadata(data: SeoMetadata): void {
    const url = this.normalizeUrl(data.url || `${this.siteUrl}${this.document.location.pathname}`);
    const image = data.image || this.defaultImage;

    this.titleService.setTitle(data.title);
    this.metaService.updateTag({ name: 'description', content: data.description });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });
    if (data.keywords) this.metaService.updateTag({ name: 'keywords', content: data.keywords });

    this.metaService.updateTag({ property: 'og:title', content: data.title });
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
    this.updateMetadata({
      title: calculator.title,
      description: calculator.description,
      keywords: calculator.keywords.join(', '),
      url,
      image: this.defaultImage,
      type: 'website'
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${url}#calculator`,
          name: calculator.name,
          url,
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'All',
          isAccessibleForFree: true,
          description: calculator.description,
          keywords: calculator.keywords.join(', '),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'X-Facture', item: this.siteUrl },
            { '@type': 'ListItem', position: 2, name: 'Calculators', item: `${this.siteUrl}/calculators` },
            { '@type': 'ListItem', position: 3, name: calculator.name, item: url }
          ]
        }
      ]
    });
  }

  updateCalculatorMetadataBySlug(slug: string): void {
    const calculator = getCalculatorBySlug(slug);
    if (calculator) this.updateCalculatorMetadata(calculator);
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url, this.siteUrl);
      parsed.hash = '';
      parsed.search = '';
      return parsed.toString().replace(/\/$/, '') || this.siteUrl;
    } catch {
      return url;
    }
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
