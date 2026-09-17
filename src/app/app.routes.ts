import { Routes } from '@angular/router';
import { LandingHomePage } from './features/landing/pages/landing-home/landing-home';
import { DashboardHomePage } from './features/dashboard/pages/dashboard-home/dashboard-home';
import { PosTerminalPage } from './features/pos/pages/pos-terminal/pos-terminal';
import { LedgerViewPage } from './features/ledger/pages/ledger-view/ledger-view';
import { ClientsHubPage } from './features/crm/pages/clients-hub/clients-hub';
import { ProductsHubPage } from './features/catalog/pages/products-hub/products-hub';
import { SettingsHubPage } from './features/settings/pages/settings-hub/settings-hub';
import { DocumentListPage } from './features/documents/pages/document-list/document-list';
import { DocumentEditPage } from './features/documents/pages/document-edit/document-edit';
import { DocumentPreviewPage } from './features/documents/pages/document-preview/document-preview';
import { CalculatorsHubPage } from './calculators/calculators-hub';

// Standalone SEO-Optimized Financial Calculators
import { StripePaypalFeeCalculatorComponent } from './calculators/stripe-paypal-fee-calculator/stripe-paypal-fee-calculator.component';
import { CashBurnRunwayCalculatorComponent } from './calculators/cash-burn-runway-calculator/cash-burn-runway-calculator.component';
import { GrossMarginMarkupCalculatorComponent } from './calculators/gross-margin-markup-calculator/gross-margin-markup-calculator.component';
import { LateFeeInterestCalculatorComponent } from './calculators/late-fee-interest-calculator/late-fee-interest-calculator.component';
import { SalesTaxVatSplitterComponent } from './calculators/sales-tax-vat-splitter/sales-tax-vat-splitter.component';
import { BreakEvenSalesCalculatorComponent } from './calculators/break-even-sales-calculator/break-even-sales-calculator.component';
import { CommercialLoanEmiCalculatorComponent } from './calculators/commercial-loan-emi-calculator/commercial-loan-emi-calculator.component';
import { HourlyFreelanceRateCalculatorComponent } from './calculators/hourly-freelance-rate-calculator/hourly-freelance-rate-calculator.component';
import { InventoryTurnoverHoldingCalculatorComponent } from './calculators/inventory-turnover-holding-calculator/inventory-turnover-holding-calculator.component';
import { CurrencyExchangeFeeCalculatorComponent } from './calculators/currency-exchange-fee-calculator/currency-exchange-fee-calculator.component';
import { CashRegisterChangeCalculatorComponent } from './calculators/cash-register-change-calculator/cash-register-change-calculator.component';
import { CompoundWorkingCapitalCalculatorComponent } from './calculators/compound-working-capital-calculator/compound-working-capital-calculator.component';

export const routes: Routes = [
  { path: '', component: LandingHomePage, pathMatch: 'full' },
  { path: 'home', component: LandingHomePage },
  { path: 'dashboard', component: DashboardHomePage },
  { path: 'store/pos', component: PosTerminalPage },
  { path: 'ledger', component: LedgerViewPage },
  { path: 'clients', component: ClientsHubPage },
  { path: 'products', component: ProductsHubPage },
  { path: 'settings', component: SettingsHubPage },

  // Calculator SEO hub — must precede the generic document route.
  { path: 'calculators', component: CalculatorsHubPage },
  { path: 'calculators/stripe-paypal-fee-calculator', component: StripePaypalFeeCalculatorComponent },
  { path: 'calculators/cash-burn-runway-calculator', component: CashBurnRunwayCalculatorComponent },
  { path: 'calculators/gross-margin-markup-calculator', component: GrossMarginMarkupCalculatorComponent },
  { path: 'calculators/late-fee-interest-calculator', component: LateFeeInterestCalculatorComponent },
  { path: 'calculators/sales-tax-vat-splitter', component: SalesTaxVatSplitterComponent },
  { path: 'calculators/break-even-sales-calculator', component: BreakEvenSalesCalculatorComponent },
  { path: 'calculators/commercial-loan-emi-calculator', component: CommercialLoanEmiCalculatorComponent },
  { path: 'calculators/hourly-freelance-rate-calculator', component: HourlyFreelanceRateCalculatorComponent },
  { path: 'calculators/inventory-turnover-holding-calculator', component: InventoryTurnoverHoldingCalculatorComponent },
  { path: 'calculators/currency-exchange-fee-calculator', component: CurrencyExchangeFeeCalculatorComponent },
  { path: 'calculators/cash-register-change-calculator', component: CashRegisterChangeCalculatorComponent },
  { path: 'calculators/compound-working-capital-calculator', component: CompoundWorkingCapitalCalculatorComponent },

  { path: ':docType', component: DocumentListPage },
  { path: ':docType/new', component: DocumentEditPage },
  { path: ':docType/:docNumber/edit', component: DocumentEditPage },
  { path: ':docType/:docNumber/preview', component: DocumentPreviewPage },
  { path: ':docType/:docNumber', redirectTo: ':docType/:docNumber/preview', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
