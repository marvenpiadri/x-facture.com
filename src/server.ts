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
app.set('trust proxy', true);

// Enforce the single canonical public URL: https://x-facture.com.
// Vercel terminates TLS before the function, so inspect the forwarded protocol.
app.use((req, res, next) => {
  const host = req.get('host')?.split(':')[0].toLowerCase() ?? '';
  const forwardedProto = String(req.get('x-forwarded-proto') ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const isCanonicalHost = host === 'x-facture.com';
  const isAliasHost = host === 'www.x-facture.com';
  const shouldRedirectToHttps = (isCanonicalHost || isAliasHost) && forwardedProto === 'http';

  if (shouldRedirectToHttps || isAliasHost) {
    const query = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    return res.redirect(308, `https://x-facture.com${req.path}${query}`);
  }

  next();
});

const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['x-facture.com'],
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
