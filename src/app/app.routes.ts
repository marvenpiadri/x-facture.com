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
import { ALL_DOCUMENT_TYPES } from './core/config/document-type-config';
import { XFacturePage } from './features/xfacture/pages/xfacture-page/xfacture-page';

const DOCUMENT_ROUTES: Routes = ALL_DOCUMENT_TYPES.flatMap(({ routeSegment }) => [
  { path: routeSegment, component: DocumentListPage, data: { docType: routeSegment } },
  { path: `${routeSegment}/create`, component: DocumentEditPage, data: { docType: routeSegment } },
  { path: `${routeSegment}/:docNumber/edit`, component: DocumentEditPage, data: { docType: routeSegment } },
  { path: `${routeSegment}/:docNumber/preview`, component: DocumentPreviewPage, data: { docType: routeSegment } },
  { path: `${routeSegment}/:docNumber`, redirectTo: `${routeSegment}/:docNumber/preview`, pathMatch: 'full' },
]);

export const routes: Routes = [
  { path: '', component: LandingHomePage, pathMatch: 'full' },
  { path: 'dashboard', component: DashboardHomePage },
  { path: 'store/pos', component: PosTerminalPage },
  { path: 'ledger', component: LedgerViewPage },
  { path: 'clients', component: ClientsHubPage },
  { path: 'products', component: ProductsHubPage },
  { path: 'settings', component: SettingsHubPage },

  { path: 'invoice/xfacture', component: XFacturePage, title: 'XFacture Invoice Generator | CII & UBL XML | X-Facture', data: { description: 'Generate structured invoice XML with X-Facture. Export CII and UBL invoice data locally from your invoice.' } },
  { path: 'xfacture', redirectTo: 'invoice/xfacture', pathMatch: 'full' },

  ...DOCUMENT_ROUTES,

  { path: '**', redirectTo: '' },
];
