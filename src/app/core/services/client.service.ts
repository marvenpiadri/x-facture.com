import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db, seedInitialDataIfNeeded } from '../db/app-database';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  readonly clients = signal<Client[]>([]);

  constructor() {
    if (this.isBrowser) {
      this.loadClients();
    }
  }

  async loadClients(): Promise<Client[]> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      return [];
    }
    try {
      await seedInitialDataIfNeeded();
      const list = await db.clients.orderBy('name').toArray();
      this.clients.set(list);
      return list;
    } catch {
      return [];
    }
  }

  async getClientById(id: string): Promise<Client | undefined> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') return undefined;
    try {
      return await db.clients.get(id);
    } catch {
      return undefined;
    }
  }

  async getClientBySlug(slug: string): Promise<Client | undefined> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') return undefined;
    try {
      const cleaned = slug.trim().toLowerCase();
      const all = await db.clients.toArray();
      return all.find(c => c.slug.toLowerCase() === cleaned || c.id === slug);
    } catch {
      return undefined;
    }
  }

  async saveClient(client: Partial<Client>): Promise<Client> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      throw new Error('Client storage is unavailable outside the browser.');
    }
    const name = (client.name || 'New Client').trim();
    const slug = (client.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    const now = new Date().toISOString();

    const fullClient: Client = {
      id: client.id || `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      slug,
      name,
      companyName: client.companyName || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      postalCode: client.postalCode || '',
      country: client.country || '',
      taxId: client.taxId || '',
      defaultCurrency: client.defaultCurrency || '',
      defaultTaxRate: client.defaultTaxRate ?? 0,
      notes: client.notes || '',
      createdAt: client.createdAt || now,
      updatedAt: now
    };

    await db.clients.put(fullClient);
    await this.loadClients();
    return fullClient;
  }

  async deleteClient(id: string): Promise<void> {
    if (!this.isBrowser || typeof indexedDB === 'undefined') {
      throw new Error('Client storage is unavailable outside the browser.');
    }
    await db.clients.delete(id);
    await this.loadClients();
  }
}
