import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

export const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['*'],
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

const publicSeoPagePattern = /^(?:\/(?:calculators(?:\/[^/?#]+)?|pdf(?:\/[^/?#]+)?|invoice\/xfacture|(?:invoices|proforma-invoices|commercial-invoices|quotes|purchase-orders|receipts|credit-notes|delivery-notes|timesheet-invoices|work-orders|statements|service-agreements|retainer-invoices|bills-of-lading|custom-documents)(?:\/create)?|store\/pos|ledger|clients|products)?)$/;

app.use((req, res, next) => {
  if (req.method === 'GET' && publicSeoPagePattern.test(req.path)) {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  }
  next();
});

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch((error) => {
      console.error('SSR Error:', error);
      next(error);
    });
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
