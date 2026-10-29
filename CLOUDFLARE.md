# Cloudflare Workers deployment

X-Facture is configured as an Angular SSR application running directly on Cloudflare Workers.

## Local setup

```bash
npm install
npm run dev
```

## Run against the Workers runtime

Build the Angular browser and server bundles, then start Wrangler locally:

```bash
npm run preview
```

## Production deployment

Authenticate Wrangler with the Cloudflare account that owns the `x-facture.com` zone, then run:

```bash
npx wrangler login
npm run deploy
```

The Worker is named `x-facture`. Wrangler deploys the server bundle at `dist/server/server.mjs` and publishes browser assets from `dist/browser`.

## Custom domain

The first deployment creates the Worker and its `workers.dev` address. Then, in Cloudflare:

1. Open **Workers & Pages** and select `x-facture`.
2. Open **Settings → Domains & Routes**.
3. Add `x-facture.com` as a custom domain.
4. Add `www.x-facture.com` as a second custom domain if it should redirect to the apex domain.

The Worker redirects `www.x-facture.com` to `https://x-facture.com`, preserving the path and query string. Cloudflare should manage HTTPS for both custom domains.

## Runtime notes

- Angular SSR uses the Web-standard `Request` and `Response` APIs; the Worker does not use Express or Node's HTTP server.
- Static files are served through the Workers Assets binding. Extensionless application routes are handled by Angular SSR.
- Public SEO routes retain short edge-cache headers; user-specific and application routes are not assigned shared caching here.
- The existing browser-side persistence and API integrations are left intact. No database, authentication provider, or Cloudflare storage binding is provisioned as part of this deployment preparation.
- Add production secrets with `npx wrangler secret put SECRET_NAME`; never commit secret values.
