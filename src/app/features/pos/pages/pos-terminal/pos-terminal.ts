import { A11yModule } from '@angular/cdk/a11y';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { Router } from '@angular/router';
import { PosService, CheckoutResult } from '../../../../core/services/pos.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { CalculationService } from '../../../../core/services/calculation.service';
import { ClientService } from '../../../../core/services/client.service';
import { LanguageService } from '../../../../core/services/language.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { Client } from '../../../../core/models/client.model';
import { DiscountType, PaymentMethod, PosPaymentRecord, PosSale, RegisterReport } from '../../../../core/models/pos.model';
import { Product } from '../../../../core/models/product.model';
import { computeCartTotals, roundMoney } from '../../../../core/utils/pos-math';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { PosCatalogComponent } from '../../components/pos-catalog/pos-catalog';
import { PosCheckoutComponent } from '../../components/pos-checkout/pos-checkout';

type ModalName = 'open' | 'close' | 'report' | 'custom' | 'customer' | 'held' | 'sales' | 'checkout' | 'done';
type ToastTone = 'info' | 'success' | 'error';

const CASHIER_KEY = 'xfacture-pos-cashier';
const FLOAT_KEY = 'xfacture-pos-float';

const parseNumber = (raw: string): number => {
  const n = Number(String(raw).replace(',', '.').trim());
  return Number.isFinite(n) ? n : 0;
};

