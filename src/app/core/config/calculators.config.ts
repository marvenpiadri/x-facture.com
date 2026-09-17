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
    id: 'stripe-paypal-fee', slug: 'stripe-paypal-fee-calculator', title: 'Stripe, PayPal & Merchant Fee Calculator', shortTitle: 'Merchant Processing Fees', category: 'Billing & Rates', description: 'Calculate domestic, international, and invoice processing cuts across Stripe, PayPal, Square, Wise, and ACH.', icon: 'credit_card', badge: 'Popular', route: '/calculators/stripe-paypal-fee-calculator', popular: true
  },
  {
    id: 'margin-markup', slug: 'gross-margin-markup-calculator', title: 'Gross Margin & Cost Markup Calculator', shortTitle: 'Margin vs Markup', category: 'Pricing & Margins', description: 'Determine required selling prices, target gross margins, and cost markup percentage for wholesale and retail.', icon: 'trending_up', badge: 'Essential', route: '/calculators/gross-margin-markup-calculator', popular: true
  },
  {
    id: 'vat-sales-tax', slug: 'sales-tax-vat-splitter', title: 'Sales Tax & VAT Reverse Splitter', shortTitle: 'VAT & Sales Tax Splitter', category: 'Tax & Compliance', description: 'Instantly add or extract embedded VAT, GST, and state sales taxes from gross invoice receipts.', icon: 'percent', badge: 'Tax', route: '/calculators/sales-tax-vat-splitter', popular: true
  },
  {
    id: 'cash-burn-runway', slug: 'cash-burn-runway-calculator', title: 'Cash Burn Rate & Zero-Cash Runway Calculator', shortTitle: 'Cash Runway & Burn', category: 'Cash Flow & Runway', description: 'Calculate net cash burn rate, runway months, zero-cash drop dead dates, and revenue break-even targets.', icon: 'speed', badge: 'SaaS / Startup', route: '/calculators/cash-burn-runway-calculator', popular: true
  },
  {
    id: 'break-even-sales', slug: 'break-even-sales-calculator', title: 'Break-Even Sales & Unit Volume Calculator', shortTitle: 'Break-Even Sales', category: 'Pricing & Margins', description: 'Calculate unit volume, target revenue, contribution margin ratio, and safety margins to cover fixed business overheads.', icon: 'balance', route: '/calculators/break-even-sales-calculator'
  },
  {
    id: 'commercial-loan-emi', slug: 'commercial-loan-emi-calculator', title: 'Commercial Loan & Equipment EMI Calculator', shortTitle: 'Commercial Loan EMI', category: 'Financing & Growth', description: 'Compute monthly debt service, total finance interest, interest-to-principal ratio, and amortization for equipment financing.', icon: 'account_balance', route: '/calculators/commercial-loan-emi-calculator'
  },
  {
    id: 'late-fee-interest', slug: 'late-fee-interest-calculator', title: 'Late Payment Fee & Overdue Interest Calculator', shortTitle: 'Late Invoice Interest', category: 'Billing & Rates', description: 'Accurately compute daily statutory or contractual overdue finance charges on unpaid B2B client invoices.', icon: 'warning', badge: 'Overdue', route: '/calculators/late-fee-interest-calculator'
  },
  {
    id: 'hourly-freelance-rate', slug: 'hourly-freelance-rate-calculator', title: 'Hourly & Freelance Billing Rate Calculator', shortTitle: 'Freelance Hourly Rate', category: 'Billing & Rates', description: 'Determine sustainable hourly and daily billing rates based on take-home income, tax reserves, and billable capacity.', icon: 'timer', route: '/calculators/hourly-freelance-rate-calculator'
  },
  {
    id: 'compound-working-capital', slug: 'compound-working-capital-calculator', title: 'Compound Interest & Working Capital Calculator', shortTitle: 'Compound Interest Growth', category: 'Financing & Growth', description: 'Project compounding returns, monthly contributions, and future treasury reserves across multi-year horizons.', icon: 'insights', route: '/calculators/compound-working-capital-calculator'
  },
  {
    id: 'inventory-turnover-holding', slug: 'inventory-turnover-holding-calculator', title: 'Inventory Turnover & Carrying Cost Calculator', shortTitle: 'Inventory Turnover & DSI', category: 'Pricing & Margins', description: 'Calculate inventory turnover ratio, Days Sales in Inventory (DSI), and annual warehouse carrying costs.', icon: 'inventory', route: '/calculators/inventory-turnover-holding-calculator'
  },
  {
    id: 'currency-exchange-fee', slug: 'currency-exchange-fee-calculator', title: 'Currency Exchange Fee & FX Spread Calculator', shortTitle: 'Currency Exchange & FX Spread', category: 'Tax & Compliance', description: 'Calculate hidden foreign exchange bank markups, wire fees, and net conversion amounts across global currencies.', icon: 'currency_exchange', route: '/calculators/currency-exchange-fee-calculator'
  },
  {
    id: 'cash-register-change', slug: 'cash-register-change-calculator', title: 'Cash Register Change & Denominations Calculator', shortTitle: 'Cash Register Change', category: 'Cashier & POS', description: 'Instant POS cash change calculator with exact banknote and coin denomination breakdown to hand back to customers.', icon: 'point_of_sale', badge: 'POS', route: '/calculators/cash-register-change-calculator', popular: true
  },
  {
    id: 'roi', slug: 'roi-calculator', title: 'Return on Investment (ROI) Calculator', shortTitle: 'ROI Calculator', category: 'Financing & Growth', description: 'Calculate investment gain, return percentage, and net profit from an initial investment and final value.', icon: 'monitoring', badge: 'New', route: '/calculators/roi-calculator'
  },
  {
    id: 'roas', slug: 'roas-calculator', title: 'ROAS Calculator', shortTitle: 'Return on Ad Spend', category: 'Financing & Growth', description: 'Calculate revenue generated for every unit of advertising spend and the equivalent ROAS percentage.', icon: 'campaign', badge: 'New', route: '/calculators/roas-calculator'
  },
  {
    id: 'customer-acquisition-cost', slug: 'customer-acquisition-cost-calculator', title: 'Customer Acquisition Cost (CAC) Calculator', shortTitle: 'Customer Acquisition Cost', category: 'Financing & Growth', description: 'Calculate the average sales and marketing cost required to acquire each new customer.', icon: 'person_add', badge: 'New', route: '/calculators/customer-acquisition-cost-calculator'
  },
  {
    id: 'customer-lifetime-value', slug: 'customer-lifetime-value-calculator', title: 'Customer Lifetime Value (LTV) Calculator', shortTitle: 'Customer Lifetime Value', category: 'Financing & Growth', description: 'Estimate customer lifetime revenue and gross-profit value from order value, purchase frequency, lifespan, and margin.', icon: 'loyalty', badge: 'New', route: '/calculators/customer-lifetime-value-calculator'
  },
  {
    id: 'cagr', slug: 'cagr-calculator', title: 'CAGR Calculator', shortTitle: 'Compound Annual Growth Rate', category: 'Financing & Growth', description: 'Calculate the compound annual growth rate between starting and ending values over a defined period.', icon: 'show_chart', badge: 'New', route: '/calculators/cagr-calculator'
  },
  {
    id: 'discount', slug: 'discount-calculator', title: 'Discount Calculator', shortTitle: 'Sale Price & Savings', category: 'Pricing & Margins', description: 'Calculate discount savings and final sale price from an original price and percentage discount.', icon: 'sell', badge: 'New', route: '/calculators/discount-calculator'
  },
  {
    id: 'net-profit-margin', slug: 'net-profit-margin-calculator', title: 'Net Profit Margin Calculator', shortTitle: 'Net Profit Margin', category: 'Pricing & Margins', description: 'Calculate net profit margin from revenue and net profit to measure profitability as a percentage of sales.', icon: 'account_balance', badge: 'New', route: '/calculators/net-profit-margin-calculator'
  },
  {
    id: 'contribution-margin', slug: 'contribution-margin-calculator', title: 'Contribution Margin Calculator', shortTitle: 'Contribution Margin', category: 'Pricing & Margins', description: 'Calculate contribution margin and contribution margin ratio for break-even and operating planning.', icon: 'donut_small', badge: 'New', route: '/calculators/contribution-margin-calculator'
  },
  {
    id: 'percentage-change', slug: 'percentage-change-calculator', title: 'Percentage Change Calculator', shortTitle: 'Percentage Change', category: 'Pricing & Margins', description: 'Calculate percentage increases and decreases between an original value and a new value.', icon: 'percent', badge: 'New', route: '/calculators/percentage-change-calculator'
  },
  {
    id: 'price-increase', slug: 'price-increase-calculator', title: 'Price Increase Calculator', shortTitle: 'Price Increase', category: 'Pricing & Margins', description: 'Calculate a new selling price and absolute increase from a planned percentage price raise.', icon: 'trending_up', badge: 'New', route: '/calculators/price-increase-calculator'
  },
  {
    id: 'debt-to-income', slug: 'debt-to-income-calculator', title: 'Debt-to-Income Ratio Calculator', shortTitle: 'Debt-to-Income Ratio', category: 'Financing & Growth', description: 'Calculate DTI from monthly debt obligations and gross monthly income.', icon: 'credit_score', badge: 'New', route: '/calculators/debt-to-income-calculator'
  },
  {
    id: 'loan-payoff', slug: 'loan-payoff-calculator', title: 'Loan Payoff Calculator', shortTitle: 'Loan Payoff Time', category: 'Financing & Growth', description: 'Estimate how long it will take to repay a loan from the balance, interest rate and monthly payment.', icon: 'schedule', badge: 'New', route: '/calculators/loan-payoff-calculator'
  }
];
