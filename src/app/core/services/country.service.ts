import { Injectable, signal } from '@angular/core';

export interface CountryOption {
  code: string;
  name: string;
}

interface CountryRecord {
  code: string;
}

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly loaded = signal(false);
  readonly countries = signal<CountryOption[]>([]);
  private loadPromise: Promise<void> | undefined;

  async load(): Promise<void> {
    if (this.loaded()) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = fetch('/data/countries.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Unable to load country data: ${response.status}`);
        }
        return response.json() as Promise<CountryRecord[]>;
      })
      .then(data => {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'code' });
        const normalized = data
          .filter(country => /^[A-Z]{2}$/.test(country?.code || ''))
          .map(country => {
            const code = country.code.toUpperCase();
            return { code, name: regionNames.of(code) || code };
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        this.countries.set(normalized);
        this.loaded.set(true);
      })
      .catch(error => {
        this.loadPromise = undefined;
        throw error;
      });

    return this.loadPromise;
  }

  search(query: string, limit = 50): CountryOption[] {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return this.countries().slice(0, limit);

    return this.countries()
      .filter(country =>
        country.name.toLocaleLowerCase().includes(term) ||
        country.code.toLocaleLowerCase().includes(term)
      )
      .slice(0, limit);
  }

  findByCode(code: string | undefined): CountryOption | undefined {
    const normalized = code?.trim().toUpperCase();
    return normalized ? this.countries().find(country => country.code === normalized) : undefined;
  }
}
