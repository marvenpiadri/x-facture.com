import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { CountryPickerComponent } from '../country-picker/country-picker';
import { CountryService } from '../../../core/services/country.service';
import { DocumentParty } from '../../../core/models/document.model';

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
      const mergedAddress = this.formatMergedPartyDetails(found);
      this.clientSelected.emit({
        client: {
          ...this.client(),
          ...found,
          name: found.name || '',
          address: mergedAddress
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