const isTypingTarget = (el: EventTarget | null): boolean => {
  const node = el as HTMLElement | null;
  if (!node?.tagName) return false;
  return node.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName);
};

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [A11yModule, DatePipe, TranslatePipe, PosCatalogComponent, PosCheckoutComponent],
  templateUrl: './pos-terminal.html',
  styleUrls: ['../../pos-shared.css', './pos-terminal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosTerminalPage implements OnInit {
  private readonly pos = inject(PosService);
  private readonly currencyService = inject(CurrencyService);
  private readonly calc = inject(CalculationService);
  private readonly clientService = inject(ClientService);
  private readonly language = inject(LanguageService);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly catalog = viewChild(PosCatalogComponent);

  readonly session = this.pos.currentSession;
  readonly cart = this.pos.cart;
  readonly totals = this.pos.totals;
  readonly discount = this.pos.discount;
  readonly note = this.pos.note;
  readonly customer = this.pos.customer;
  readonly heldOrders = this.pos.heldOrders;
  readonly recentSales = this.pos.recentSales;
  readonly busy = this.pos.isProcessing;
  readonly currency = this.pos.currency;

  readonly symbol = computed(() => this.currencyService.getSymbol(this.currency()));

  // UI state
  readonly modal = signal<ModalName | null>(null);
  readonly cartOpen = signal(false);
  readonly expandedLine = signal<string | null>(null);
  readonly toast = signal<{ text: string; tone: ToastTone } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Open / close register
  readonly openCashier = signal(this.readStored(CASHIER_KEY, 'Front Clerk'));
  readonly openFloat = signal(this.readStored(FLOAT_KEY, '100'));
  readonly closeCounted = signal('');
  readonly closeNotes = signal('');
  readonly latestReport = signal<RegisterReport | null>(null);

  // Custom item
  readonly customName = signal('');
  readonly customPrice = signal('');
  readonly customTax = signal('0');
  readonly customQty = signal('1');

  // Customer picker
  readonly clientQuery = signal('');

  // Sales history / refunds
  readonly refundingId = signal<string | null>(null);
  readonly refundReason = signal('');

  readonly completed = signal<CheckoutResult | null>(null);

  readonly drawerCash = computed(() => {
    const s = this.session();
    return s ? roundMoney(s.startingFloat + s.cashSales - s.cashRefunds) : 0;
  });

  readonly netSales = computed(() => {
    const s = this.session();
    return s ? roundMoney(s.cashSales + s.cardSales + s.otherSales - (s.refundsTotal ?? 0)) : 0;
  });

  readonly countedCash = computed(() => parseNumber(this.closeCounted()));
  readonly discrepancy = computed(() => roundMoney(this.countedCash() - this.drawerCash()));

  readonly filteredClients = computed<Client[]>(() => {
    const q = this.clientQuery().trim().toLowerCase();
    const all = this.clientService.clients();
    const list = q
      ? all.filter(c => c.name.toLowerCase().includes(q) || !!c.email?.toLowerCase().includes(q) || !!c.phone?.includes(q))
      : all;
    return list.slice(0, 50);
  });

  readonly heldView = computed(() =>
    this.heldOrders().map(order => ({
      order,
      total: computeCartTotals(order.items, order.discount, this.calc).total,
      count: order.items.reduce((sum, item) => sum + item.quantity, 0)
    }))
  );

  readonly discountSummary = computed(() => {
    const d = this.discount();
    return d.type === 'percent' ? `${d.value}%` : this.fmt(d.value);
  });

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;
    await this.clientService.loadClients();
    const active = await this.pos.restoreActiveSession();
    if (!active) this.modal.set('open');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  fmt(value: number | undefined | null): string {
    return this.currencyService.format(value, this.currency());
  }

  t(key: string): string {
    return this.language.translate(key);
  }

  methodLabel(method: PaymentMethod): string {
    return this.t(method === 'cash' ? 'Cash' : method === 'card' ? 'Card' : 'Mobile / Other');
  }

  paymentSummary(sale: PosSale): string {
    return sale.payments.map(p => this.methodLabel(p.method)).join(' + ');
  }

  private readStored(key: string, fallback: string): string {
    try {
      return (typeof localStorage !== 'undefined' && localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  private store(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage may be disabled */
    }
  }

  private showToast(text: string, tone: ToastTone = 'info'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ text, tone });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3200);
  }

  private fail(error: unknown): void {
    this.showToast(error instanceof Error ? error.message : this.t('Something went wrong.'), 'error');
  }

  private requireSession(): boolean {
    if (this.session()) return true;
    this.modal.set('open');
    return false;
  }

  closeModal(): void {
    this.modal.set(null);
    this.refundingId.set(null);
    this.refundReason.set('');
  }

  // ---------------------------------------------------------------------------
  // Keyboard: F2 search, F4 hold, F8 held orders, F9 pay, Esc close, type-to-search
  // ---------------------------------------------------------------------------

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (this.modal() && this.modal() !== 'done') {
        event.preventDefault();
        this.closeModal();
      } else if (this.cartOpen()) {
        this.cartOpen.set(false);
      }
      return;
    }
    if (this.modal()) return;

    switch (event.key) {
      case 'F2':
        event.preventDefault();
        this.catalog()?.focusSearch();
        return;
      case 'F4':
        event.preventDefault();
        void this.hold();
        return;
      case 'F8':
        event.preventDefault();
        this.modal.set('held');
        return;
      case 'F9':
        event.preventDefault();
        this.openCheckout();
        return;
    }

    // Barcode scanners "type" into whatever has focus: route stray keystrokes to the search box.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && !isTypingTarget(event.target)) {
      this.catalog()?.focusSearch(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Cart
  // ---------------------------------------------------------------------------

  onPick(product: Product): void {
    if (!this.requireSession()) return;
    this.pos.addToCart(product, 1);
  }

  onScanMissed(code: string): void {
    this.showToast(`${this.t('No product found for')} "${code}"`, 'error');
  }

  setQty(index: number, value: number): void {
    this.pos.setQuantity(index, value);
  }

  onLineDiscount(index: number, event: Event): void {
    this.pos.setLineDiscount(index, parseNumber((event.target as HTMLInputElement).value));
  }

  onLineNote(index: number, event: Event): void {
    this.pos.setLineNote(index, (event.target as HTMLInputElement).value);
  }

  onNote(event: Event): void {
    this.pos.setNote((event.target as HTMLInputElement).value);
  }

  toggleLine(productId: string): void {
    this.expandedLine.set(this.expandedLine() === productId ? null : productId);
  }

  setDiscountType(type: DiscountType): void {
    this.pos.setDiscount({ type, value: this.discount().value });
  }

  onDiscountValue(event: Event): void {
    this.pos.setDiscount({ type: this.discount().type, value: parseNumber((event.target as HTMLInputElement).value) });
  }

  clearCart(): void {
    this.pos.clearCart();
    this.expandedLine.set(null);
    this.cartOpen.set(false);
  }

  async hold(): Promise<void> {
    if (this.cart().length === 0) return;
    try {
      await this.pos.holdCurrentOrder();
      this.cartOpen.set(false);
      this.showToast(this.t('Order held. Recall it from Held orders.'), 'success');
    } catch (e) {
      this.fail(e);
    }
  }

  async recall(id: string): Promise<void> {
    try {
      await this.pos.recallHeldOrder(id);
      this.closeModal();
      this.showToast(this.t('Order recalled.'), 'success');
    } catch (e) {
      this.fail(e);
    }
  }

  async discardHeld(id: string): Promise<void> {
    await this.pos.deleteHeldOrder(id);
  }

  // Custom item -----------------------------------------------------------------

  openCustom(): void {
    if (!this.requireSession()) return;
    this.customName.set(this.catalog()?.query() ?? '');
    this.customPrice.set('');
    this.customTax.set(String(this.settingsService.settings()?.defaultTaxRate ?? 0));
    this.customQty.set('1');
    this.modal.set('custom');
  }

  readonly canAddCustom = computed(() => parseNumber(this.customPrice()) > 0 && parseNumber(this.customQty()) > 0);

  confirmCustom(): void {
    if (!this.canAddCustom()) return;
    this.pos.addCustomItem({
      name: this.customName(),
      unitCost: parseNumber(this.customPrice()),
      taxRate: parseNumber(this.customTax()),
      quantity: parseNumber(this.customQty())
    });
    this.closeModal();
  }

  // Customer ---------------------------------------------------------------------

  openCustomerPicker(): void {
    this.clientQuery.set('');
    this.modal.set('customer');
  }

  pickCustomer(client: Client | null): void {
    this.pos.setCustomer(client);
    this.closeModal();
  }

  // ---------------------------------------------------------------------------
  // Checkout
  // ---------------------------------------------------------------------------

  openCheckout(): void {
    if (!this.requireSession() || this.cart().length === 0) return;
    this.cartOpen.set(false);
    this.modal.set('checkout');
  }

  async onPaid(payments: PosPaymentRecord[]): Promise<void> {
    try {
      this.completed.set(await this.pos.checkout(payments));
      this.modal.set('done');
    } catch (e) {
      this.fail(e);
    }
  }

  newSale(): void {
    this.completed.set(null);
    this.modal.set(null);
    this.expandedLine.set(null);
    setTimeout(() => this.catalog()?.focusSearch(false));
  }

  viewReceipt(docNumber: string): void {
    this.closeModal();
    void this.router.navigate(['/receipts', docNumber, 'preview']);
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  async confirmOpen(): Promise<void> {
    try {
      const float = parseNumber(this.openFloat());
      await this.pos.openSession(this.openCashier(), float);
      this.store(CASHIER_KEY, this.openCashier().trim() || 'Front Clerk');
      this.store(FLOAT_KEY, String(float));
      this.closeModal();
      setTimeout(() => this.catalog()?.focusSearch(false));
    } catch (e) {
      this.fail(e);
    }
  }

  async openReport(): Promise<void> {
    try {
      this.latestReport.set(await this.pos.generateXReport());
      this.modal.set('report');
    } catch (e) {
      this.fail(e);
    }
  }

  openClose(): void {
    this.closeCounted.set(this.drawerCash().toFixed(2));
    this.closeNotes.set('');
    this.modal.set('close');
  }

  async confirmClose(): Promise<void> {
    try {
      this.latestReport.set(await this.pos.closeSession(this.countedCash(), this.closeNotes()));
      this.modal.set('report');
    } catch (e) {
      this.fail(e);
    }
  }

  printReport(): void {
    window.print();
  }

  // ---------------------------------------------------------------------------
  // Sales history & refunds
  // ---------------------------------------------------------------------------

  async openSales(): Promise<void> {
    this.modal.set('sales');
    await this.pos.loadRecentSales();
  }

  startRefund(id: string): void {
    this.refundingId.set(id);
    this.refundReason.set('');
  }

  async confirmRefund(sale: PosSale): Promise<void> {
    try {
      await this.pos.refundSale(sale.id, this.refundReason());
      this.refundingId.set(null);
      this.showToast(`${this.t('Refunded')} ${sale.receiptNumber}`, 'success');
    } catch (e) {
      this.fail(e);
    }
  }
}
