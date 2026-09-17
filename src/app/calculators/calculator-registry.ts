export type CalculatorCategory =
  | 'business-finance'
  | 'loans'
  | 'taxes-pricing'
  | 'payments'
  | 'freelance'
  | 'inventory';

export interface CalculatorDefinition {
  slug: string;
  name: string;
  category: CalculatorCategory;
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Canonical catalog for public calculators.
 * Keep SEO copy, slugs and categories here so calculator discovery can be
 * reused by the calculator hub, related-calculator links and SEO service.
 */
export const CALCULATOR_REGISTRY: readonly CalculatorDefinition[] = [
  {
    slug: 'break-even-sales-calculator',
    name: 'Break-Even Point Calculator',
    category: 'business-finance',
    title: 'Break-Even Point Calculator — Units & Revenue | X-Facture',
    description: 'Calculate break-even units, break-even revenue and contribution margin for a business.',
    keywords: ['break-even calculator', 'break even point', 'break-even units', 'break-even revenue', 'contribution margin']
  },
  {
    slug: 'cash-burn-runway-calculator',
    name: 'Cash Burn & Runway Calculator',
    category: 'business-finance',
    title: 'Cash Burn & Runway Calculator | X-Facture',
    description: 'Calculate monthly cash burn, business runway and projected cash depletion from revenue and expenses.',
    keywords: ['cash burn calculator', 'runway calculator', 'startup runway', 'cash flow runway', 'burn rate']
  },
  {
    slug: 'cash-register-change-calculator',
    name: 'Cash Register Change Calculator',
    category: 'business-finance',
    title: 'Cash Register Change Calculator | X-Facture',
    description: 'Calculate customer change and an efficient cash denomination breakdown for a transaction.',
    keywords: ['change calculator', 'cash register calculator', 'cash change', 'denomination calculator']
  },
  {
    slug: 'commercial-loan-emi-calculator',
    name: 'Commercial Loan EMI Calculator',
    category: 'loans',
    title: 'Commercial Loan EMI Calculator | X-Facture',
    description: 'Estimate commercial loan payments, total interest and repayment cost from loan terms.',
    keywords: ['commercial loan calculator', 'business loan EMI', 'loan payment calculator', 'loan interest calculator']
  },
  {
    slug: 'compound-working-capital-calculator',
    name: 'Compound Working Capital Calculator',
    category: 'business-finance',
    title: 'Working Capital Calculator | X-Facture',
    description: 'Estimate working capital requirements and model how business cash needs change over time.',
    keywords: ['working capital calculator', 'working capital requirement', 'business cash needs']
  },
  {
    slug: 'currency-exchange-fee-calculator',
    name: 'Currency Exchange Fee Calculator',
    category: 'payments',
    title: 'Currency Exchange Fee Calculator | X-Facture',
    description: 'Calculate exchange fees, effective exchange rates and the real cost of converting currencies.',
    keywords: ['currency exchange calculator', 'exchange fee calculator', 'FX fee', 'effective exchange rate']
  },
  {
    slug: 'gross-margin-markup-calculator',
    name: 'Gross Margin & Markup Calculator',
    category: 'taxes-pricing',
    title: 'Gross Margin vs Markup Calculator | X-Facture',
    description: 'Convert between gross margin and markup, calculate selling price from cost and estimate product profit.',
    keywords: ['gross margin calculator', 'markup calculator', 'margin vs markup', 'COGS calculator', 'selling price calculator']
  },
  {
    slug: 'hourly-freelance-rate-calculator',
    name: 'Freelance Hourly Rate Calculator',
    category: 'freelance',
    title: 'Freelance Hourly Rate Calculator | X-Facture',
    description: 'Calculate a sustainable freelance hourly rate from income goals, expenses, taxes and billable hours.',
    keywords: ['freelance rate calculator', 'hourly rate calculator', 'freelancer pricing', 'freelance income calculator']
  },
  {
    slug: 'inventory-turnover-holding-calculator',
    name: 'Inventory Turnover & Holding Calculator',
    category: 'inventory',
    title: 'Inventory Turnover & Holding Cost Calculator | X-Facture',
    description: 'Calculate inventory turnover, days inventory outstanding and inventory holding costs.',
    keywords: ['inventory turnover calculator', 'inventory holding cost', 'inventory days', 'stock turnover']
  },
  {
    slug: 'late-fee-interest-calculator',
    name: 'Late Fee & Interest Calculator',
    category: 'taxes-pricing',
    title: 'Late Fee & Interest Calculator | X-Facture',
    description: 'Calculate late payment fees and interest on overdue invoices or balances.',
    keywords: ['late fee calculator', 'late payment interest', 'invoice interest calculator', 'overdue invoice calculator']
  },
  {
    slug: 'sales-tax-vat-splitter',
    name: 'Sales Tax & VAT Splitter',
    category: 'taxes-pricing',
    title: 'Sales Tax & VAT Calculator | X-Facture',
    description: 'Calculate tax-inclusive and tax-exclusive prices and split sales tax or VAT from a total.',
    keywords: ['VAT calculator', 'sales tax calculator', 'VAT inclusive', 'VAT exclusive', 'tax splitter']
  },
  {
    slug: 'stripe-paypal-fee-calculator',
    name: 'Stripe & PayPal Fee Calculator',
    category: 'payments',
    title: 'Stripe & PayPal Fee Calculator | X-Facture',
    description: 'Estimate payment processing fees, net payout and the amount to charge to receive a target amount.',
    keywords: ['Stripe fee calculator', 'PayPal fee calculator', 'payment processing fee', 'net payout calculator']
  }
] as const;

export function getCalculatorBySlug(slug: string): CalculatorDefinition | undefined {
  return CALCULATOR_REGISTRY.find(calculator => calculator.slug === slug);
}
