import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  signal,
  OnInit
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../../../core/services/settings.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { BusinessProfileSettings, NumberingPrefixConfig, RegisteredBusinessProfile } from '../../../../core/models/settings.model';
import { ALL_DOCUMENT_TYPES } from '../../../../core/config/document-type-config';
import { db } from '../../../../core/db/app-database';

export type SettingsTab = 'businesses' | 'profile' | 'numbering' | 'defaults' | 'appearance' | 'data';

export interface PrefixEditItem {
  docType: string;
  singularName: string;
  pluralName: string;
  icon: string;
  prefix: string;
  nextNumber: number;
  padding: number;
}

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './settings-hub.html',
  styleUrl: './settings-hub.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsHubPage implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private settingsService = inject(SettingsService);
  private route = inject(ActivatedRoute);
  readonly currencyService = inject(CurrencyService);
  readonly themeService = inject(ThemeService);

  readonly settings = this.settingsService.settings;

  // Active Tab
  activeTab = signal<SettingsTab>('profile');
  saveNotification = signal<boolean>(false);
  importResultMsg = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // Database metrics signals
  docCount = signal<number>(0);
  clientCount = signal<number>(0);
  productCount = signal<number>(0);
  posSalesCount = signal<number>(0);
  ledgerCount = signal<number>(0);

  // TAB 1: Managed Businesses
  readonly registeredBusinesses = this.settingsService.settings;
  showBusinessModal = signal<boolean>(false);
  isEditingBusiness = signal<boolean>(false);
  activeBusinessId = signal<string | undefined>(undefined);
  activeBusiness: BusinessProfileSettings['company'] = this.getBlankBusiness();

  // TAB 2: Profile & Company Signals
  companyName = signal<string>('');
  legalName = signal<string>('');
  email = signal<string>('');
  phone = signal<string>('');
  website = signal<string>('');
  taxId = signal<string>('');
  address = signal<string>('');
  city = signal<string>('');
  postalCode = signal<string>('');
  country = signal<string>('');
  bankDetails = signal<string>('');
  logoUrl = signal<string>('');
  signatoryName = signal<string>('');
  signatoryTitle = signal<string>('');
  signatureUrl = signal<string>('');

  // TAB 3: Numbering Prefixes
  prefixList = signal<PrefixEditItem[]>([]);

  // TAB 4: Financial & Tax Defaults
  defaultCurrency = signal<string>('');
  defaultTaxRate = signal<number>(0);
  taxName = signal<string>('');
  taxInclusive = signal<boolean>(false);
  defaultPaymentTerms = signal<string>('');
  defaultNotes = signal<string>('');
  acceptedPaymentMethods = signal<string[]>([]);

  // TAB 5: Templates & Branding
  defaultFormalTemplate = signal<'modern' | 'classic' | 'bold'>('modern');
  defaultReceiptTemplate = signal<'thermal-80mm' | 'thermal-58mm' | 'modern'>('thermal-80mm');
  paperSize = signal<'a4' | 'letter'>('a4');
  brandColor = signal<string>('#059669');
  posAutoPrint = signal<boolean>(false);
  posSoundEffects = signal<boolean>(false);

  readonly documentTypesList = ALL_DOCUMENT_TYPES;

  getBlankBusiness(): BusinessProfileSettings['company'] {
    return {
      name: '', legalName: '', email: '', phone: '', website: '', address: '',
      city: '', postalCode: '', country: '', taxId: '', logoUrl: '', bankDetails: ''
    };
  }

  openAddBusiness(): void {
    this.activeBusiness = this.getBlankBusiness();
    this.activeBusinessId.set(undefined);
    this.isEditingBusiness.set(false);
    this.showBusinessModal.set(true);
  }

  openEditBusiness(business: RegisteredBusinessProfile): void {
    this.activeBusiness = { ...business.company };
    this.activeBusinessId.set(business.id);
    this.isEditingBusiness.set(true);
    this.showBusinessModal.set(true);
  }

  async saveBusiness(): Promise<void> {
    if (!this.activeBusiness.name?.trim()) return;
    await this.settingsService.saveRegisteredBusiness(this.activeBusiness, this.activeBusinessId());
    this.showBusinessModal.set(false);
    await this.loadCurrentSettings();
  }

  async deleteBusiness(business: RegisteredBusinessProfile): Promise<void> {
    if (!confirm(`Delete managed business "${business.company.name}"?`)) return;
    await this.settingsService.deleteRegisteredBusiness(business.id);
    if (this.activeBusinessId() === business.id) this.activeBusinessId.set(undefined);
    await this.loadCurrentSettings();
  }

  onBusinessFieldChange(field: keyof BusinessProfileSettings['company'], value: string): void {
    this.activeBusiness = { ...this.activeBusiness, [field]: value };
  }


  readonly presetColors = [
    { label: 'Emerald Green', hex: '#059669' },
    { label: 'Classic Navy', hex: '#1e3a8a' },
    { label: 'Royal Indigo', hex: '#4f46e5' },
    { label: 'Slate Charcoal', hex: '#1e293b' },
    { label: 'Crimson Red', hex: '#dc2626' },
    { label: 'Amber Gold', hex: '#d97706' }
  ];

  // Computed sample document number preview
  previewYear = new Date().getFullYear();

  ngOnInit(): void {
    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    const validTabs: SettingsTab[] = ['businesses', 'profile', 'numbering', 'defaults', 'appearance', 'data'];
    if (requestedTab && validTabs.includes(requestedTab as SettingsTab)) {
      this.activeTab.set(requestedTab as SettingsTab);
    }

    this.loadCurrentSettings();
    if (this.isBrowser) {
      this.refreshMetrics();
    }
  }

  async refreshMetrics(): Promise<void> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') return;
    try {
      const [docs, clients, products, sales, ledger] = await Promise.all([
        db.documents.count(),
        db.clients.count(),
        db.products.count(),
        db.posSales.count(),
        db.ledgerEntries.count()
      ]);
      this.docCount.set(docs);
      this.clientCount.set(clients);
      this.productCount.set(products);
      this.posSalesCount.set(sales);
      this.ledgerCount.set(ledger);
    } catch {
      // Ignore if DB not ready
    }
  }

  async loadCurrentSettings(): Promise<void> {
    const s = await this.settingsService.loadSettings();
    if (s) {
      // Company Profile
      this.companyName.set(s.company?.name || '');
      this.legalName.set(s.company?.legalName || '');
      this.email.set(s.company?.email || '');
      this.phone.set(s.company?.phone || '');
      this.website.set(s.company?.website || '');
      this.taxId.set(s.company?.taxId || '');
      this.address.set(s.company?.address || '');
      this.city.set(s.company?.city || '');
      this.postalCode.set(s.company?.postalCode || '');
      this.country.set(s.company?.country || '');
      this.bankDetails.set(s.company?.bankDetails || '');
      this.logoUrl.set(s.company?.logoUrl || '');
      this.signatoryName.set(s.signatoryName || '');
      this.signatoryTitle.set(s.signatoryTitle || '');
      this.signatureUrl.set(s.signatureUrl || '');

      // Financial & Tax Defaults
      this.defaultCurrency.set(s.defaultCurrency || '');
      this.defaultTaxRate.set(s.defaultTaxRate ?? 0);
      this.taxName.set(s.taxName || '');
      this.taxInclusive.set(s.taxInclusive ?? false);
      this.defaultPaymentTerms.set(s.defaultPaymentTerms || '');
      this.defaultNotes.set(s.defaultNotes || '');
      this.acceptedPaymentMethods.set(s.acceptedPaymentMethods || []);

      // Template & Branding
      this.defaultFormalTemplate.set(s.defaultFormalTemplate || 'modern');
      this.defaultReceiptTemplate.set(s.defaultReceiptTemplate || 'thermal-80mm');
      this.paperSize.set(s.paperSize || 'a4');
      this.brandColor.set(s.brandColor || '');
      this.posAutoPrint.set(s.posAutoPrint ?? false);
      this.posSoundEffects.set(s.posSoundEffects ?? true);

      // Prefixes list setup
      const prefixesConfig = s.prefixes || {};
      const list: PrefixEditItem[] = ALL_DOCUMENT_TYPES.map((dt) => {
        const existing = prefixesConfig[dt.docType];
        return {
          docType: dt.docType,
          singularName: dt.singularName,
          pluralName: dt.pluralName,
          icon: dt.icon,
          prefix: existing?.prefix || dt.defaultPrefix,
          nextNumber: existing?.nextNumber ?? 1001,
          padding: existing?.padding ?? 4
        };
      });
      this.prefixList.set(list);
    }
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
  }

  getSampleDocNumber(item: PrefixEditItem): string {
    const padded = String(item.nextNumber).padStart(item.padding, '0');
    return `${item.prefix}-${this.previewYear}-${padded}`;
  }

  updatePrefixItem(docType: string, field: 'prefix' | 'nextNumber' | 'padding', val: any): void {
    this.prefixList.update((items) =>
      items.map((item) => {
        if (item.docType === docType) {
          if (field === 'nextNumber') return { ...item, nextNumber: Math.max(1, parseInt(val, 10) || 1) };
          if (field === 'padding') return { ...item, padding: parseInt(val, 10) || 4 };
          if (field === 'prefix') return { ...item, prefix: String(val).toUpperCase().trim() };
        }
        return item;
      })
    );
  }

  resetPrefixesToDefault(): void {
    if (confirm('Reset all document prefixes and sequential counters to default values?')) {
      const list: PrefixEditItem[] = ALL_DOCUMENT_TYPES.map((dt) => ({
        docType: dt.docType,
        singularName: dt.singularName,
        pluralName: dt.pluralName,
        icon: dt.icon,
        prefix: dt.defaultPrefix,
        nextNumber: 1001,
        padding: 4
      }));
      this.prefixList.set(list);
    }
  }

  isPaymentMethodSelected(method: string): boolean {
    return this.acceptedPaymentMethods().includes(method);
  }

  togglePaymentMethod(method: string): void {
    const current = this.acceptedPaymentMethods();
    if (current.includes(method)) {
      this.acceptedPaymentMethods.set(current.filter((m) => m !== method));
    } else {
      this.acceptedPaymentMethods.set([...current, method]);
    }
  }

  async saveSettings(): Promise<void> {
    // Build prefixes map
    const prefixesRecord: Record<string, NumberingPrefixConfig> = {};
    for (const item of this.prefixList()) {
      prefixesRecord[item.docType] = {
        prefix: item.prefix || 'DOC',
        nextNumber: item.nextNumber || 1001,
        padding: item.padding || 4
      };
    }

    const updated: Partial<BusinessProfileSettings> = {
      company: {
        name: this.companyName(),
        legalName: this.legalName(),
        email: this.email(),
        phone: this.phone(),
        website: this.website(),
        taxId: this.taxId(),
        address: this.address(),
        city: this.city(),
        postalCode: this.postalCode(),
        country: this.country(),
        bankDetails: this.bankDetails(),
        logoUrl: this.logoUrl()
      },
      defaultCurrency: this.defaultCurrency(),
      defaultTaxRate: this.defaultTaxRate(),
      taxName: this.taxName(),
      taxInclusive: this.taxInclusive(),
      defaultPaymentTerms: this.defaultPaymentTerms(),
      defaultNotes: this.defaultNotes(),
      acceptedPaymentMethods: this.acceptedPaymentMethods(),
      defaultFormalTemplate: this.defaultFormalTemplate(),
      defaultReceiptTemplate: this.defaultReceiptTemplate(),
      paperSize: this.paperSize(),
      brandColor: this.brandColor(),
      signatoryName: this.signatoryName(),
      signatoryTitle: this.signatoryTitle(),
      signatureUrl: this.signatureUrl(),
      posAutoPrint: this.posAutoPrint(),
      posSoundEffects: this.posSoundEffects(),
      prefixes: prefixesRecord
    };

    await this.settingsService.updateSettings(updated);
    this.saveNotification.set(true);
    setTimeout(() => this.saveNotification.set(false), 3000);
  }

  onLogoUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  removeLogo(): void {
    this.logoUrl.set('');
  }

  onSignatureUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.signatureUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  removeSignature(): void {
    this.signatureUrl.set('');
  }

  // Backup & Export Actions
  async exportFullJson(): Promise<void> {
    const jsonStr = await this.settingsService.exportFullDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xfacture-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportDocumentsCsv(): Promise<void> {
    const docs = await db.documents.toArray();
    const headers = ['Number', 'Type', 'IssueDate', 'DueDate', 'Client', 'Status', 'Currency', 'Subtotal', 'Tax', 'Total', 'BalanceDue'];
    const rows = docs.map(d => [
      d.docNumber,
      d.docType,
      d.issueDate,
      d.dueDate || '',
      `"${(d.client?.name || '').replace(/"/g, '""')}"`,
      d.status,
      d.currency,
      d.subtotal,
      d.taxAmount,
      d.total,
      d.balanceDue
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCsv(csvContent, `xfacture-documents-${new Date().toISOString().split('T')[0]}.csv`);
  }

  async exportLedgerCsv(): Promise<void> {
    const entries = await db.ledgerEntries.toArray();
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'PaymentMethod', 'Status', 'DocNumber', 'Client'];
    const rows = entries.map(e => [
      e.date,
      e.type,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount,
      e.currency,
      e.paymentMethod,
      e.status,
      e.docNumber || '',
      `"${(e.clientName || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCsv(csvContent, `xfacture-ledger-${new Date().toISOString().split('T')[0]}.csv`);
  }

  async exportClientsCsv(): Promise<void> {
    const clients = await db.clients.toArray();
    const headers = ['ID', 'Name', 'Information', 'DefaultCurrency', 'DefaultTaxRate', 'Notes'];
    const rows = clients.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.defaultCurrency || '',
      c.defaultTaxRate ?? 0,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCsv(csvContent, `xfacture-clients-${new Date().toISOString().split('T')[0]}.csv`);
  }

  async exportProductsCsv(): Promise<void> {
    const products = await db.products.toArray();
    const headers = ['ID', 'SKU', 'Name', 'Category', 'UnitCost', 'TaxRate', 'Description'];
    const rows = products.map(p => [
      p.id,
      p.sku || '',
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.unitCost,
      p.taxRate,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    this.downloadCsv(csvContent, `xfacture-products-${new Date().toISOString().split('T')[0]}.csv`);
  }

  private downloadCsv(csvContent: string, fileName: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const text = await file.text();
      const success = await this.settingsService.importFullDatabase(text);
      if (success) {
        this.importResultMsg.set({
          type: 'success',
          text: 'Backup successfully imported! All settings, documents, clients, catalog items, and ledger journals are restored.'
        });
        await this.loadCurrentSettings();
        await this.refreshMetrics();
      } else {
        this.importResultMsg.set({
          type: 'error',
          text: 'Failed to parse backup file. Please verify it is a valid x-facture JSON backup archive.'
        });
      }
    }
  }

  async resetAllData(): Promise<void> {
    const confirmText = prompt('Type "RESET" in all caps to permanently clear local database:');
    if (confirmText === 'RESET') {
      await db.transaction('rw', [db.settings, db.documents, db.clients, db.products, db.posSessions, db.posSales, db.ledgerEntries], async () => {
        await db.documents.clear();
        await db.clients.clear();
        await db.products.clear();
        await db.posSessions.clear();
        await db.posSales.clear();
        await db.ledgerEntries.clear();
      });
      alert('Local database has been cleared.');
      window.location.reload();
    }
  }
}
