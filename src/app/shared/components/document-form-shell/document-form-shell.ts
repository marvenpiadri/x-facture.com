import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BusinessDocument, DocumentDiscount, DocumentLineItem, DocumentParty, LineLayoutMode } from '../../../core/models/document.model';
import { DocumentTypeConfig } from '../../../core/models/document-type-config.model';
import { getCreatePageContent } from '../../../core/config/document-create-content';
import { CurrencyService } from '../../../core/services/currency.service';
import { CalculationService } from '../../../core/services/calculation.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ClientService } from '../../../core/services/client.service';
import { LineItemsTableComponent } from '../line-items-table/line-items-table';
import { ClientPickerComponent } from '../client-picker/client-picker';
import { CountryPickerComponent } from '../country-picker/country-picker';
import { CountryService } from '../../../core/services/country.service';

@Component({
  selector: 'app-document-form-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LineItemsTableComponent,
    ClientPickerComponent,
    CountryPickerComponent
  ],
  templateUrl: './document-form-shell.html',
  styleUrl: './document-form-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentFormShellComponent implements OnInit {
  private currencyService = inject(CurrencyService);
  private calculationService = inject(CalculationService);
  private settingsService = inject(SettingsService);
  private clientService = inject(ClientService);
  private countryService = inject(CountryService);
  private clientSaveTimer: ReturnType<typeof setTimeout> | undefined;
  private activeBusinessId: string | undefined;
  private businessSaveTimer: ReturnType<typeof setTimeout> | undefined;

  document = input.required<BusinessDocument>();
  config = input.required<DocumentTypeConfig>();
  isNew = input<boolean>(false);

  save = output<BusinessDocument>();
  saveAndPreview = output<BusinessDocument>();

  readonly availableCurrencies = this.currencyService.CURRENCIES;
  readonly registeredBusinesses = computed(() => this.settingsService.settings()?.registeredBusinesses || []);
  readonly selectedBusinessId = computed(() =>
    this.activeBusinessId ||
    this.registeredBusinesses().find(b =>
      b.company.name === this.document().company.name &&
      b.company.address === this.document().company.address
    )?.id ||
    ''
  );

  createPageContent = computed(() => getCreatePageContent(this.config().routeSegment));

  currencySymbol = computed(() => this.currencyService.getSymbol(this.document().currency));

  // Expandable section states (matching getfacturx.com optional menus with arrows)
  deliveryExpanded = signal<boolean>(false);
  notesExpanded = signal<boolean>(false);
  showDifferentShipTo = signal<boolean>(false);

  hasDeliveryData = computed(() => {
    const d = this.document();
    return (
      (d.shippingAmount || 0) > 0 ||
      (d.deliveryDiscount || 0) > 0 ||
      (d.deliveryTaxRate || 0) > 0 ||
      !!d.specialFields?.['deliveryDate'] ||
      !!d.specialFields?.['trackingNumber'] ||
      !!d.specialFields?.['carrier'] ||
      !!d.specialFields?.['deliveryTerms'] ||
      !!d.shippingInstructions?.trim() ||
      !!d.specialFields?.['shipToName'] ||
      !!d.specialFields?.['shipToAddress']
    );
  });

  hasNotesData = computed(() => {
    const d = this.document();
    return (
      !!d.notes?.trim() ||
      !!d.bankDetails?.trim() ||
      !!d.terms?.trim() ||
      d.specialFields?.['showFooterText'] === true
    );
  });

  ngOnInit(): void {
    if (this.hasDeliveryData()) {
      this.deliveryExpanded.set(true);
    }
    if (this.hasNotesData()) {
      this.notesExpanded.set(true);
    }
    if (this.document().specialFields?.['shipToAddress'] || this.document().specialFields?.['shipToName']) {
      this.showDifferentShipTo.set(true);
    }
  }

  toggleDelivery(): void {
    this.deliveryExpanded.update(v => !v);
  }

  toggleNotes(): void {
    this.notesExpanded.update(v => !v);
  }

  selectedOutputFormat(): string {
    const route = this.config().routeSegment;
    const requested = this.document().specialFields?.['outputFormat'];
    if (route === 'invoices') return ['pdf', 'cii', 'ubl'].includes(requested) ? requested : 'pdf';
    return requested || (route === 'xfacture' ? 'factur-x' : route === 'order-x' ? 'order-x' : 'pdf');
  }

  totals = computed(() => {
    const doc = this.document();
    return this.calculationService.calculateDocumentTotals(
      doc.items,
      doc.taxRate,
      doc.discountAmount,
      doc.shippingAmount,
      doc.depositPaid,
      doc.discounts,
      doc.deliveryDiscount,
      doc.deliveryTaxRate
    );
  });

  availableTaxRatesForDiscount = computed(() => {
    const rates = new Set<number>();
    for (const it of this.document().items) {
      if (Number.isFinite(it.taxRate)) {
        rates.add(it.taxRate);
      }
    }
    if (rates.size === 0) rates.add(this.document().taxRate || 20);
    return Array.from(rates).sort((a, b) => b - a);
  });

  addInvoiceDiscount(): void {
    const current = [...(this.document().discounts || [])];
    const newDisc: DocumentDiscount = {
      id: `disc-${Date.now()}-${current.length + 1}`,
      reason: '',
      value: 0,
      type: 'percent',
      appliesTo: 'all',
      amount: 0
    };
    this.save.emit({ ...this.document(), discounts: [...current, newDisc] });
  }

  updateInvoiceDiscount(index: number, field: keyof DocumentDiscount, value: any): void {
    const current = [...(this.document().discounts || [])];
    if (!current[index]) return;
    const updated = { ...current[index] };
    if (field === 'value') {
      updated.value = Math.max(0, Number(value) || 0);
    } else if (field === 'type') {
      updated.type = value === 'fixed' ? 'fixed' : 'percent';
    } else if (field === 'appliesTo') {
      updated.appliesTo = String(value || 'all');
    } else if (field === 'reason') {
      updated.reason = String(value || '');
    }
    current[index] = updated;
    this.save.emit({ ...this.document(), discounts: current });
  }

  removeInvoiceDiscount(index: number): void {
    const current = [...(this.document().discounts || [])];
    current.splice(index, 1);
    this.save.emit({ ...this.document(), discounts: current });
  }

  getComputedDiscountAmount(index: number): string {
    const computed = this.totals().computedDiscounts;
    if (computed && computed[index] && Number.isFinite(computed[index].amount)) {
      return `${computed[index].amount.toFixed(2)} ${this.document().currency}`;
    }
    return 'auto';
  }

  onDeliveryFieldChange(field: 'shippingAmount' | 'deliveryDiscount' | 'deliveryTaxRate', value: any): void {
    const num = Math.max(0, Number(value) || 0);
    this.save.emit({ ...this.document(), [field]: num });
  }

  displaySellerDetails = computed(() => {
    const comp = this.document().company;
    if (!comp) return '';
    return this.formatMergedPartyDetails(comp);
  });

  onSellerDetailsChange(value: string): void {
    this.onCompanyFieldChange('address', value);
  }

  formatMergedPartyDetails(party: DocumentParty): string {
    if (!party) return '';
    const address = (party.address || '').trim();
    const addressLower = address.toLowerCase();
    const lines: string[] = address
      ? address.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
      : [];

    // Keep free-form address/contact text intact, while appending separately stored
    // fields only when the user has not already included them in the textarea.
    const countryName = party.country ? this.countryService.findByCode(party.country)?.name || party.country : undefined;
    const missingLocation = [party.postalCode, party.city, countryName]
      .filter((part): part is string => Boolean(part?.trim()) && !addressLower.includes(part!.trim().toLowerCase()));
    if (missingLocation.length) lines.push(missingLocation.join(' '));

    if (party.taxId?.trim() && !addressLower.includes(party.taxId.trim().toLowerCase())) {
      lines.push(`Tax / VAT: ${party.taxId.trim()}`);
    }
    const contacts: string[] = [];
    if (party.phone?.trim() && !addressLower.includes(party.phone.trim().toLowerCase())) contacts.push(`Tel: ${party.phone.trim()}`);
    if (party.email?.trim() && !addressLower.includes(party.email.trim().toLowerCase())) contacts.push(`Email: ${party.email.trim()}`);
    if (party.website?.trim() && !addressLower.includes(party.website.trim().toLowerCase())) contacts.push(party.website.trim());
    if (contacts.length) lines.push(contacts.join(' · '));
    return lines.join('\n');
  }

  onHeaderFieldChange(field: keyof BusinessDocument, value: any): void {
    this.save.emit({ ...this.document(), [field]: value });
  }

  onClientChange(client: DocumentParty): void {
    const updated: BusinessDocument = { ...this.document(), client };
    this.save.emit(updated);

    if (this.clientSaveTimer) clearTimeout(this.clientSaveTimer);
    if (!client.name?.trim()) return;

    this.clientSaveTimer = setTimeout(() => {
      void this.clientService.saveClient({
        id: updated.clientId,
        name: client.name.trim(),
        legalName: client.legalName,
        email: client.email,
        phone: client.phone,
        website: client.website,
        city: client.city,
        postalCode: client.postalCode,
        country: client.country,
        taxId: client.taxId,
        electronicAddress: client.electronicAddress,
        electronicAddressScheme: client.electronicAddressScheme,
        address: client.address || ''
      }).then(saved => {
        if (updated.clientId !== saved.id) {
          this.save.emit({ ...updated, clientId: saved.id });
        }
      }).catch(() => {
        // The document remains editable if local client persistence fails.
      });
    }, 600);
  }

  async onCompanyLogoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1_500_000) {
      input.value = '';
      return;
    }

    const logoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read logo.'));
      reader.readAsDataURL(file);
    });

    this.onCompanyFieldChange('logoUrl', logoUrl);
    input.value = '';
  }

  removeCompanyLogo(): void {
    this.onCompanyFieldChange('logoUrl', '');
  }

  onCompanyFieldChange(field: keyof DocumentParty, value: string): void {
    const company: DocumentParty = { ...this.document().company, [field]: value };
    const updated: BusinessDocument = { ...this.document(), company };
    this.save.emit(updated);

    if (this.businessSaveTimer) clearTimeout(this.businessSaveTimer);
    this.businessSaveTimer = setTimeout(() => {
      void this.settingsService.saveRegisteredBusiness(company, this.activeBusinessId).then(profile => {
        this.activeBusinessId = profile.id;
      }).catch(() => {
        // The document remains editable if local profile persistence fails.
      });
    }, 600);
  }

  onBusinessSelect(event: Event): void {
    if (this.businessSaveTimer) clearTimeout(this.businessSaveTimer);
    const id = (event.target as HTMLSelectElement).value;
    if (!id) {
      this.activeBusinessId = undefined;
      return;
    }

    const profile = this.registeredBusinesses().find(b => b.id === id);
    if (!profile) return;

    this.activeBusinessId = profile.id;
    const formattedAddress = this.formatMergedPartyDetails(profile.company);
    this.save.emit({
      ...this.document(),
      company: { ...profile.company, address: formattedAddress }
    });

    void this.settingsService.selectRegisteredBusiness(profile.id).catch(() => {
      // The selected company remains applied to the current document.
    });
  }

  onSavedClientSelect(selection: { client: DocumentParty; clientId: string }): void {
    if (this.clientSaveTimer) {
      clearTimeout(this.clientSaveTimer);
      this.clientSaveTimer = undefined;
    }

    const formattedAddress = this.formatMergedPartyDetails(selection.client);
    this.save.emit({
      ...this.document(),
      client: { ...selection.client, address: formattedAddress },
      clientId: selection.clientId
    });
  }

  onClientIdChange(clientId: string | undefined): void {
    if (this.clientSaveTimer) {
      clearTimeout(this.clientSaveTimer);
      this.clientSaveTimer = undefined;
    }

    const updated: BusinessDocument = { ...this.document(), clientId };
    this.save.emit(updated);

    if (!clientId || !updated.client.name?.trim()) return;

    void this.clientService.saveClient({
      id: clientId,
      name: updated.client.name.trim(),
      legalName: updated.client.legalName,
      email: updated.client.email,
      phone: updated.client.phone,
      website: updated.client.website,
      city: updated.client.city,
      postalCode: updated.client.postalCode,
      country: updated.client.country,
      taxId: updated.client.taxId,
      electronicAddress: updated.client.electronicAddress,
      electronicAddressScheme: updated.client.electronicAddressScheme,
      address: updated.client.address || ''
    }).catch(() => {
      // The selected client remains applied to the current document.
    });
  }

  onItemsChange(items: DocumentLineItem[]): void {
    this.save.emit({ ...this.document(), items });
  }

  onLineLayoutModeChange(mode: LineLayoutMode): void {
    this.save.emit({ ...this.document(), lineLayoutMode: mode });
  }

  onSpecialFieldChange(field: string, value: any): void {
    this.save.emit({
      ...this.document(),
      specialFields: {
        ...(this.document().specialFields || {}),
        [field]: value
      }
    });
  }

  onTotalsModifierChange(field: 'taxRate' | 'discountAmount' | 'shippingAmount' | 'depositPaid', value: any): void {
    const num = Math.max(0, Number(value) || 0);
    this.save.emit({ ...this.document(), [field]: num });
  }

  triggerSave(): void {
    this.save.emit(this.document());
  }

  triggerSaveAndPreview(): void {
    this.saveAndPreview.emit(this.document());
  }

  fillSampleData(): void {
    const current = this.document();
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const sample: BusinessDocument = {
      ...current,
      docNumber: current.docNumber || 'INV-2026-0042',
      issueDate: current.issueDate || today,
      dueDate: current.dueDate || dueDate,
      purchaseOrderRef: current.purchaseOrderRef || 'PO-2026-984',
      company: {
        ...current.company,
        name: current.company.name || 'Factur-X Solutions SAS',
        address: current.company.address || '15 Boulevard Haussmann\n75009 Paris, France\nTax / VAT: FR12345678901\nEmail: billing@facturx-solutions.fr · Tel: +33 1 42 68 00 00'
      },
      client: {
        ...current.client,
        name: current.client.name || 'Starlight Technologies Ltd',
        address: current.client.address || '25 City Road\nEC1Y 1AA London, United Kingdom\nTax / VAT: GB987654321\nEmail: finance@starlight.tech · Tel: +44 20 7946 0912'
      },
      items: current.items.length > 0 && current.items[0].description ? current.items : [
        {
          id: 'item-1',
          description: 'Factur-X E-Invoice Integration & Setup',
          quantity: 1,
          unitCost: 1200,
          taxRate: 20,
          discountPercent: 0,
          amount: 1200
        },
        {
          id: 'item-2',
          description: 'PDF/A-3b Compliance Validation Service',
          quantity: 2,
          unitCost: 350,
          taxRate: 20,
          discountPercent: 5,
          amount: 665
        }
      ],
      notes: current.notes || 'Payment terms: 30 days net from issue date. Thank you for your business.',
      bankDetails: current.bankDetails || 'Bank: BNP Paribas Paris\nIBAN: FR76 3000 6000 0112 3456 7890 189\nBIC: BNPAFRPPXXX\nAccount Name: Factur-X Solutions SAS',
      shippingAmount: current.shippingAmount || 35,
      deliveryDiscount: current.deliveryDiscount || 0,
      deliveryTaxRate: current.deliveryTaxRate || 20,
      shippingInstructions: current.shippingInstructions || 'Deliver to loading bay B. Gate code #4012.',
      specialFields: {
        ...(current.specialFields || {}),
        deliveryDate: current.specialFields?.['deliveryDate'] || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        carrier: current.specialFields?.['carrier'] || 'DHL Express',
        trackingNumber: current.specialFields?.['trackingNumber'] || 'DHL-984210984',
        deliveryTerms: current.specialFields?.['deliveryTerms'] || 'DAP (Delivered at Place)',
        transactionNature: 'services',
        paymentMethod: 'bank-transfer',
        iban: 'FR76 3000 6000 0112 3456 7890 189',
        bic: 'BNPAFRPPXXX',
        outputFormat: current.specialFields?.['outputFormat'] || (['xfacture', 'credit-notes'].includes(this.config().routeSegment) ? 'factur-x' : 'pdf')
      }
    };
    this.deliveryExpanded.set(true);
    this.notesExpanded.set(true);
    this.save.emit(sample);
  }
}
