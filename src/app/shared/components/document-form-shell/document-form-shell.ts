import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BusinessDocument, DocumentLineItem, DocumentParty, LineLayoutMode } from '../../../core/models/document.model';
import { DocumentTypeConfig } from '../../../core/models/document-type-config.model';
import { getCreatePageContent } from '../../../core/config/document-create-content';
import { CurrencyService } from '../../../core/services/currency.service';
import { CalculationService } from '../../../core/services/calculation.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ClientService } from '../../../core/services/client.service';
import { LineItemsTableComponent } from '../line-items-table/line-items-table';
import { ClientPickerComponent } from '../client-picker/client-picker';
import { CountryPickerComponent } from '../country-picker/country-picker';

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
export class DocumentFormShellComponent {
  private currencyService = inject(CurrencyService);
  private calculationService = inject(CalculationService);
  private settingsService = inject(SettingsService);
  private clientService = inject(ClientService);
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

  totals = computed(() => {
    const doc = this.document();
    return this.calculationService.calculateDocumentTotals(
      doc.items,
      doc.taxRate,
      doc.discountAmount,
      doc.shippingAmount,
      doc.depositPaid
    );
  });

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

  onSpecialFieldChange(field: string, value: string): void {
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
}
