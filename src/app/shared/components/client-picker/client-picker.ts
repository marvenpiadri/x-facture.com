import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { CountryPickerComponent } from '../country-picker/country-picker';
import { CountryService } from '../../../core/services/country.service';
import { DocumentParty, PartyTaxIdentifier } from '../../../core/models/document.model';
import { getDefaultPartyIdentifierDefinitions, getPartyIdentifierDefinitions, PartyIdentifierDefinition } from '../../../core/config/party-identifier-registry';

@Component({
  selector: 'app-client-picker',
  standalone: true,
  imports: [CommonModule, RouterModule, CountryPickerComponent],
  templateUrl: './client-picker.html',
  styleUrl: './client-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientPickerComponent {
  private clientService = inject(ClientService);
  private countryService = inject(CountryService);

  client = input.required<DocumentParty>();
  clientId = input<string | undefined>(undefined);
  clientChange = output<DocumentParty>();
  clientIdChange = output<string | undefined>();
  clientSelected = output<{ client: DocumentParty; clientId: string }>();

  readonly savedClients = this.clientService.clients;
  readonly identifierDefinitions = computed(() => getPartyIdentifierDefinitions(this.client().country));
  readonly taxIdentifiers = computed<PartyTaxIdentifier[]>(() => {
    const current = this.client().taxIdentifiers || [];
    if (current.length) return current;
    const legacy = this.client().taxId?.trim();
    return legacy ? [{ id: 'legacy-tax-id', type: 'TAX_ID', label: 'Tax / VAT', value: legacy }] : [];
  });

  displayDetails = computed(() => {
    const cl = this.client();
    if (!cl) return '';
    return this.formatMergedPartyDetails(cl);
  });

  onFieldChange(field: keyof DocumentParty, value: string): void {
    this.clientChange.emit({
      ...this.client(),
      [field]: value
    });
  }

  onCountryChange(country: string): void {
    const existing = this.taxIdentifiers();
    const suggested = existing.length ? existing : getDefaultPartyIdentifierDefinitions(country).map((item, index) => ({
      id: `party-id-${Date.now()}-${index}`,
      type: item.type,
      label: item.label,
      value: '',
      ...(item.schemeId ? { schemeId: item.schemeId } : {})
    }));
    this.clientChange.emit({
      ...this.client(),
      country,
      taxIdentifiers: suggested,
      taxId: this.client().taxId || ''
    });
  }

  addIdentifier(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const type = select.value;
    select.value = '';
    if (!type) return;
    const def = this.identifierDefinitions().find(item => item.type === type);
    const current = [...this.taxIdentifiers()];
    const label = def?.label || type;
    const next: PartyTaxIdentifier = { id: `party-id-${Date.now()}-${current.length}`, type, label, value: '', ...(def?.schemeId ? { schemeId: def.schemeId } : {}) };
    this.emitIdentifiers([...current, next]);
  }

  addCustomIdentifier(): void {
    this.emitIdentifiers([...this.taxIdentifiers(), { id: `party-id-${Date.now()}`, type: 'CUSTOM', label: '', value: '', custom: true }]);
  }

  updateIdentifier(id: string, field: 'type' | 'label' | 'value', value: string): void {
    const updated = this.taxIdentifiers().map(item => {
      if (item.id !== id) return item;
      if (field === 'type' && value !== 'CUSTOM') {
        const def = this.identifierDefinitions().find(option => option.type === value);
        return { ...item, type: value, label: def?.label || value, custom: false, schemeId: def?.schemeId };
      }
      return { ...item, [field]: value, ...(field === 'label' ? { custom: true } : {}) };
    });
    this.emitIdentifiers(updated);
  }

  removeIdentifier(id: string): void {
    this.emitIdentifiers(this.taxIdentifiers().filter(item => item.id !== id));
  }

  private emitIdentifiers(taxIdentifiers: PartyTaxIdentifier[]): void {
    const firstVat = taxIdentifiers.find(item => item.type === 'VAT' && item.value.trim());
    const firstTax = taxIdentifiers.find(item => ['TAX_ID', 'IF', 'EIN', 'TIN', 'NIF'].includes(item.type) && item.value.trim());
    this.clientChange.emit({ ...this.client(), taxIdentifiers, taxId: firstVat?.value || firstTax?.value || '' });
  }

  identifierOptionsFor(currentType: string): PartyIdentifierDefinition[] {
    const options = this.identifierDefinitions();
    return options.some(item => item.type === currentType) ? options : [...options, { type: currentType, label: currentType, category: 'other' as const }];
  }

  onDetailsChange(value: string): void {
    this.clientChange.emit({
      ...this.client(),
      address: value
    });
  }

  onSelectExisting(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const clientId = select.value;
    if (!clientId) {
      this.clientIdChange.emit(undefined);
      return;
    }

    const found = this.savedClients().find(c => c.id === clientId);
    if (found) {
      this.clientSelected.emit({
        client: {
          ...this.client(),
          ...found,
          name: found.name || '',
          address: found.address || ''
        },
        clientId: found.id
      });
    }
  }

  private formatMergedPartyDetails(party: {
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    taxId?: string;
    phone?: string;
    email?: string;
    website?: string;
  }): string {
    if (!party) return '';
    const address = (party.address || '').trim();
    const addressLower = address.toLowerCase();
    const lines: string[] = address
      ? address.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
      : [];

    const countryName = party.country ? this.countryService.findByCode(party.country)?.name || party.country : undefined;
    const missingLocation = [party.postalCode, party.city, countryName]
      .filter((part): part is string => Boolean(part?.trim()) && !addressLower.includes(part!.trim().toLowerCase()));
    if (missingLocation.length) lines.push(missingLocation.join(' '));

    if (party.taxId?.trim() && !addressLower.includes(party.taxId.trim().toLowerCase())) lines.push(`Tax / VAT: ${party.taxId.trim()}`);
    const contacts: string[] = [];
    if (party.phone?.trim() && !addressLower.includes(party.phone.trim().toLowerCase())) contacts.push(`Tel: ${party.phone.trim()}`);
    if (party.email?.trim() && !addressLower.includes(party.email.trim().toLowerCase())) contacts.push(`Email: ${party.email.trim()}`);
    if (party.website?.trim() && !addressLower.includes(party.website.trim().toLowerCase())) contacts.push(party.website.trim());
    if (contacts.length) lines.push(contacts.join(' · '));
    return lines.join('\n');
  }
}
