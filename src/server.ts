import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const angularApp = new AngularAppEngine({
  allowedHosts: [
    'x-facture.com',
    'www.x-facture.com',
    'localhost',
    '127.0.0.1',
    '*.workers.dev',
  ],
});

const publicSeoPagePattern =
  /^(?:\/(?:calculators(?:\/[^/?#]+)?|pdf(?:\/[^/?#]+)?|invoice\/xfacture|(?:invoices|proforma-invoices|commercial-invoices|quotes|purchase-orders|receipts|credit-notes|delivery-notes|timesheet-invoices|work-orders|statements|service-agreements|retainer-invoices|bills-of-lading|custom-documents)(?:\/create)?|store\/pos|ledger|clients|products)?)$/;

const handleRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  if (url.hostname === 'www.x-facture.com' || url.protocol === 'http:') {
    url.protocol = 'https:';
    url.hostname = 'x-facture.com';
    return Response.redirect(url.toString(), 308);
  }

  const response = await angularApp.handle(request);

  if (!response) {
    return new Response('Not Found', { status: 404 });
  }

  if (
    request.method === 'GET' &&
    publicSeoPagePattern.test(url.pathname)
  ) {
    const headers = new Headers(response.headers);
    headers.set(
      'Cache-Control',
      'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
};

/**
 * Angular CLI request handler used during SSR builds and local server integration.
 */
export const reqHandler = createRequestHandler(handleRequest);

/**
 * Cloudflare Workers entry point.
 * Static files are served through the Workers Assets binding; extensionless
 * application routes continue through Angular SSR.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Canonicalize before serving assets so www and HTTP requests redirect too.
    if (url.hostname === 'www.x-facture.com' || url.protocol === 'http:') {
      return reqHandler(request);
    }

    if (
      (request.method === 'GET' || request.method === 'HEAD') &&
      url.pathname.includes('.')
    ) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    return reqHandler(request);
  },
};
