import { Injectable } from '@angular/core';
import { DocumentDiscount, DocumentLineItem, TaxBreakdownItem } from '../models/document.model';

export interface DocumentTotalsResult {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  deliveryDiscount: number;
  netShipping: number;
  netTotal: number;
  total: number;
  depositPaid: number;
  balanceDue: number;
  taxBreakdown: TaxBreakdownItem[];
  computedDiscounts: DocumentDiscount[];
}

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  /**
   * Single authoritative line item calculation
   */
  calculateLineAmount(
    unitCost: number,
    quantity: number,
    discountPercent = 0
  ): number {
    const cost = Number.isFinite(unitCost) ? Math.max(0, unitCost) : 0;
    const qty = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
    const disc = Number.isFinite(discountPercent) ? Math.min(100, Math.max(0, discountPercent)) : 0;

    const gross = cost * qty;
    const discounted = gross * (1 - disc / 100);
    return Math.round((discounted + Number.EPSILON) * 100) / 100;
  }

  /**
   * Single authoritative tax amount calculation
   */
  calculateTaxAmount(baseAmount: number, taxRatePercent: number): number {
    const base = Number.isFinite(baseAmount) ? Math.max(0, baseAmount) : 0;
    const rate = Number.isFinite(taxRatePercent) ? Math.max(0, taxRatePercent) : 0;
    return Math.round((base * (rate / 100) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Single authoritative document totals & tax breakdown calculation
   */
  calculateDocumentTotals(
    items: DocumentLineItem[],
    documentTaxRate = 0,
    wholeDocumentDiscount = 0,
    shippingAmount = 0,
    depositPaid = 0,
    discounts: DocumentDiscount[] = [],
    deliveryDiscount = 0,
    deliveryTaxRate = 0
  ): DocumentTotalsResult {
    // 1. Calculate subtotal and group lines by tax rate
    let subtotal = 0;
    const tierMap = new Map<number, number>();

    for (const item of items) {
      const lineAmount = this.calculateLineAmount(item.unitCost, item.quantity, item.discountPercent);
      subtotal += lineAmount;

      const rate = Number.isFinite(item.taxRate) ? Number(item.taxRate) : (documentTaxRate || 20);
      tierMap.set(rate, (tierMap.get(rate) || 0) + lineAmount);
    }
    subtotal = Math.round((subtotal + Number.EPSILON) * 100) / 100;

    // 2. Compute Invoice Discounts
    let totalDiscountAmount = 0;
    const computedDiscounts: DocumentDiscount[] = [];
    const tierDiscountMap = new Map<number, number>();

    if (discounts && discounts.length > 0) {
      for (const d of discounts) {
        let discAmt = 0;
        const val = Number.isFinite(d.value) ? Math.max(0, d.value) : 0;

        if (d.appliesTo && d.appliesTo !== 'all') {
          // Applies to specific tax rate, e.g. "20"
          const targetRate = parseFloat(d.appliesTo);
          const targetBase = tierMap.get(targetRate) || 0;
          discAmt = d.type === 'percent'
            ? Math.round((targetBase * (val / 100) + Number.EPSILON) * 100) / 100
            : Math.min(targetBase, val);
          tierDiscountMap.set(targetRate, (tierDiscountMap.get(targetRate) || 0) + discAmt);
        } else {
          // Applies to all items
          discAmt = d.type === 'percent'
            ? Math.round((subtotal * (val / 100) + Number.EPSILON) * 100) / 100
            : Math.min(subtotal, val);

          // Distribute across tiers proportionally
          if (subtotal > 0 && discAmt > 0) {
            for (const [rate, base] of tierMap.entries()) {
              const proportion = base / subtotal;
              const allocated = Math.round((discAmt * proportion + Number.EPSILON) * 100) / 100;
              tierDiscountMap.set(rate, (tierDiscountMap.get(rate) || 0) + allocated);
            }
          }
        }

        totalDiscountAmount += discAmt;
        computedDiscounts.push({
          ...d,
          amount: discAmt
        });
      }
    } else if (wholeDocumentDiscount > 0) {
      totalDiscountAmount = wholeDocumentDiscount;
      if (subtotal > 0) {
        for (const [rate, base] of tierMap.entries()) {
          const allocated = Math.round((wholeDocumentDiscount * (base / subtotal) + Number.EPSILON) * 100) / 100;
          tierDiscountMap.set(rate, allocated);
        }
      }
    }
    totalDiscountAmount = Math.min(subtotal, Math.round((totalDiscountAmount + Number.EPSILON) * 100) / 100);

    // 3. Delivery / Shipping & Delivery Discount
    const rawShipping = Number.isFinite(shippingAmount) ? Math.max(0, shippingAmount) : 0;
    const rawDeliveryDiscount = Number.isFinite(deliveryDiscount) ? Math.max(0, deliveryDiscount) : 0;
    const netShipping = Math.max(0, Math.round((rawShipping - rawDeliveryDiscount + Number.EPSILON) * 100) / 100);

    // 4. Build auto-calculated Tax Breakdown
    const taxBreakdown: TaxBreakdownItem[] = [];
    const sortedRates = Array.from(tierMap.keys()).sort((a, b) => b - a);

    if (sortedRates.length === 0) {
      const fallbackRate = documentTaxRate || 20;
      taxBreakdown.push({
        category: fallbackRate >= 19 ? 'Standard VAT' : (fallbackRate > 0 ? 'Reduced VAT' : 'Zero-rated VAT'),
        taxRate: fallbackRate,
        netAmount: 0,
        taxAmount: 0
      });
    } else {
      for (const rate of sortedRates) {
        const rawBase = tierMap.get(rate) || 0;
        const discountOnTier = tierDiscountMap.get(rate) || 0;
        let tierNet = Math.max(0, rawBase - discountOnTier);

        // If delivery tax applies to this rate
        if (deliveryTaxRate > 0 && Math.abs(rate - deliveryTaxRate) < 0.01 && netShipping > 0) {
          tierNet += netShipping;
        }

        tierNet = Math.round((tierNet + Number.EPSILON) * 100) / 100;
        const taxAmount = this.calculateTaxAmount(tierNet, rate);

        let categoryName = 'Standard VAT';
        if (rate === 0) {
          categoryName = 'Zero-rated VAT';
        } else if (rate < 19) {
          categoryName = 'Reduced VAT';
        }

        taxBreakdown.push({
          category: categoryName,
          taxRate: rate,
          netAmount: tierNet,
          taxAmount
        });
      }
    }

    // If delivery has a distinct tax rate not in items
    if (deliveryTaxRate > 0 && netShipping > 0 && !tierMap.has(deliveryTaxRate)) {
      const deliveryTax = this.calculateTaxAmount(netShipping, deliveryTaxRate);
      taxBreakdown.push({
        category: deliveryTaxRate >= 19 ? 'Standard VAT' : 'Reduced VAT',
        taxRate: deliveryTaxRate,
        netAmount: netShipping,
        taxAmount: deliveryTax
      });
    }

    // 5. Total Net, Total Tax, Grand Total & Balance Due
    const netTotal = Math.max(0, Math.round((subtotal - totalDiscountAmount + netShipping + Number.EPSILON) * 100) / 100);
    const totalTax = Math.round((taxBreakdown.reduce((sum, item) => sum + item.taxAmount, 0) + Number.EPSILON) * 100) / 100;
    const total = Math.max(0, Math.round((netTotal + totalTax + Number.EPSILON) * 100) / 100);

    const deposit = Number.isFinite(depositPaid) ? Math.max(0, depositPaid) : 0;
    const balanceDue = Math.max(0, Math.round((total - deposit + Number.EPSILON) * 100) / 100);

    return {
      subtotal,
      taxAmount: totalTax,
      discountAmount: totalDiscountAmount,
      shippingAmount: rawShipping,
      deliveryDiscount: rawDeliveryDiscount,
      netShipping,
      netTotal,
      total,
      depositPaid: deposit,
      balanceDue,
      taxBreakdown,
      computedDiscounts
    };
  }
}
