import Dexie, { Table } from 'dexie';
import { BusinessDocument } from '../models/document.model';
import { Client } from '../models/client.model';
import { Product } from '../models/product.model';
import { RegisterSession, PosSale } from '../models/pos.model';
import { LedgerEntry } from '../models/ledger.model';
import { BusinessProfileSettings } from '../models/settings.model';

export class AppDatabase extends Dexie {
  documents!: Table<BusinessDocument, string>;
  clients!: Table<Client, string>;
  products!: Table<Product, string>;
  posSessions!: Table<RegisterSession, string>;
  posSales!: Table<PosSale, string>;
  ledgerEntries!: Table<LedgerEntry, string>;
  settings!: Table<BusinessProfileSettings, string>;

  constructor() {
    super('XFactureBusinessDB');

    // Schema definition — version 1
    this.version(1).stores({
      documents: 'id, docNumber, slug, docType, status, issueDate, dueDate, clientId, createdAt, updatedAt',
      clients: 'id, slug, name, email, companyName, createdAt',
      products: 'id, slug, sku, name, category, isArchived, createdAt',
      posSessions: 'id, sessionNumber, status, openedAt, closedAt',
      posSales: 'id, receiptNumber, sessionId, date, docId',
      ledgerEntries: 'id, date, type, category, docId, docNumber, status, createdAt',
      settings: 'id'
    });
  }
}

export const db = new AppDatabase();

export const DEFAULT_BUSINESS_SETTINGS: BusinessProfileSettings = {
  id: 'current',
  company: {
    name: '',
    legalName: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    taxId: '',
    logoUrl: '',
    bankDetails: ''
  },
  registeredBusinesses: [],
  defaultCurrency: '',
  defaultTaxRate: 0,
  defaultPaymentTerms: '',
  defaultFormalTemplate: 'modern',
  defaultReceiptTemplate: 'thermal-80mm',
  paperSize: 'a4',
  prefixes: {
    'invoices': { prefix: 'INV', nextNumber: 1001, padding: 4 },
    'proforma-invoices': { prefix: 'PRO', nextNumber: 101, padding: 4 },
    'commercial-invoices': { prefix: 'COM', nextNumber: 201, padding: 4 },
    'quotes': { prefix: 'QUO', nextNumber: 501, padding: 4 },
    'purchase-orders': { prefix: 'PO', nextNumber: 301, padding: 4 },
    'receipts': { prefix: 'RCT', nextNumber: 2001, padding: 4 },
    'credit-notes': { prefix: 'CRN', nextNumber: 101, padding: 4 },
    'delivery-notes': { prefix: 'DLV', nextNumber: 401, padding: 4 },
    'timesheet-invoices': { prefix: 'TSH', nextNumber: 101, padding: 4 },
    'work-orders': { prefix: 'WO', nextNumber: 101, padding: 4 },
    'statements': { prefix: 'STMT', nextNumber: 101, padding: 4 },
    'service-agreements': { prefix: 'SA', nextNumber: 101, padding: 4 },
    'retainer-invoices': { prefix: 'RET', nextNumber: 101, padding: 4 },
    'bills-of-lading': { prefix: 'BOL', nextNumber: 101, padding: 4 },
    'custom-documents': { prefix: 'DOC', nextNumber: 101, padding: 4 }
  },
  updatedAt: new Date().toISOString()
};

/**
 * Initialize local storage without creating fictional business, client, product,
 * document, or ledger data. Users must enter their own information.
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') return;

  try {
    const existingSettings = await db.settings.get('current');

    if (!existingSettings) {
      await db.settings.put({
        ...DEFAULT_BUSINESS_SETTINGS,
        updatedAt: new Date().toISOString()
      });
    }

    // Remove only the sample records shipped by older versions of x-facture.
    // User-created records are never cleared by this migration.
    await Promise.all([
      db.clients.bulkDelete(['client-acme', 'client-lumina', 'client-globex']),
      db.products.bulkDelete([
        'prod-consult-dev',
        'prod-ui-design',
        'prod-hardware-terminal',
        'prod-retainer-tier1',
        'prod-retail-merch',
        'prod-store-tote'
      ]),
      db.documents.bulkDelete(['doc-sample-inv-01', 'doc-sample-quo-01']),
      db.ledgerEntries.bulkDelete(['ledg-sample-1'])
    ]);

    const current = await db.settings.get('current');
    if (current?.company?.name === 'x-facture Studio SARL' && current.company.taxId === 'US-94-3829104') {
      await db.settings.put({
        ...current,
        company: { ...DEFAULT_BUSINESS_SETTINGS.company },
        registeredBusinesses: [],
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to initialize local database:', error);
  }
}
