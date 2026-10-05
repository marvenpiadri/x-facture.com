import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClientService } from '../../../../core/services/client.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { DocumentService } from '../../../../core/services/document.service';
import { Client } from '../../../../core/models/client.model';

@Component({
  selector: 'app-clients-hub',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clients-hub.html',
  styleUrl: './clients-hub.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientsHubPage {
  private clientService = inject(ClientService);
  private currencyService = inject(CurrencyService);
  private documentService = inject(DocumentService);
  private router = inject(Router);

  readonly clients = this.clientService.clients;
  readonly allDocs = this.documentService.documents;

  searchQuery = signal<string>('');
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  activeClient: Partial<Client> = this.getBlankClient();

  filteredClients = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.clients();
    return this.clients().filter(c => c.name.toLowerCase().includes(q));
  });

  formatCurrency(val: number, curr?: string): string {
    return this.currencyService.format(val, curr);
  }

  getBlankClient(): Partial<Client> {
    return {
      name: '',
      address: '',
      defaultCurrency: '',
      defaultTaxRate: 0,
      notes: ''
    };
  }

  openAddModal(): void {
    this.activeClient = this.getBlankClient();
    this.isEditing.set(false);
    this.showModal.set(true);
  }

  openEditModal(client: Client, event: Event): void {
    event.stopPropagation();
    this.activeClient = { ...client };
    this.isEditing.set(true);
    this.showModal.set(true);
  }

  async saveClient(): Promise<void> {
    if (!this.activeClient.name?.trim()) return;

    await this.clientService.saveClient(this.activeClient);
    this.showModal.set(false);
  }

  async deleteClient(client: Client, event: Event): Promise<void> {
    event.stopPropagation();
    if (confirm(`Delete client "${client.name}"?`)) {
      await this.clientService.deleteClient(client.id);
    }
  }

  async createInvoiceForClient(client: Client, event: Event): Promise<void> {
    event.stopPropagation();
    const newDoc = await this.documentService.createDraft('invoices');
    newDoc.clientId = client.id;
    newDoc.client = {
      name: client.name || '',
      address: client.address || ''
    };
    newDoc.currency = client.defaultCurrency || '';
    await this.documentService.saveDocument(newDoc);
    this.router.navigate([`/${newDoc.docType}/${newDoc.docNumber}/edit`]);
  }
}
