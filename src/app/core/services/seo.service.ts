import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoMetadata {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private document = inject(DOCUMENT);

  updateMetadata(data: SeoMetadata): void {
    const title = data.title;
    const description = data.description;
    const siteName = 'x-facture';
    const url = data.url || this.document.location.origin + this.document.location.pathname;
    const image = data.image || `${this.document.location.origin}/favicon.ico`;

    // Standard Tags
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'description', content: description });
    if (data.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: data.keywords });
    }

    // OpenGraph Tags
    this.metaService.updateTag({ property: 'og:title', content: title });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:url', content: url });
    this.metaService.updateTag({ property: 'og:type', content: data.type || 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: siteName });
    this.metaService.updateTag({ property: 'og:image', content: image });

    // Twitter Tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: title });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    this.metaService.updateTag({ name: 'twitter:image', content: image });

    // Canonical Link
    this.updateCanonicalLink(url);
  }

  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  setJsonLd(data: any): void {
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
