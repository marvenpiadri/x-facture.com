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
import { BusinessDocument, DocumentDiscount, DocumentLineItem, DocumentParty, LineLayoutMode, PartyTaxIdentifier } from '../../../core/models/document.model';
import { getDefaultPartyIdentifierDefinitions, getPartyIdentifierDefinitions, PartyIdentifierDefinition } from '../../../core/config/party-identifier-registry';
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
  readonly countries = this.countryService.countries;
  readonly sellerIdentifierDefinitions = computed(() => getPartyIdentifierDefinitions(this.document().company.country));
  readonly sellerTaxIdentifiers = computed<PartyTaxIdentifier[]>(() => {
    const current = this.document().company.taxIdentifiers || [];
    if (current.length) return current;
    const legacy = this.document().company.taxId?.trim();
    return legacy ? [{ id: 'legacy-tax-id', type: 'VAT', label: 'Tax / VAT', value: legacy }] : [];
  });
  readonly deliveryExpanded = signal<boolean>(false);
  readonly notesExpanded = signal<boolean>(false);

  readonly isLogisticsEnabled = computed(() => {
    const d = this.document();
    if (d.enableLogistics !== undefined) return Boolean(d.enableLogistics);
    if (d.specialFields?.['enableLogistics'] !== undefined) return Boolean(d.specialFields?.['enableLogistics']);
    return false;
  });

  ngOnInit(): void {
    void this.countryService.load();
    if (this.isLogisticsEnabled()) {
      this.deliveryExpanded.set(true);
    }
    if (this.hasNotesData()) {
      this.notesExpanded.set(true);
    }
  }

  toggleLogistics(enabled: boolean): void {
    const doc = this.document();
    const updatedSpecialFields = {
      ...(doc.specialFields || {}),
      enableLogistics: enabled
    };
    if (!enabled) {
      this.deliveryExpanded.set(false);
      this.save.emit({
        ...doc,
        enableLogistics: false,
        shippingAmount: 0,
        deliveryDiscount: 0,
        specialFields: updatedSpecialFields
      });
    } else {
      this.deliveryExpanded.set(true);
      this.save.emit({
        ...doc,
        enableLogistics: true,
        specialFields: updatedSpecialFields
      });
    }
  }

  readonly hasDeliveryData = computed(() => {
    const d = this.document();
    const sf = d.specialFields || {};
    return (
      (d.shippingAmount || 0) > 0 ||
      (d.deliveryDiscount || 0) > 0 ||
      (d.deliveryTaxRate || 0) > 0 ||
      Boolean(d.shippingInstructions?.trim()) ||
      Boolean(sf['deliveryDate']) ||
      Boolean(sf['carrier']?.trim()) ||
      Boolean(sf['trackingNumber']?.trim()) ||
      Boolean(sf['deliveryTerms']?.trim()) ||
      Boolean(sf['deliveryAddress']?.trim()) ||
      Boolean(sf['deliveryRecipient']?.trim())
    );
  });

  readonly hasNotesData = computed(() => {
    const d = this.document();
    return (
      Boolean(d.notes?.trim()) ||
      Boolean(d.bankDetails?.trim()) ||
      Boolean(d.specialFields?.['showFooterText'] && d.specialFields?.['footerText']?.trim())
    );
  });

  readonly hasDifferentShipTo = computed(() => {
    const sf = this.document().specialFields;
    return Boolean(
      sf?.['showDifferentShipTo'] ||
      sf?.['deliveryAddress'] ||
      sf?.['deliveryRecipient']
    );
  });

  readonly isShippingChargeable = computed(() => (this.document().shippingAmount || 0) > 0);

  readonly deliveryTaxAmount = computed(() => {
    const net = this.totals().netShipping;
    const rate = this.document().deliveryTaxRate !== undefined && Number.isFinite(this.document().deliveryTaxRate)
      ? this.document().deliveryTaxRate!
      : (this.document().taxRate || 20);
    return Math.round((net * (rate / 100) + Number.EPSILON) * 100) / 100;
  });

  readonly deliveryTotalWithTax = computed(() => {
    return Math.round((this.totals().netShipping + this.deliveryTaxAmount() + Number.EPSILON) * 100) / 100;
  });

  setShippingMode(mode: 'free' | 'chargeable'): void {
    if (mode === 'free') {
      this.save.emit({
        ...this.document(),
        shippingAmount: 0,
        deliveryDiscount: 0
      });
    } else {
      const defaultFee = (this.document().shippingAmount || 0) > 0 ? this.document().shippingAmount : 15;
      const defaultTax = (this.document().deliveryTaxRate ?? 0) > 0
        ? this.document().deliveryTaxRate!
        : (this.document().taxRate || 20);
      this.save.emit({
        ...this.document(),
        shippingAmount: defaultFee,
        deliveryTaxRate: defaultTax
      });
    }
  }

  toggleDelivery(event?: Event): void {
    if (event) event.stopPropagation();
    this.deliveryExpanded.update(v => !v);
  }

  toggleNotes(event?: Event): void {
    if (event) event.stopPropagation();
    this.notesExpanded.update(v => !v);
  }

  toggleDifferentShipTo(checked: boolean): void {
    this.onSpecialFieldChange('showDifferentShipTo', checked);
  }

  onShippingInstructionsChange(value: string): void {
    this.save.emit({
      ...this.document(),
      shippingInstructions: value,
      specialFields: {
        ...(this.document().specialFields || {}),
        shippingInstructions: value
      }
    });
  }

  clearDelivery(): void {
    this.save.emit({
      ...this.document(),
      shippingAmount: 0,
      deliveryDiscount: 0,
      deliveryTaxRate: 0,
      shippingInstructions: '',
      specialFields: {
        ...(this.document().specialFields || {}),
        deliveryDate: '',
        carrier: '',
        trackingNumber: '',
        deliveryTerms: '',
        deliveryAddress: '',
        deliveryRecipient: '',
        deliveryCity: '',
        deliveryPostalCode: '',
        deliveryCountry: '',
        showDifferentShipTo: false,
        shippingInstructions: ''
      }
    });
  }

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

  selectedOutputFormat(): string {
    const route = this.config().routeSegment;
    const requested = this.document().specialFields?.['outputFormat'];
    const allowedOutputs: Record<string, string[]> = {
      invoices: ['pdf', 'cii', 'ubl'],
      xfacture: ['factur-x', 'pdf', 'cii', 'ubl'],
      'credit-notes': ['factur-x', 'pdf', 'cii', 'ubl'],
      'order-x': ['order-x', 'pdf']
    };
    if (typeof requested === 'string' && (allowedOutputs[route] || ['pdf']).includes(requested)) {
      return requested;
    }
    if (route === 'xfacture') return 'factur-x';
    if (route === 'order-x') return 'order-x';
    return 'pdf';
  }

  totals = computed(() => {
    const doc = this.document();
    const hasLogistics = this.isLogisticsEnabled();
    const shipping = hasLogistics ? (doc.shippingAmount || 0) : 0;
    const delivDiscount = hasLogistics ? (doc.deliveryDiscount || 0) : 0;
    const delivTaxRate = hasLogistics ? (doc.deliveryTaxRate || 0) : 0;
    return this.calculationService.calculateDocumentTotals(
      doc.items,
      doc.taxRate,
      doc.discountAmount,
      shipping,
      doc.depositPaid,
      doc.discounts,
      delivDiscount,
      delivTaxRate
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

  onSellerCountryChange(country: string): void {
    const existing = this.sellerTaxIdentifiers();
    const taxIdentifiers = existing.length ? existing : getDefaultPartyIdentifierDefinitions(country).map((item, index) => ({
      id: `seller-id-${Date.now()}-${index}`,
      type: item.type,
      label: item.label,
      value: '',
      ...(item.schemeId ? { schemeId: item.schemeId } : {})
    }));
    const company = { ...this.document().company, country, taxIdentifiers };
    this.save.emit({ ...this.document(), company });
    if (this.businessSaveTimer) clearTimeout(this.businessSaveTimer);
    this.businessSaveTimer = setTimeout(() => {
      void this.settingsService.saveRegisteredBusiness(company, this.activeBusinessId).then(profile => {
        this.activeBusinessId = profile.id;
      }).catch(() => {
        // The invoice remains editable if local profile persistence fails.
      });
    }, 600);
  }

  addSellerIdentifier(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const type = select.value;
    select.value = '';
    if (!type) return;
    const definition = this.sellerIdentifierDefinitions().find(item => item.type === type);
    const current = [...this.sellerTaxIdentifiers()];
    this.saveSellerIdentifiers([...current, {
      id: `seller-id-${Date.now()}-${current.length}`,
      type,
      label: definition?.label || type,
      value: '',
      ...(definition?.schemeId ? { schemeId: definition.schemeId } : {})
    }]);
  }

  addCustomSellerIdentifier(): void {
    this.saveSellerIdentifiers([...this.sellerTaxIdentifiers(), { id: `seller-id-${Date.now()}`, type: 'CUSTOM', label: '', value: '', custom: true }]);
  }

  updateSellerIdentifier(id: string, field: 'type' | 'label' | 'value', value: string): void {
    const identifiers = this.sellerTaxIdentifiers().map(item => {
      if (item.id !== id) return item;
      if (field === 'type' && value !== 'CUSTOM') {
        const definition = this.sellerIdentifierDefinitions().find(option => option.type === value);
        return { ...item, type: value, label: definition?.label || value, custom: false, schemeId: definition?.schemeId };
      }
      return { ...item, [field]: value, ...(field === 'label' ? { custom: true } : {}) };
    });
    this.saveSellerIdentifiers(identifiers);
  }

  removeSellerIdentifier(id: string): void {
    this.saveSellerIdentifiers(this.sellerTaxIdentifiers().filter(item => item.id !== id));
  }

  sellerIdentifierOptionsFor(currentType: string): PartyIdentifierDefinition[] {
    const options = this.sellerIdentifierDefinitions();
    return options.some(item => item.type === currentType) ? options : [...options, { type: currentType, label: currentType, category: 'other' as const }];
  }

  private saveSellerIdentifiers(taxIdentifiers: PartyTaxIdentifier[]): void {
    const company = { ...this.document().company, taxIdentifiers };
    const vat = taxIdentifiers.find(item => item.type === 'VAT' && item.value.trim());
    const tax = taxIdentifiers.find(item => ['TAX_ID', 'IF', 'EIN', 'TIN', 'NIF'].includes(item.type) && item.value.trim());
    company.taxId = vat?.value || tax?.value || '';
    this.save.emit({ ...this.document(), company });
    if (this.businessSaveTimer) clearTimeout(this.businessSaveTimer);
    this.businessSaveTimer = setTimeout(() => {
      void this.settingsService.saveRegisteredBusiness(company, this.activeBusinessId).then(profile => {
        this.activeBusinessId = profile.id;
      }).catch(() => {
        // The invoice remains editable if local profile persistence fails.
      });
    }, 600);
  }

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
        taxIdentifiers: client.taxIdentifiers,
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
    this.save.emit({
      ...this.document(),
      company: { ...profile.company }
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

    this.save.emit({
      ...this.document(),
      client: { ...selection.client },
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
      taxIdentifiers: updated.client.taxIdentifiers,
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
      specialFields: {
        ...(current.specialFields || {}),
        transactionNature: 'services',
        paymentMethod: 'bank-transfer',
        iban: 'FR76 3000 6000 0112 3456 7890 189',
        bic: 'BNPAFRPPXXX',
        outputFormat: current.specialFields?.['outputFormat'] || (['xfacture', 'credit-notes'].includes(this.config().routeSegment) ? 'factur-x' : 'pdf')
      }
    };
    this.save.emit(sample);
  }
}
