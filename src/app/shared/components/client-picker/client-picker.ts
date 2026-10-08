import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { DocumentParty } from '../../../core/models/document.model';
import { CountryPickerComponent } from '../country-picker/country-picker';

@Component({
  selector: 'app-client-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CountryPickerComponent],
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

  onFieldChange(field: keyof DocumentParty, value: string): void {
    this.clientChange.emit({
      ...this.client(),
      [field]: value
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
          name: found.name || '',
          address: found.address || ''
        },
        clientId: found.id
      });
    }
  }
}
