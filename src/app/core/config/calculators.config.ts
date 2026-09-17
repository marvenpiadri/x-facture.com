export interface FinanceToolConfig {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  category: 'Pricing & Margins' | 'Tax & Compliance' | 'Cashier & POS' | 'Financing & Growth' | 'Billing & Rates' | 'Cash Flow & Runway';
  description: string;
  icon: string;
  badge?: string;
  route: string;
  popular?: boolean;
}

export const FINANCE_TOOLS: FinanceToolConfig[] = [
  {
    id: 'stripe-paypal-fee',
    slug: 'stripe-paypal-fee-calculator',
    title: 'Stripe, PayPal & Merchant Fee Calculator',
    shortTitle: 'Merchant Processing Fees',
    category: 'Billing & Rates',
    description: 'Calculate domestic, international, and invoice processing cuts across Stripe, PayPal, Square, Wise, and ACH.',
    icon: 'credit_card',
    badge: 'Popular',
    route: '/calculators/stripe-paypal-fee-calculator',
    popular: true
  },
  {
    id: 'margin-markup',
    slug: 'gross-margin-markup-calculator',
    title: 'Gross Margin & Cost Markup Calculator',
    shortTitle: 'Margin vs Markup',
    category: 'Pricing & Margins',
    description: 'Determine required selling prices, target gross margins, and cost markup percentage for wholesale and retail.',
    icon: 'trending_up',
    badge: 'Essential',
    route: '/calculators/gross-margin-markup-calculator',
    popular: true
  },
  {
    id: 'vat-sales-tax',
    slug: 'sales-tax-vat-splitter',
    title: 'Sales Tax & VAT Reverse Splitter',
    shortTitle: 'VAT & Sales Tax Splitter',
    category: 'Tax & Compliance',
    description: 'Instantly add or extract embedded VAT, GST, and state sales taxes from gross invoice receipts.',
    icon: 'percent',
    badge: 'Tax',
    route: '/calculators/sales-tax-vat-splitter',
    popular: true
  },
  {
    id: 'cash-burn-runway',
    slug: 'cash-burn-runway-calculator',
    title: 'Cash Burn Rate & Zero-Cash Runway Calculator',
    shortTitle: 'Cash Runway & Burn',
    category: 'Cash Flow & Runway',
    description: 'Calculate net cash burn rate, runway months, zero-cash drop dead dates, and revenue break-even targets.',
    icon: 'speed',
    badge: 'SaaS / Startup',
    route: '/calculators/cash-burn-runway-calculator',
    popular: true
  },
  {
    id: 'break-even-sales',
    slug: 'break-even-sales-calculator',
    title: 'Break-Even Sales & Unit Volume Calculator',
    shortTitle: 'Break-Even Sales',
    category: 'Pricing & Margins',
    description: 'Calculate unit volume, target revenue, contribution margin ratio, and safety margins to cover fixed business overheads.',
    icon: 'balance',
    route: '/calculators/break-even-sales-calculator'
  },
  {
    id: 'commercial-loan-emi',
    slug: 'commercial-loan-emi-calculator',
    title: 'Commercial Loan & Equipment EMI Calculator',
    shortTitle: 'Commercial Loan EMI',
    category: 'Financing & Growth',
    description: 'Compute monthly debt service, total finance interest, interest-to-principal ratio, and amortization for equipment financing.',
    icon: 'account_balance',
    route: '/calculators/commercial-loan-emi-calculator'
  },
  {
    id: 'late-fee-interest',
    slug: 'late-fee-interest-calculator',
    title: 'Late Payment Fee & Overdue Interest Calculator',
    shortTitle: 'Late Invoice Interest',
    category: 'Billing & Rates',
    description: 'Accurately compute daily statutory or contractual overdue finance charges on unpaid B2B client invoices.',
    icon: 'warning',
    badge: 'Overdue',
    route: '/calculators/late-fee-interest-calculator'
  },
  {
    id: 'hourly-freelance-rate',
    slug: 'hourly-freelance-rate-calculator',
    title: 'Hourly & Freelance Billing Rate Calculator',
    shortTitle: 'Freelance Hourly Rate',
    category: 'Billing & Rates',
    description: 'Determine sustainable hourly and daily billing rates based on take-home income, tax reserves, and billable capacity.',
    icon: 'timer',
    route: '/calculators/hourly-freelance-rate-calculator'
  },
  {
    id: 'compound-working-capital',
    slug: 'compound-working-capital-calculator',
    title: 'Compound Interest & Working Capital Calculator',
    shortTitle: 'Compound Interest Growth',
    category: 'Financing & Growth',
    description: 'Project compounding returns, monthly contributions, and future treasury reserves across multi-year horizons.',
    icon: 'insights',
    route: '/calculators/compound-working-capital-calculator'
  },
  {
    id: 'inventory-turnover-holding',
    slug: 'inventory-turnover-holding-calculator',
    title: 'Inventory Turnover & Carrying Cost Calculator',
    shortTitle: 'Inventory Turnover & DSI',
    category: 'Pricing & Margins',
    description: 'Calculate inventory turnover ratio, Days Sales in Inventory (DSI), and annual warehouse carrying costs.',
    icon: 'inventory',
    route: '/calculators/inventory-turnover-holding-calculator'
  },
  {
    id: 'currency-exchange-fee',
    slug: 'currency-exchange-fee-calculator',
    title: 'Currency Exchange Fee & FX Spread Calculator',
    shortTitle: 'Currency Exchange & FX Spread',
    category: 'Tax & Compliance',
    description: 'Calculate hidden foreign exchange bank markups, wire fees, and net conversion amounts across global currencies.',
    icon: 'currency_exchange',
    route: '/calculators/currency-exchange-fee-calculator'
  },
  {
    id: 'cash-register-change',
    slug: 'cash-register-change-calculator',
    title: 'Cash Register Change & Denominations Calculator',
    shortTitle: 'Cash Register Change',
    category: 'Cashier & POS',
    description: 'Instant POS cash change calculator with exact banknote and coin denomination breakdown to hand back to customers.',
    icon: 'point_of_sale',
    badge: 'POS',
    route: '/calculators/cash-register-change-calculator',
    popular: true
  }
];
