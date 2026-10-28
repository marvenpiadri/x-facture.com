export type PaymentMethod = 'cash' | 'card' | 'other';

export interface PosCartItem {
  productId: string;
  name: string;
  description?: string;
  sku?: string;
  unitCost: number;
  quantity: number;
  taxRate: number;
  discountPercent: number;
  amount: number;
  note?: string;
  isCustom?: boolean;      // open-price item that is not in the catalog
}

export type DiscountType = 'percent' | 'amount';

export interface CartDiscount {
  type: DiscountType;
  value: number;
}

export interface PosPaymentRecord {
  method: PaymentMethod;
  amount: number;          // portion of the bill settled by this payment
  tendered?: number;       // cash handed over
  changeDue?: number;
  reference?: string;
}

export type PosSaleStatus = 'completed' | 'refunded';

export interface PosSale {
  id: string;
  receiptNumber: string;   // e.g. RCT-2026-0001
  sessionId: string;
  date: string;
  time: string;
  cashierName: string;
  items: PosCartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  payments: PosPaymentRecord[];
  notes?: string;
  docId?: string;          // Linked BusinessDocument id
  clientId?: string;
  clientName?: string;
  status?: PosSaleStatus;  // undefined on legacy sales = completed
  refundedAt?: string;
  refundReason?: string;
}

export interface HeldOrder {
  id: string;
  label: string;
  createdAt: string;
  items: PosCartItem[];
  discount: CartDiscount;
  note: string;
  clientId?: string;
  clientName?: string;
}

export interface RegisterReport {
  timestamp: string;
  type: 'X-Report' | 'Z-Report';
  cashierName: string;
  startingFloat: number;
  totalSales: number;
  salesCount: number;
  byPaymentMethod: {
    cash: number;
    card: number;
    other: number;
  };
  totalRefunds: number;
  taxTotal?: number;
  discountTotal?: number;
  expectedCash: number;
  actualCash?: number;
  discrepancy?: number;
}

export interface RegisterSession {
  id: string;
  sessionNumber: string;   // e.g. SESS-2026-0001
  cashierName: string;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  startingFloat: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  cashRefunds: number;     // refunds paid out of the drawer
  refundsTotal?: number;   // all refunds, any tender
  taxTotal?: number;
  discountTotal?: number;
  salesCount: number;
  expectedCash: number;
  actualCashCounted?: number;
  discrepancy?: number;
  xReports: RegisterReport[];
  zReport?: RegisterReport;
  notes?: string;
}
