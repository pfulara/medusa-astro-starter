# medusa-astro-starter

Niezależny storefront Astro SSR dla backendu Medusa 2. Repozytorium nie wymaga kodu backendu ani nadrzędnego workspace'u.

## Wymagania

- Node.js 22.12 lub nowszy
- pnpm 11 (`corepack enable`)
- dostępny przez HTTPS backend Medusa 2.19
- publishable API key przypisany do właściwego sales channel

## Konfiguracja

Skopiuj `.env.example` do `.env`:

```dotenv
BACKEND_URL=http://localhost:9000
MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key
```

`BACKEND_URL` nie powinien kończyć się ukośnikiem. Obsługiwane są też wcześniejsze nazwy `PUBLIC_MEDUSA_BACKEND_URL`, `PUBLIC_MEDUSA_PUBLISHABLE_KEY` i `PUBLISHABLE_KEY`.

Po stronie backendu ustaw origin storefrontu w obu zmiennych:

```dotenv
STORE_CORS=http://localhost:8000
AUTH_CORS=http://localhost:8000,http://localhost:9000
```

Bez tego przeglądarka zablokuje operacje wykonywane bezpośrednio z frontendu (m.in. koszyk). Zmiana CORS wymaga restartu backendu.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Aplikacja jest dostępna pod `http://localhost:8000`.

Przed wysłaniem zmian uruchom:

```bash
pnpm exec astro check
pnpm build
```

## Produkcja

To aplikacja SSR z adapterem Node, a nie zestaw plików statycznych. Platforma musi uruchamiać proces Node i udostępnić zapisywalną przestrzeń dla sesji `.astro/session`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
BACKEND_URL=https://api.example.com \
MEDUSA_PUBLISHABLE_KEY=pk_example \
HOST=0.0.0.0 PORT=8000 pnpm start
```

Na platformie hostingowej ustaw:

- build command: `pnpm install --frozen-lockfile && pnpm build`
- start command: `pnpm start`
- port: wartość zmiennej `PORT` (domyślnie konfiguracja Astro używa `8000`)
- runtime env: `BACKEND_URL` i `MEDUSA_PUBLISHABLE_KEY`

URL backendu jest używany zarówno przez serwer SSR, jak i przekazywany do kodu koszyka w przeglądarce. Nie jest sekretem. Publishable API key również może być publiczny; nie używaj tu secret API key.

## Warunki niezależnego wdrożenia

Samodzielny klon działa bez repo backendu, ponieważ korzysta wyłącznie z opublikowanych pakietów npm i publicznego API Medusy. Backend musi jednak spełnić wszystkie poniższe warunki:

- publiczny URL jest osiągalny z serwera hostingu oraz przeglądarek klientów;
- certyfikat HTTPS jest poprawny (na stronie HTTPS backend także musi używać HTTPS);
- origin storefrontu znajduje się w `STORE_CORS` i `AUTH_CORS`;
- publishable key jest aktywny i przypisany do sales channel;
- istnieje przynajmniej jeden region sprzedaży; produkty, ceny, stock location, shipping i provider płatności są poprawnie skonfigurowane.

## Skrypty

```bash
pnpm dev      # serwer developerski
pnpm build    # build produkcyjny do dist/
pnpm start    # uruchomienie dist/server/entry.mjs
pnpm preview  # alias startu produkcyjnego
```
