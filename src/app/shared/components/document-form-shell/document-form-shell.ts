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
import { Router, RouterModule } from '@angular/router';
import { BusinessDocument, DocumentLineItem, DocumentParty, LineLayoutMode } from '../../../core/models/document.model';
import { DocumentTypeConfig } from '../../../core/models/document-type-config.model';
import { CurrencyService } from '../../../core/services/currency.service';
import { CalculationService } from '../../../core/services/calculation.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ClientService } from '../../../core/services/client.service';
import { LineItemsTableComponent } from '../line-items-table/line-items-table';
import { ClientPickerComponent } from '../client-picker/client-picker';

@Component({
  selector: 'app-document-form-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LineItemsTableComponent,
    ClientPickerComponent
  ],
  templateUrl: './document-form-shell.html',
  styleUrl: './document-form-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentFormShellComponent {
  private router = inject(Router);
  private currencyService = inject(CurrencyService);
  private calculationService = inject(CalculationService);
  private settingsService = inject(SettingsService);
  private clientService = inject(ClientService);
  private clientSaveTimer: ReturnType<typeof setTimeout> | undefined;
  private activeBusinessId: string | undefined;
  private businessSaveTimer: ReturnType<typeof setTimeout> | undefined;

  // Inputs
  document = input.required<BusinessDocument>();
  config = input.required<DocumentTypeConfig>();
  isNew = input<boolean>(false);

  // Outputs
  save = output<BusinessDocument>();
  saveAndPreview = output<BusinessDocument>();

  readonly availableCurrencies = this.currencyService.CURRENCIES;
  readonly registeredBusinesses = computed(() => this.settingsService.settings()?.registeredBusinesses || []);
  readonly selectedBusinessId = computed(() => this.activeBusinessId || this.registeredBusinesses().find(b => b.company.name === this.document().company.name && b.company.address === this.document().company.address)?.id || '');

  currencySymbol = computed(() => {
    return this.currencyService.getSymbol(this.document().currency);
  });

  // Calculation summaries live
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
    const updated: BusinessDocument = {
      ...this.document(),
      [field]: value
    };
    this.save.emit(updated);
  }

  onClientChange(client: DocumentParty): void {
    const updated: BusinessDocument = {
      ...this.document(),
      client
    };
    this.save.emit(updated);

    // Remember the client locally so future documents can reuse the details.
    // Debounce writes while the user is typing to avoid a database write per keystroke.
    if (this.clientSaveTimer) {
      clearTimeout(this.clientSaveTimer);
    }

    if (!client.name?.trim()) {
      return;
    }

    this.clientSaveTimer = setTimeout(() => {
      void this.clientService.saveClient({
        id: updated.clientId,
        name: client.name.trim(),
        companyName: client.legalName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.postalCode || '',
        country: client.country || '',
        taxId: client.taxId || ''
      }).then(saved => {
        if (updated.clientId !== saved.id) {
          this.save.emit({
            ...updated,
            clientId: saved.id
          });
        }
      }).catch(() => {
        // The document remains editable even if local client persistence fails.
      });
    }, 600);
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
        // The document remains editable even if local profile persistence fails.
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
    const updated: BusinessDocument = {
      ...this.document(),
      company: {
        name: profile.company.name || '',
        address: profile.company.address || ''
      }
    };
    this.save.emit(updated);
    void this.settingsService.selectRegisteredBusiness(profile.id).catch(() => {
      // The selected company remains applied to the current document.
    });
  }

  onSavedClientSelect(selection: { client: DocumentParty; clientId: string }): void {
    if (this.clientSaveTimer) {
      clearTimeout(this.clientSaveTimer);
      this.clientSaveTimer = undefined;
    }

    const updated: BusinessDocument = {
      ...this.document(),
      client: {
        name: selection.client.name || '',
        address: selection.client.address || ''
      },
      clientId: selection.clientId
    };
    this.save.emit(updated);
  }

  onClientIdChange(clientId: string | undefined): void {
    if (this.clientSaveTimer) {
      clearTimeout(this.clientSaveTimer);
      this.clientSaveTimer = undefined;
    }

    const updated: BusinessDocument = {
      ...this.document(),
      clientId
    };
    this.save.emit(updated);

    if (!clientId || !updated.client.name?.trim()) return;

    void this.clientService.saveClient({
      id: clientId,
      name: updated.client.name.trim(),
      companyName: updated.client.legalName || '',
      email: updated.client.email || '',
      phone: updated.client.phone || '',
      address: updated.client.address || '',
      city: updated.client.city || '',
      postalCode: updated.client.postalCode || '',
      country: updated.client.country || '',
      taxId: updated.client.taxId || ''
    }).catch(() => {
      // The selected client remains applied to the current document.
    });
  }

  onItemsChange(items: DocumentLineItem[]): void {
    const updated: BusinessDocument = {
      ...this.document(),
      items
    };
    this.save.emit(updated);
  }

  onLineLayoutModeChange(mode: LineLayoutMode): void {
    const updated: BusinessDocument = {
      ...this.document(),
      lineLayoutMode: mode
    };
    this.save.emit(updated);
  }

  onTotalsModifierChange(field: 'taxRate' | 'discountAmount' | 'shippingAmount' | 'depositPaid', value: any): void {
    const num = Math.max(0, Number(value) || 0);
    const updated: BusinessDocument = {
      ...this.document(),
      [field]: num
    };
    this.save.emit(updated);
  }

  triggerSave(): void {
    this.save.emit(this.document());
  }

  triggerSaveAndPreview(): void {
    this.saveAndPreview.emit(this.document());
  }
}
