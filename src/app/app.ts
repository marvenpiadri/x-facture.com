import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PosService } from './core/services/pos.service';
import { ThemeService } from './core/services/theme.service';
import { DOCUMENT_TYPE_CONFIGS } from './core/config/document-type-config';
import { DocumentTypeConfig } from './core/models/document-type-config.model';
import { FINANCE_TOOLS, FinanceToolConfig } from './core/config/calculators.config';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private posService = inject(PosService);
  private themeService = inject(ThemeService);
  private router = inject(Router);

  readonly currentSession = this.posService.currentSession;
  readonly docConfigs: DocumentTypeConfig[] = Object.values(DOCUMENT_TYPE_CONFIGS);
  readonly financeTools: FinanceToolConfig[] = FINANCE_TOOLS;
  readonly currentTheme = this.themeService.theme;
  readonly isDark = computed(() => this.themeService.isDark());

  showDocsDropdown = signal<boolean>(false);
  showOpsDropdown = signal<boolean>(false);
  showToolsDropdown = signal<boolean>(false);
  showPdfDropdown = signal<boolean>(false);
  showProfileMenu = signal<boolean>(false);
  showQuickToolDrawer = signal<boolean>(false);

  currentLang = signal<string>('EN');
  readonly languages = [
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  ];

  // Quick Mini Tool State (for floating instant calculations)
  quickToolTab = signal<'vat' | 'margin' | 'change'>('vat');
  quickSearch = signal<string>('');

  // Quick Tool Mini Inputs
  quickVatBase = signal<number>(100);
  quickVatRate = signal<number>(20);
  quickMarginCost = signal<number>(50);
  quickMarginPrice = signal<number>(85);
  quickChangeSale = signal<number>(36.5);
  quickChangeTendered = signal<number>(50);

  // Filtered finance tools for dropdown search
  filteredFinanceTools = computed(() => {
    const q = this.quickSearch().toLowerCase().trim();
    if (!q) return this.financeTools;
    return this.financeTools.filter(
      t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.shortTitle.toLowerCase().includes(q)
    );
  });

  // Quick computations
  quickVatTax = computed(() => {
    return Math.round((this.quickVatBase() * (this.quickVatRate() / 100) + Number.EPSILON) * 100) / 100;
  });
  quickVatGross = computed(() => {
    return Math.round((this.quickVatBase() + this.quickVatTax() + Number.EPSILON) * 100) / 100;
  });

  quickMarginProfit = computed(() => {
    return Math.round((this.quickMarginPrice() - this.quickMarginCost() + Number.EPSILON) * 100) / 100;
  });
  quickMarginPct = computed(() => {
    const p = this.quickMarginPrice();
    if (p <= 0) return 0;
    return Math.round(((p - this.quickMarginCost()) / p * 100 + Number.EPSILON) * 100) / 100;
  });

  quickChangeDue = computed(() => {
    return Math.max(0, Math.round((this.quickChangeTendered() - this.quickChangeSale() + Number.EPSILON) * 100) / 100);
  });

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu.update(v => !v);
    if (this.showProfileMenu()) {
      this.showDocsDropdown.set(false);
      this.showOpsDropdown.set(false);
      this.showToolsDropdown.set(false);
      this.showPdfDropdown.set(false);
    }
  }

  togglePdfDropdown(): void {
    this.showPdfDropdown.update(v => !v);
    if (this.showPdfDropdown()) {
      this.showProfileMenu.set(false);
      this.showDocsDropdown.set(false);
      this.showOpsDropdown.set(false);
      this.showToolsDropdown.set(false);
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
      this.showToolsDropdown.set(false);
    }
  }

  toggleOpsDropdown(): void {
    this.showOpsDropdown.update(v => !v);
    if (this.showOpsDropdown()) {
      this.showProfileMenu.set(false);
      this.showDocsDropdown.set(false);
      this.showToolsDropdown.set(false);
      this.showPdfDropdown.set(false);
    }
  }

  toggleToolsDropdown(): void {
    this.showToolsDropdown.update(v => !v);
    if (this.showToolsDropdown()) {
      this.showProfileMenu.set(false);
      this.showDocsDropdown.set(false);
      this.showOpsDropdown.set(false);
      this.showPdfDropdown.set(false);
    }
  }

  openQuickToolDrawer(tab: 'vat' | 'margin' | 'change' = 'vat'): void {
    this.quickToolTab.set(tab);
    this.showQuickToolDrawer.set(true);
    this.closeMenus();
  }

  closeQuickToolDrawer(): void {
    this.showQuickToolDrawer.set(false);
  }

  closeMenus(): void {
    this.showProfileMenu.set(false);
    this.showDocsDropdown.set(false);
    this.showOpsDropdown.set(false);
    this.showToolsDropdown.set(false);
    this.showPdfDropdown.set(false);
  }

  createDoc(docType: string): void {
    this.closeMenus();
    this.router.navigate([`/${docType}/new`]);
  }

  navigateToTool(route: string): void {
    this.closeMenus();
    this.router.navigateByUrl(route);
  }
}
