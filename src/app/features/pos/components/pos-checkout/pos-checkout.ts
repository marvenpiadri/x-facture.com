import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CurrencyService } from '../../../../core/services/currency.service';
import { PaymentMethod, PosPaymentRecord } from '../../../../core/models/pos.model';
import { cashPresets, roundMoney } from '../../../../core/utils/pos-math';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

const METHODS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: 'cash', label: 'Cash', icon: 'payments' },
  { id: 'card', label: 'Card', icon: 'credit_card' },
  { id: 'other', label: 'Mobile / Other', icon: 'contactless' }
];

/** Parses user input that may use a comma as the decimal separator. */
const parseAmount = (raw: string): number => {
  const n = Number(raw.replace(',', '.').trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
};

@Component({
  selector: 'app-pos-checkout',
  standalone: true,
  imports: [A11yModule, TranslatePipe],
  templateUrl: './pos-checkout.html',
  styleUrls: ['../../pos-shared.css', './pos-checkout.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosCheckoutComponent {
  private currencyService = inject(CurrencyService);

  readonly total = input.required<number>();
  readonly currency = input.required<string>();
  readonly busy = input<boolean>(false);
  readonly customerName = input<string | null>(null);

  readonly confirmed = output<PosPaymentRecord[]>();
  readonly cancelled = output<void>();

  readonly methods = METHODS;
  readonly symbol = computed(() => this.currencyService.getSymbol(this.currency()));

  readonly paid = signal<PosPaymentRecord[]>([]);
  readonly method = signal<PaymentMethod>('cash');
  /** Raw text of the amount field; null means "use the amount still due". */
  private readonly typed = signal<string | null>(null);
  readonly reference = signal('');

  readonly remaining = computed(() =>
    Math.max(0, roundMoney(this.total() - this.paid().reduce((sum, p) => sum + p.amount, 0)))
  );

  readonly inputValue = computed(() => this.typed() ?? this.remaining().toFixed(2));
  private readonly entered = computed(() => parseAmount(this.inputValue()));

  /** Part of the bill the current entry settles. */
  readonly applied = computed(() => roundMoney(Math.min(this.entered(), this.remaining())));
  readonly covers = computed(() => this.remaining() === 0 || this.applied() >= this.remaining() - 0.004);
  readonly change = computed(() =>
    this.method() === 'cash' ? Math.max(0, roundMoney(this.entered() - this.remaining())) : 0
  );
  readonly shortfall = computed(() => Math.max(0, roundMoney(this.remaining() - this.applied())));
  readonly canAddPartial = computed(() => this.applied() > 0 && !this.covers());
  readonly canComplete = computed(() => !this.busy() && this.covers());
  readonly presets = computed(() => cashPresets(this.remaining()));

  fmt(value: number): string {
    return this.currencyService.format(value, this.currency());
  }

  selectMethod(id: PaymentMethod): void {
    this.method.set(id);
    this.typed.set(null);
    this.reference.set('');
  }

  onType(event: Event): void {
    this.typed.set((event.target as HTMLInputElement).value);
  }

  setAmount(value: number): void {
    this.typed.set(value.toFixed(2));
  }

  private entryAsPayment(): PosPaymentRecord {
    const method = this.method();
    const applied = this.applied();
    const record: PosPaymentRecord = { method, amount: applied };
    if (method === 'cash') {
      record.tendered = roundMoney(this.entered());
      record.changeDue = this.change();
    } else if (this.reference().trim()) {
      record.reference = this.reference().trim();
    }
    return record;
  }

  addPartial(): void {
    if (!this.canAddPartial()) return;
    this.paid.set([...this.paid(), this.entryAsPayment()]);
    this.typed.set(null);
    this.reference.set('');
  }

  removePayment(index: number): void {
    this.paid.set(this.paid().filter((_, i) => i !== index));
    this.typed.set(null);
  }

  complete(): void {
    if (!this.canComplete()) return;
    const lines = [...this.paid()];
    if (this.applied() > 0 || lines.length === 0) lines.push(this.entryAsPayment());
    this.confirmed.emit(lines);
  }

  methodLabel(id: PaymentMethod): string {
    return METHODS.find(m => m.id === id)?.label ?? id;
  }
}
