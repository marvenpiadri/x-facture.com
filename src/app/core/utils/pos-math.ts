import { CalculationService } from '../services/calculation.service';
import { DocumentLineItem, TaxBreakdownItem } from '../models/document.model';
import { CartDiscount, PosCartItem } from '../models/pos.model';

export const roundMoney = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Local calendar date (YYYY-MM-DD). toISOString() would give the UTC date, which is wrong near midnight. */
export const localDateString = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const localTimeString = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  taxBreakdown: TaxBreakdownItem[];
}

export function resolveDiscountAmount(subtotal: number, discount: CartDiscount): number {
  const value = Number.isFinite(discount.value) ? Math.max(0, discount.value) : 0;
  if (discount.type === 'percent') return roundMoney((subtotal * Math.min(100, value)) / 100);
  return Math.min(subtotal, roundMoney(value));
}

export function toDocumentItems(items: PosCartItem[]): DocumentLineItem[] {
  return items.map((item, index) => ({
    id: `item-${index + 1}`,
    description:
      item.name + (item.description ? ` (${item.description})` : '') + (item.note ? ` — ${item.note}` : ''),
    quantity: item.quantity,
    unitCost: item.unitCost,
    taxRate: item.taxRate,
    discountPercent: item.discountPercent,
    amount: item.amount
  }));
}

/**
 * Cart totals come from the same calculator the receipt preview uses, so the amount
 * charged at the till always equals the amount printed on the receipt. The discount is
 * applied before tax and spread across tax rates.
 */
export function computeCartTotals(
  items: PosCartItem[],
  discount: CartDiscount,
  calc: CalculationService
): CartTotals {
  const lineSubtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
  const discountAmount = resolveDiscountAmount(lineSubtotal, discount);
  const totals = calc.calculateDocumentTotals(toDocumentItems(items), 0, discountAmount);
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    total: totals.total,
    taxBreakdown: totals.taxBreakdown.filter(row => row.netAmount > 0 || row.taxAmount > 0)
  };
}

/** Round-up banknote suggestions above the amount still due, e.g. 12.40 -> 15, 20, 50. */
export function cashPresets(remaining: number): number[] {
  const out = new Set<number>();
  for (const step of [5, 10, 20, 50, 100, 200, 500]) {
    const value = Math.ceil(remaining / step) * step;
    if (value > remaining + 0.004) out.add(value);
  }
  return [...out].slice(0, 3);
}
