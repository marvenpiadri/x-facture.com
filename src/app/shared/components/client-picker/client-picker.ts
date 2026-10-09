import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { DocumentParty } from '../../../core/models/document.model';

@Component({
  selector: 'app-client-picker',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-picker.html',
  styleUrl: './client-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientPickerComponent {
  private clientService = inject(ClientService);

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
    const addr = (party.address || '').trim();
    if (addr.includes('\n')) {
      return addr;
    }

    const lines: string[] = [];
    if (addr) {
      lines.push(addr);
    }

    const locParts = [party.postalCode, party.city, party.country].filter(Boolean);
    if (locParts.length > 0) {
      const locStr = locParts.join(' ');
      if (!addr || !addr.toLowerCase().includes((party.city || '').toLowerCase())) {
        lines.push(locStr);
      }
    }

    if (party.taxId?.trim() && (!addr || !addr.includes(party.taxId))) {
      lines.push(`Tax / VAT: ${party.taxId.trim()}`);
    }

    const contacts: string[] = [];
    if (party.phone?.trim() && (!addr || !addr.includes(party.phone))) {
      contacts.push(`Tel: ${party.phone.trim()}`);
    }
    if (party.email?.trim() && (!addr || !addr.includes(party.email))) {
      contacts.push(`Email: ${party.email.trim()}`);
    }
    if (party.website?.trim() && (!addr || !addr.includes(party.website))) {
      contacts.push(party.website.trim());
    }
    if (contacts.length > 0) {
      lines.push(contacts.join(' · '));
    }

    return lines.join('\n');
  }
}
