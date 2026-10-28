import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { PosService } from '../../../../core/services/pos.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { Product } from '../../../../core/models/product.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { StockState, stockState } from '../../../../core/utils/stock';

const FAVORITES = '★';
const ALL = 'All';
interface Tile {
  product: Product;
  price: string;
  stock: StockState;
  stockQty: number;
  inCart: number;
}

@Component({
  selector: 'app-pos-catalog',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  templateUrl: './pos-catalog.html',
  styleUrls: ['../../pos-shared.css', './pos-catalog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosCatalogComponent {
  private productService = inject(ProductService);
  private pos = inject(PosService);
  private currencyService = inject(CurrencyService);

  readonly productPicked = output<Product>();
  readonly scanMissed = output<string>();
  readonly customItemRequested = output<void>();

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly ALL = ALL;
  readonly FAVORITES = FAVORITES;

  readonly query = signal('');
  readonly category = signal(ALL);

  private readonly active = computed(() => this.productService.products().filter(p => !p.isArchived));
  readonly hasFavorites = computed(() => this.active().some(p => p.isFavorite));
  readonly categories = computed(() =>
    [...new Set(this.active().map(p => p.category).filter((c): c is string => !!c))].sort((a, b) => a.localeCompare(b))
  );

  private readonly matches = computed(() => {
    const cat = this.category();
    const q = this.query().trim().toLowerCase();
    return this.active().filter(p => {
      if (cat === FAVORITES && !p.isFavorite) return false;
      if (cat !== ALL && cat !== FAVORITES && p.category !== cat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        !!p.sku?.toLowerCase().includes(q) ||
        !!p.barcode?.toLowerCase().includes(q) ||
        !!p.description?.toLowerCase().includes(q)
      );
    });
  });

  readonly tiles = computed<Tile[]>(() => {
    const inCart = new Map<string, number>();
    for (const line of this.pos.cart()) inCart.set(line.productId, (inCart.get(line.productId) ?? 0) + line.quantity);
    const currency = this.pos.currency();
    return this.matches().map(product => ({
      product,
      price: this.currencyService.format(product.unitCost, currency),
      stock: stockState(product),
      stockQty: product.stockQty ?? 0,
      inCart: inCart.get(product.id) ?? 0
    }));
  });

  focusSearch(select = true): void {
    const el = this.searchInput()?.nativeElement;
    if (!el) return;
    el.focus();
    if (select) el.select();
  }

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.query.set('');
    this.focusSearch(false);
  }

  /** Enter submits a barcode scan (scanners type the code then press Enter) or the only visible match. */
  onEnter(): void {
    const raw = this.query().trim();
    if (!raw) return;
    const code = raw.toLowerCase();
    const exact = this.active().find(p => p.barcode?.toLowerCase() === code || p.sku?.toLowerCase() === code);
    const target = exact ?? (this.matches().length === 1 ? this.matches()[0] : undefined);
    if (target) {
      this.pick(target);
      this.query.set('');
    } else if (this.matches().length === 0) {
      this.scanMissed.emit(raw);
      this.query.set('');
    }
  }

  pick(product: Product): void {
    this.productPicked.emit(product);
    // Keep the scanner/keyboard flow going on desktop; skip on touch so the on-screen keyboard stays closed.
    if (typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches) this.focusSearch(false);
  }
}
