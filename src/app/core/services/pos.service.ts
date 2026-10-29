import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { db } from '../db/app-database';
import {
  CartDiscount,
  HeldOrder,
  PosCartItem,
  PosPaymentRecord,
  PosSale,
  RegisterReport,
  RegisterSession
} from '../models/pos.model';
import { Product } from '../models/product.model';
import { Client } from '../models/client.model';
import { LedgerEntry } from '../models/ledger.model';
import { BusinessDocument } from '../models/document.model';
import { SettingsService } from './settings.service';
import { ProductService } from './product.service';
import { CalculationService } from './calculation.service';
import { computeCartTotals, localDateString, localTimeString, roundMoney, toDocumentItems } from '../utils/pos-math';

export interface CheckoutResult {
  doc: BusinessDocument;
  sale: PosSale;
  changeDue: number;
}

export interface CustomItemInput {
  name: string;
  unitCost: number;
  taxRate: number;
  quantity?: number;
}

const NO_DISCOUNT: CartDiscount = { type: 'percent', value: 0 };

@Injectable({
  providedIn: 'root'
})
export class PosService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private settingsService = inject(SettingsService);
  private productService = inject(ProductService);
  private calc = inject(CalculationService);

  readonly currency = computed(() => this.settingsService.settings()?.defaultCurrency || 'USD');

  readonly currentSession = signal<RegisterSession | null>(null);
  readonly cart = signal<PosCartItem[]>([]);
  readonly discount = signal<CartDiscount>(NO_DISCOUNT);
  readonly note = signal<string>('');
  readonly customer = signal<Client | null>(null);
  readonly heldOrders = signal<HeldOrder[]>([]);
  readonly recentSales = signal<PosSale[]>([]);
  readonly isProcessing = signal<boolean>(false);

  readonly totals = computed(() => computeCartTotals(this.cart(), this.discount(), this.calc));

  constructor() {
    if (this.isBrowser) {
      void this.restoreActiveSession();
      void this.loadHeldOrders();
      void this.loadRecentSales();
    }
  }

  private get storageReady(): boolean {
    return this.isBrowser && typeof indexedDB !== 'undefined';
  }

  private requireStorage(): void {
    if (!this.storageReady) throw new Error('POS storage is unavailable outside the browser.');
  }

  // ---------------------------------------------------------------------------
  // Register sessions
  // ---------------------------------------------------------------------------

  async restoreActiveSession(): Promise<RegisterSession | null> {
    if (!this.storageReady) {
      this.currentSession.set(null);
      return null;
    }
    try {
      const openSessions = await db.posSessions.where('status').equals('open').toArray();
      const active = openSessions[0] ?? null;
      this.currentSession.set(active);
      return active;
    } catch {
      this.currentSession.set(null);
      return null;
    }
  }

  async openSession(cashierName: string, startingFloat: number): Promise<RegisterSession> {
    this.requireStorage();
    if (this.currentSession()) throw new Error('A register session is already open.');
    const sessionCount = await db.posSessions.count();
    const sessionNumber = `SESS-${new Date().getFullYear()}-${String(sessionCount + 1).padStart(4, '0')}`;
    const float = Number.isFinite(startingFloat) ? Math.max(0, roundMoney(startingFloat)) : 0;

    const newSession: RegisterSession = {
      id: `sess-${Date.now()}`,
      sessionNumber,
      cashierName: cashierName.trim() || 'Store Clerk',
      openedAt: new Date().toISOString(),
      status: 'open',
      startingFloat: float,
      cashSales: 0,
      cardSales: 0,
      otherSales: 0,
      cashRefunds: 0,
      refundsTotal: 0,
      taxTotal: 0,
      discountTotal: 0,
      salesCount: 0,
      expectedCash: float,
      xReports: []
    };

    await db.posSessions.put(newSession);
    this.currentSession.set(newSession);
    return newSession;
  }

  private buildReport(session: RegisterSession, type: RegisterReport['type']): RegisterReport {
    return {
      timestamp: new Date().toISOString(),
      type,
      cashierName: session.cashierName,
      startingFloat: session.startingFloat,
      totalSales: roundMoney(session.cashSales + session.cardSales + session.otherSales),
      salesCount: session.salesCount,
      byPaymentMethod: { cash: session.cashSales, card: session.cardSales, other: session.otherSales },
      totalRefunds: session.refundsTotal ?? session.cashRefunds,
      taxTotal: session.taxTotal ?? 0,
      discountTotal: session.discountTotal ?? 0,
      expectedCash: roundMoney(session.startingFloat + session.cashSales - session.cashRefunds)
    };
  }

  /** Mid-shift summary that does not close the register. */
  async generateXReport(): Promise<RegisterReport> {
    this.requireStorage();
    const session = this.currentSession();
    if (!session) throw new Error('No active register session');

    const report = this.buildReport(session, 'X-Report');
    const updated: RegisterSession = { ...session, xReports: [...(session.xReports || []), report] };
    await db.posSessions.put(updated);
    this.currentSession.set(updated);
    return report;
  }

  /** Close the register with a Z-report and cash reconciliation. */
  async closeSession(actualCashCounted: number, notes?: string): Promise<RegisterReport> {
    this.requireStorage();
    const session = this.currentSession();
    if (!session) throw new Error('No active register session');

    const expected = roundMoney(session.startingFloat + session.cashSales - session.cashRefunds);
    const actual = Math.max(0, roundMoney(actualCashCounted));
    const discrepancy = roundMoney(actual - expected); // positive = overage, negative = shortage

    const zReport: RegisterReport = {
      ...this.buildReport(session, 'Z-Report'),
      expectedCash: expected,
      actualCash: actual,
      discrepancy
    };

    const closed: RegisterSession = {
      ...session,
      closedAt: new Date().toISOString(),
      status: 'closed',
      expectedCash: expected,
      actualCashCounted: actual,
      discrepancy,
      zReport,
      notes
    };

    await db.posSessions.put(closed);
    this.currentSession.set(null);
    this.clearCart();
    return zReport;
  }

  // ---------------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------------

  private withAmount(item: PosCartItem): PosCartItem {
    return {
      ...item,
      amount: this.calc.calculateLineAmount(item.unitCost, item.quantity, item.discountPercent)
    };
  }

  addToCart(product: Product, quantity = 1): void {
    const current = this.cart();
    const index = current.findIndex(item => item.productId === product.id && !item.isCustom);

    if (index > -1) {
      const updated = [...current];
      updated[index] = this.withAmount({ ...updated[index], quantity: updated[index].quantity + quantity });
      this.cart.set(updated);
      return;
    }

    this.cart.set([
      ...current,
      this.withAmount({
        productId: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        unitCost: product.unitCost,
        quantity,
        taxRate: product.taxRate || 0,
        discountPercent: 0,
        amount: 0
      })
    ]);
  }

  /** Open-price item for things that are not in the catalog. */
  addCustomItem(input: CustomItemInput): void {
    const name = input.name.trim() || 'Custom item';
    this.cart.set([
      ...this.cart(),
      this.withAmount({
        productId: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name,
        unitCost: Math.max(0, Number.isFinite(input.unitCost) ? input.unitCost : 0),
        quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
        taxRate: Math.max(0, Number.isFinite(input.taxRate) ? input.taxRate : 0),
        discountPercent: 0,
        amount: 0,
        isCustom: true
      })
    ]);
  }

  setQuantity(index: number, quantity: number): void {
    const current = [...this.cart()];
    if (!current[index]) return;
    if (!Number.isFinite(quantity) || quantity <= 0) {
      current.splice(index, 1);
    } else {
      current[index] = this.withAmount({ ...current[index], quantity });
    }
    this.cart.set(current);
  }

  setLineDiscount(index: number, percent: number): void {
    const current = [...this.cart()];
    if (!current[index]) return;
    const clamped = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
    current[index] = this.withAmount({ ...current[index], discountPercent: clamped });
    this.cart.set(current);
  }

  setLineNote(index: number, note: string): void {
    const current = [...this.cart()];
    if (!current[index]) return;
    current[index] = { ...current[index], note: note.trim() || undefined };
    this.cart.set(current);
  }

  removeItem(index: number): void {
    const current = [...this.cart()];
    current.splice(index, 1);
    this.cart.set(current);
  }

  setDiscount(discount: CartDiscount): void {
    const value = Number.isFinite(discount.value) ? Math.max(0, discount.value) : 0;
    this.discount.set({ type: discount.type, value: discount.type === 'percent' ? Math.min(100, value) : value });
  }

  setNote(note: string): void {
    this.note.set(note);
  }

  setCustomer(client: Client | null): void {
    this.customer.set(client);
  }

  clearCart(): void {
    this.cart.set([]);
    this.discount.set(NO_DISCOUNT);
    this.note.set('');
    this.customer.set(null);
  }

  // ---------------------------------------------------------------------------
  // Held (parked) orders
  // ---------------------------------------------------------------------------

  async loadHeldOrders(): Promise<void> {
    if (!this.storageReady) return;
    try {
      this.heldOrders.set(await db.posHeldOrders.orderBy('createdAt').reverse().toArray());
    } catch {
      this.heldOrders.set([]);
    }
  }

  async holdCurrentOrder(label?: string): Promise<HeldOrder> {
    this.requireStorage();
    const items = this.cart();
    if (items.length === 0) throw new Error('Cart is empty');

    const now = new Date();
    const customer = this.customer();
    const order: HeldOrder = {
      id: `held-${now.getTime()}-${Math.random().toString(36).slice(2, 5)}`,
      label: label?.trim() || `${customer?.name ?? 'Order'} · ${localTimeString(now)}`,
      createdAt: now.toISOString(),
      items,
      discount: this.discount(),
      note: this.note(),
      clientId: customer?.id,
      clientName: customer?.name
    };
    await db.posHeldOrders.put(order);
    this.heldOrders.set([order, ...this.heldOrders()]);
    this.clearCart();
    return order;
  }

  async recallHeldOrder(id: string): Promise<void> {
    this.requireStorage();
    if (this.cart().length > 0) throw new Error('Hold or clear the current sale before recalling another.');
    const order = this.heldOrders().find(o => o.id === id);
    if (!order) return;

    const client = order.clientId ? await db.clients.get(order.clientId) : undefined;
    this.cart.set(order.items);
    this.discount.set(order.discount);
    this.note.set(order.note);
    this.customer.set(client ?? null);
    await this.deleteHeldOrder(id);
  }

  async deleteHeldOrder(id: string): Promise<void> {
    if (!this.storageReady) return;
    await db.posHeldOrders.delete(id);
    this.heldOrders.set(this.heldOrders().filter(o => o.id !== id));
  }

  // ---------------------------------------------------------------------------
  // Sales history
  // ---------------------------------------------------------------------------

  async loadRecentSales(limit = 40): Promise<void> {
    if (!this.storageReady) return;
    try {
      const rows = await db.posSales.orderBy('date').reverse().limit(limit * 3).toArray();
      rows.sort((a, b) => `${b.date} ${b.time} ${b.id}`.localeCompare(`${a.date} ${a.time} ${a.id}`));
      this.recentSales.set(rows.slice(0, limit));
    } catch {
      this.recentSales.set([]);
    }
  }

  // ---------------------------------------------------------------------------
  // Checkout
  // ---------------------------------------------------------------------------

  /**
   * Completes the sale in ONE database transaction: receipt document, sale record,
   * register totals, ledger entry, stock decrement and receipt numbering either all
   * succeed or none do.
   */
  async checkout(payments: PosPaymentRecord[]): Promise<CheckoutResult> {
    this.requireStorage();
    if (this.isProcessing()) throw new Error('A sale is already being processed.');
    const session = this.currentSession();
    if (!session) throw new Error('Please open the register first.');

    const items = this.cart();
    if (items.length === 0) throw new Error('Cart is empty');

    const totals = this.totals();
    const paid = roundMoney(payments.reduce((sum, p) => sum + p.amount, 0));
    if (paid + 0.004 < totals.total) throw new Error('Payments do not cover the total.');

    this.isProcessing.set(true);
    try {
      const settings = await this.settingsService.loadSettings(); // seeds defaults before the transaction
      const customer = this.customer();
      const note = this.note();
      const now = new Date();
      const dateStr = localDateString(now);
      const timeStr = localTimeString(now);
      const changeDue = roundMoney(payments.reduce((sum, p) => sum + (p.changeDue ?? 0), 0));
      const currency = settings.defaultCurrency || 'USD';

      const result = await db.transaction(
        'rw',
        [db.documents, db.posSales, db.posSessions, db.ledgerEntries, db.settings, db.products],
        async (): Promise<CheckoutResult & { session: RegisterSession }> => {
          const fresh = await db.posSessions.get(session.id);
          if (!fresh || fresh.status !== 'open') throw new Error('The register session is no longer open.');

          // Reserve the next receipt number atomically with the sale itself.
          const stored = await db.settings.get('current');
          if (!stored) throw new Error('Business settings are missing.');
          const prefix = stored.prefixes['receipts'] ?? { prefix: 'RCT', nextNumber: 2001, padding: 4 };
          const receiptNumber = `${prefix.prefix}-${now.getFullYear()}-${String(prefix.nextNumber).padStart(prefix.padding, '0')}`;
          await db.settings.put({
            ...stored,
            prefixes: { ...stored.prefixes, receipts: { ...prefix, nextNumber: prefix.nextNumber + 1 } },
            updatedAt: now.toISOString()
          });

          const receiptDoc: BusinessDocument = {
            id: `doc-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
            docNumber: receiptNumber,
            slug: receiptNumber.toLowerCase(),
            docType: 'receipts',
            docTypeLabel: 'Sales Receipt',
            title: 'Counter Store Sale',
            status: 'completed',
            currency,
            issueDate: dateStr,
            company: { ...stored.company },
            client: customer
              ? {
                  name: customer.name,
                  legalName: customer.legalName,
                  email: customer.email,
                  phone: customer.phone,
                  address: customer.address,
                  city: customer.city,
                  postalCode: customer.postalCode,
                  country: customer.country,
                  taxId: customer.taxId,
                  taxIdentifiers: customer.taxIdentifiers
                }
              : { name: 'Walk-in Customer' },
            clientId: customer?.id,
            lineLayoutMode: 'flatRate',
            templateId: stored.defaultReceiptTemplate || 'thermal-80mm',
            paperSize: stored.defaultReceiptTemplate === 'thermal-58mm' ? 'thermal-58mm' : 'thermal-80mm',
            hasPricing: true,
            items: toDocumentItems(items),
            subtotal: totals.subtotal,
            taxRate: 0,
            taxAmount: totals.taxAmount,
            discountAmount: totals.discountAmount,
            shippingAmount: 0,
            total: totals.total,
            depositPaid: totals.total,
            balanceDue: 0,
            notes: note || 'Payment completed. Thank you for your purchase!',
            terms: 'All retail sales final. Receipt required for exchange within 14 days.',
            specialFields: {
              cashier: fresh.cashierName,
              sessionId: fresh.id,
              payments,
              changeDue
            },
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
          };
          await db.documents.put(receiptDoc);

          const sale: PosSale = {
            id: `sale-${now.getTime()}-${Math.random().toString(36).slice(2, 5)}`,
            receiptNumber,
            sessionId: fresh.id,
            date: dateStr,
            time: timeStr,
            cashierName: fresh.cashierName,
            items: [...items],
            subtotal: totals.subtotal,
            taxRate: 0,
            taxAmount: totals.taxAmount,
            discountAmount: totals.discountAmount,
            total: totals.total,
            payments,
            notes: note,
            docId: receiptDoc.id,
            clientId: customer?.id,
            clientName: customer?.name,
            status: 'completed'
          };
          await db.posSales.put(sale);

          // Stock: re-read each product inside the transaction so counts never go stale.
          const quantities = new Map<string, number>();
          for (const item of items) {
            if (!item.isCustom) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
          }
          const products = await db.products.bulkGet([...quantities.keys()]);
          for (const product of products) {
            if (product?.trackStock) {
              await db.products.put({
                ...product,
                stockQty: (product.stockQty ?? 0) - (quantities.get(product.id) ?? 0),
                updatedAt: now.toISOString()
              });
            }
          }

          const tender = (method: PosPaymentRecord['method']): number =>
            roundMoney(payments.filter(p => p.method === method).reduce((sum, p) => sum + p.amount, 0));
          const cashSales = roundMoney(fresh.cashSales + tender('cash'));
          const updatedSession: RegisterSession = {
            ...fresh,
            cashSales,
            cardSales: roundMoney(fresh.cardSales + tender('card')),
            otherSales: roundMoney(fresh.otherSales + tender('other')),
            salesCount: fresh.salesCount + 1,
            taxTotal: roundMoney((fresh.taxTotal ?? 0) + totals.taxAmount),
            discountTotal: roundMoney((fresh.discountTotal ?? 0) + totals.discountAmount),
            expectedCash: roundMoney(fresh.startingFloat + cashSales - fresh.cashRefunds)
          };
          await db.posSessions.put(updatedSession);

          const ledgerEntry: LedgerEntry = {
            id: `ledg-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
            date: dateStr,
            description: `POS Sale #${receiptNumber} (${fresh.cashierName})`,
            category: 'POS Store Sale',
            type: 'income',
            amount: totals.total,
            currency,
            paymentMethod: [...new Set(payments.map(p => p.method))].join(', ') || 'cash',
            status: 'cleared',
            docId: receiptDoc.id,
            docNumber: receiptNumber,
            docType: 'receipts',
            clientId: customer?.id,
            clientName: customer?.name,
            sessionId: fresh.id,
            createdAt: now.toISOString()
          };
          await db.ledgerEntries.put(ledgerEntry);

          return { doc: receiptDoc, sale, changeDue, session: updatedSession };
        }
      );

      this.currentSession.set(result.session);
      this.clearCart();
      await Promise.all([this.settingsService.loadSettings(), this.productService.loadProducts(), this.loadRecentSales()]);
      return { doc: result.doc, sale: result.sale, changeDue: result.changeDue };
    } finally {
      this.isProcessing.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Refunds
  // ---------------------------------------------------------------------------

  /**
   * Full refund of a completed sale. Refunds are paid out of the *current* open drawer,
   * restore stock, void the receipt and post a matching expense to the ledger.
   */
  async refundSale(saleId: string, reason?: string): Promise<void> {
    this.requireStorage();
    if (this.isProcessing()) throw new Error('Another operation is in progress.');
    const session = this.currentSession();
    if (!session) throw new Error('Open the register to process a refund.');

    this.isProcessing.set(true);
    try {
      const now = new Date();
      const updatedSession = await db.transaction(
        'rw',
        [db.posSales, db.posSessions, db.ledgerEntries, db.documents, db.products],
        async (): Promise<RegisterSession> => {
          const sale = await db.posSales.get(saleId);
          if (!sale) throw new Error('Sale not found.');
          if (sale.status === 'refunded') throw new Error('This sale has already been refunded.');
          const fresh = await db.posSessions.get(session.id);
          if (!fresh || fresh.status !== 'open') throw new Error('The register session is no longer open.');

          const quantities = new Map<string, number>();
          for (const item of sale.items) {
            if (!item.isCustom) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
          }
          const products = await db.products.bulkGet([...quantities.keys()]);
          for (const product of products) {
            if (product?.trackStock) {
              await db.products.put({
                ...product,
                stockQty: (product.stockQty ?? 0) + (quantities.get(product.id) ?? 0),
                updatedAt: now.toISOString()
              });
            }
          }

          if (sale.docId) {
            const doc = await db.documents.get(sale.docId);
            if (doc) await db.documents.put({ ...doc, status: 'void', updatedAt: now.toISOString() });
          }

          const cashPortion = roundMoney(
            sale.payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0)
          );
          const cashRefunds = roundMoney(fresh.cashRefunds + cashPortion);
          const next: RegisterSession = {
            ...fresh,
            cashRefunds,
            refundsTotal: roundMoney((fresh.refundsTotal ?? 0) + sale.total),
            expectedCash: roundMoney(fresh.startingFloat + fresh.cashSales - cashRefunds)
          };
          await db.posSessions.put(next);

          await db.ledgerEntries.put({
            id: `ledg-${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
            date: localDateString(now),
            description: `Refund of POS Sale #${sale.receiptNumber}${reason ? ` — ${reason}` : ''}`,
            category: 'POS Refund',
            type: 'expense',
            amount: sale.total,
            currency: this.currency(),
            paymentMethod: [...new Set(sale.payments.map(p => p.method))].join(', ') || 'cash',
            status: 'cleared',
            docId: sale.docId,
            docNumber: sale.receiptNumber,
            docType: 'receipts',
            clientId: sale.clientId,
            clientName: sale.clientName,
            sessionId: fresh.id,
            createdAt: now.toISOString()
          });

          await db.posSales.put({
            ...sale,
            status: 'refunded',
            refundedAt: now.toISOString(),
            refundReason: reason?.trim() || undefined
          });
          return next;
        }
      );

      this.currentSession.set(updatedSession);
      await Promise.all([this.productService.loadProducts(), this.loadRecentSales()]);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
