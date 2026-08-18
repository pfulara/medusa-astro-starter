# medusa-astro-starter

An independent Astro SSR storefront for a Medusa 2 backend. This repository does not require the backend source code or a parent workspace.

## Requirements

- Node.js 22.12 or newer
- pnpm 11 (`corepack enable`)
- a Medusa 2.19 backend available over HTTPS
- a publishable API key associated with the correct sales channel

## Configuration

Copy `.env.example` to `.env`:

```dotenv
PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key
```

`BACKEND_URL` should not end with a slash. The legacy `PUBLIC_MEDUSA_BACKEND_URL`, `PUBLIC_MEDUSA_PUBLISHABLE_KEY`, and `PUBLISHABLE_KEY` names are also supported.

Add the storefront origin to both backend variables:

```dotenv
STORE_CORS=http://localhost:8000
AUTH_CORS=http://localhost:8000,http://localhost:9000
```

Without this configuration, the browser will block operations performed directly by the frontend, including cart requests. Restart the backend after changing its CORS configuration.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

The application is available at `http://localhost:8000`.

Before submitting changes, run:

```bash
pnpm exec astro check
pnpm build
```

## Production

This is an SSR application using the Node adapter, not a static site. The hosting platform must run a Node.js process and provide writable storage for `.astro/session`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
BACKEND_URL=https://api.example.com \
MEDUSA_PUBLISHABLE_KEY=pk_example \
HOST=0.0.0.0 PORT=8000 pnpm start
```

Configure the hosting platform with:

- build command: `pnpm install --frozen-lockfile && pnpm build`
- start command: `pnpm start`
- port: the value of `PORT` (the Astro configuration defaults to `8000`)
- runtime environment variables: `BACKEND_URL` and `MEDUSA_PUBLISHABLE_KEY`

The backend URL is used by the SSR server and passed to the browser-side cart code. It is not a secret. The publishable API key may also be public; never use a secret API key here.

## Independent deployment requirements

A standalone clone works without the backend repository because it uses only published npm packages and the public Medusa API. The backend must still meet all of the following requirements:

- its public URL is reachable from both the hosting server and customer browsers;
- it has a valid HTTPS certificate; an HTTPS storefront must also use an HTTPS backend;
- the storefront origin is included in `STORE_CORS` and `AUTH_CORS`;
- the publishable API key is active and associated with a sales channel;
- at least one sales region exists, and products, prices, stock locations, shipping, and payment providers are configured correctly.

## Scripts

```bash
pnpm dev      # start the development server
pnpm build    # create a production build in dist/
pnpm start    # run dist/server/entry.mjs
pnpm preview  # alias for the production start command
```
