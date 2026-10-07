import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { PosService } from './core/services/pos.service';
import { ThemeService } from './core/services/theme.service';
import { DOCUMENT_TYPE_CONFIGS } from './core/config/document-type-config';
import { DocumentTypeConfig } from './core/models/document-type-config.model';

interface AppBreadcrumb {
  label: string;
  url?: string;
}


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private posService = inject(PosService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  readonly currentSession = this.posService.currentSession;
  readonly docConfigs: DocumentTypeConfig[] = Object.values(DOCUMENT_TYPE_CONFIGS);
  readonly currentTheme = this.themeService.theme;
  readonly isDark = computed(() => this.themeService.isDark());
  readonly currentBreadcrumbs = signal<AppBreadcrumb[]>([]);

  showDocsDropdown = signal<boolean>(false);
  showOpsDropdown = signal<boolean>(false);
  showProfileMenu = signal<boolean>(false);

  currentLang = signal<string>('EN');
  readonly languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  ];

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateBreadcrumbs(event.urlAfterRedirects));
    this.updateBreadcrumbs(this.router.url || '/');
  }

  private updateBreadcrumbs(rawUrl: string): void {
    const path = rawUrl.split('?')[0].split('#')[0] || '/';
    const segments = path.split('/').filter(Boolean);
    if (!segments.length) {
      this.currentBreadcrumbs.set([]);
      return;
    }

    const breadcrumbs: AppBreadcrumb[] = [{ label: 'Home', url: '/' }];
    const section = segments[0];
    const docConfig = DOCUMENT_TYPE_CONFIGS[section];

    if (docConfig) {
      breadcrumbs.push({ label: docConfig.pluralName, url: '/' + docConfig.routeSegment });
      if (segments[1] === 'new') {
        breadcrumbs.push({ label: 'New ' + docConfig.singularName });
      } else if (segments[2] === 'edit') {
        breadcrumbs.push({ label: segments[1], url: '/' + section + '/' + segments[1] + '/preview' });
        breadcrumbs.push({ label: 'Edit' });
      } else if (segments[2] === 'preview') {
        breadcrumbs.push({ label: segments[1] });
        breadcrumbs.push({ label: 'Preview' });
      }
    } else {
      const labels: Record<string, string> = {
        dashboard: 'Business Dashboard',
        store: 'POS Register',
        ledger: 'Financial Ledger',
        clients: 'Clients & CRM',
        products: 'Products & Services',
        settings: 'Settings'
      };
      breadcrumbs.push({ label: labels[section] || this.humanizeSegment(section) });
    }

    this.currentBreadcrumbs.set(breadcrumbs);
  }

  private humanizeSegment(value: string): string {
    return value
      .replace(/-calculator$/, '')
      .replace(/-/g, ' ')
      .replace(/\\b\\w/g, character => character.toUpperCase());
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu.update(v => !v);
    if (this.showProfileMenu()) {
      this.showDocsDropdown.set(false);
      this.showOpsDropdown.set(false);
    }
  }


  setLanguage(langCode: string): void {
    this.currentLang.set(langCode);
  }

  toggleDocsDropdown(): void {
    this.showDocsDropdown.update(v => !v);
    if (this.showDocsDropdown()) {
      this.showProfileMenu.set(false);
      this.showOpsDropdown.set(false);
    }
  }

  toggleOpsDropdown(): void {
    this.showOpsDropdown.update(v => !v);
    if (this.showOpsDropdown()) {
      this.showProfileMenu.set(false);
      this.showDocsDropdown.set(false);
    }
  }



  closeMenus(): void {
    this.showProfileMenu.set(false);
    this.showDocsDropdown.set(false);
    this.showOpsDropdown.set(false);
    this.showToolsDropdown.set(false);
  }

  createDoc(docType: string): void {
    this.closeMenus();
    this.router.navigate([`/${docType}/new`]);
  }

}
