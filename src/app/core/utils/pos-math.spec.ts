import '@angular/compiler';
import { CalculationService } from '../services/calculation.service';
import { PosCartItem } from '../models/pos.model';
import { cashPresets, computeCartTotals, localDateString, resolveDiscountAmount } from './pos-math';

const calc = new CalculationService();
const line = (unitCost: number, quantity: number, taxRate: number, discountPercent = 0): PosCartItem => ({
  productId: `p-${unitCost}-${taxRate}`,
  name: 'Item',
  unitCost,
  quantity,
  taxRate,
  discountPercent,
  amount: calc.calculateLineAmount(unitCost, quantity, discountPercent)
});

describe('pos-math', () => {
  it('applies a percent discount before tax and splits it across tax rates', () => {
    // 2 x 2.50 @20% + 1 x 1.80 @10%, 10% off => net 6.12, tax 0.90 + 0.16
    const totals = computeCartTotals([line(2.5, 2, 20), line(1.8, 1, 10)], { type: 'percent', value: 10 }, calc);
    expect(totals.subtotal).toBe(6.8);
    expect(totals.discountAmount).toBe(0.68);
    expect(totals.taxAmount).toBe(1.06);
    expect(totals.total).toBe(7.18);
    expect(totals.itemCount).toBe(3);
  });

  it('never lets a fixed discount exceed the subtotal', () => {
    expect(resolveDiscountAmount(10, { type: 'amount', value: 25 })).toBe(10);
    expect(resolveDiscountAmount(10, { type: 'percent', value: 250 })).toBe(10);
    expect(resolveDiscountAmount(10, { type: 'amount', value: -5 })).toBe(0);
  });

  it('gives zero tax and total for an empty cart', () => {
    const totals = computeCartTotals([], { type: 'percent', value: 0 }, calc);
    expect(totals.total).toBe(0);
    expect(totals.taxAmount).toBe(0);
  });

  it('suggests banknotes strictly above the amount due', () => {
    expect(cashPresets(7.18)).toEqual([10, 20, 50]);
    expect(cashPresets(20)).toEqual([50, 100, 200]);
  });

  it('uses the local calendar date, not the UTC one', () => {
    expect(localDateString(new Date(2026, 9, 28, 0, 30))).toBe('2026-10-28');
  });
});
