import { Product } from '../models/product.model';

export type StockState = 'ok' | 'low' | 'out' | null;

export const DEFAULT_LOW_STOCK = 5;

/** null = stock is not tracked for this item (services, digital goods). */
export function stockState(p: Pick<Product, 'trackStock' | 'stockQty' | 'lowStockThreshold'>): StockState {
  if (!p.trackStock) return null;
  const qty = p.stockQty ?? 0;
  if (qty <= 0) return 'out';
  return qty <= (p.lowStockThreshold ?? DEFAULT_LOW_STOCK) ? 'low' : 'ok';
}
