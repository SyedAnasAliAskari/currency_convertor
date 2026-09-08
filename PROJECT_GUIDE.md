# Currency Converter — Essential Project Guide

## Architecture

```text
User
  ↓
React client (forms, loaders, results, local history)
  ↓  /api/currencies or /api/convert
NestJS server (validation, API-key protection, conversion logic)
  ↓  apikey header
FreeCurrencyAPI
```

The React client never sees the FreeCurrencyAPI key. Only NestJS reads it from `server/.env` and contacts the external API.

Conversion history stays in the user's browser through `localStorage`; it is not stored by the server.

## Essential folder structure

```text
currency-converter/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CurrencySelect.tsx
│   │   │   └── HistoryList.tsx
│   │   ├── hooks/useLocalStorage.ts
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   ├── App.test.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── types.ts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
├── server/
│   ├── src/
│   │   ├── currency/
│   │   │   ├── convert-query.dto.ts
│   │   │   ├── currency.controller.ts
│   │   │   ├── currency.module.ts
│   │   │   ├── currency.service.ts
│   │   │   └── currency.service.spec.ts
│   │   ├── app.module.ts
│   │   ├── health.controller.ts
│   │   └── main.ts
│   │   ├── package.json
│   └── Nest/TypeScript test and build configuration
├── .gitignore
├── netlify.toml
├── render.yaml
├── package.json
└── README.md
```

Generated folders such as `node_modules`, `client/dist`, and `server/dist` are intentionally ignored. They can always be recreated.

## Runtime flow

### 1. Loading currencies

1. `main.tsx` renders `App.tsx`.
2. `App.tsx` shows a loader and calls `currencyApi.getCurrencies()` inside `useEffect`.
3. `api.ts` requests `GET /api/currencies`.
4. `currency.controller.ts` passes the request to `CurrencyService`.
5. `currency.service.ts` requests `/v1/currencies` from FreeCurrencyAPI using the private API key.
6. The service normalizes and sorts the currencies, then caches them for 12 hours.
7. React stores the list in state and builds both dropdowns dynamically.

### 2. Latest conversion

1. The user enters an amount and selects the source and target currencies.
2. `App.tsx` calls `/api/convert?from=USD&to=EUR&amount=100`.
3. `convert-query.dto.ts` validates and transforms the query.
4. `CurrencyService` requests the FreeCurrencyAPI `/v1/latest` endpoint.
5. The server calculates `amount × rate` and returns the result.
6. React displays the result and adds it to conversion history.

### 3. Historical conversion

1. The user enables historical mode and selects a date.
2. React includes `date=YYYY-MM-DD` in `/api/convert`.
3. NestJS ensures the date is between `1999-01-01` and yesterday.
4. `CurrencyService` uses `/v1/historical` instead of `/v1/latest`.
5. The result and saved history identify the selected rate date.

### 4. Persistent history

1. A successful conversion creates a history entry with the values, rate, optional rate date, and current timestamp.
2. `useLocalStorage.ts` writes the history array under `flux-conversion-history-v1`.
3. When the page reloads, the hook reads that value back into React state.
4. `HistoryList.tsx` displays the saved conversions and localized date/time.

## Important files

### Client

| File | Responsibility |
|---|---|
| `client/src/main.tsx` | Loads Bootstrap, icons, styles, and mounts React. |
| `client/src/App.tsx` | Owns the form, hooks, loaders, errors, result, swapping, historical mode, and history state. |
| `client/src/api.ts` | Contains all browser-to-NestJS requests and shared response/error handling. |
| `client/src/types.ts` | Defines currency, conversion-result, and history TypeScript types. |
| `client/src/components/CurrencySelect.tsx` | Reusable controlled currency dropdown. |
| `client/src/components/HistoryList.tsx` | Displays or clears persisted conversion records. |
| `client/src/hooks/useLocalStorage.ts` | Synchronizes React state with browser storage. |
| `client/src/styles.css` | Mobile-first design and responsive desktop enhancements. |
| `client/src/App.test.tsx` | Tests currency loading and form readiness with a mocked API. |
| `client/vite.config.ts` | Runs Vite on port 5173 and proxies local `/api` calls to NestJS. |

### Server

| File | Responsibility |
|---|---|
| `server/src/main.ts` | Starts NestJS, enables CORS/validation, adds `/api`, and selects the port. |
| `server/src/app.module.ts` | Loads environment configuration and application modules/controllers. |
| `server/src/health.controller.ts` | Provides `GET /api/health` for uptime checks. |
| `server/src/currency/currency.module.ts` | Registers the controller, service, and configured HTTP client. |
| `server/src/currency/currency.controller.ts` | Defines `/currencies` and `/convert` routes. |
| `server/src/currency/convert-query.dto.ts` | Validates currency codes, amount, and optional date. |
| `server/src/currency/currency.service.ts` | Calls FreeCurrencyAPI, protects the key, caches currencies, calculates results, and handles errors. |
| `server/src/currency/currency.service.spec.ts` | Tests core backend behavior without using API quota. |

### Root and deployment

| File | Responsibility |
|---|---|
| `package.json` | Coordinates client/server workspaces and shared commands. |
| `package-lock.json` | Locks exact dependency versions for repeatable installs. |
| `.gitignore` | Excludes secrets, dependencies, caches, and compiled output. |
| `README.md` | Quick setup, test, Git, API-route, and deployment instructions. |
| `render.yaml` | Configures the NestJS backend deployment on Render. |
| `netlify.toml` | Configures the React build and SPA fallback on Netlify. |

## Environment variables

Create `server/.env` locally:

```env
CURRENCY_API_KEY=your_freecurrencyapi_key
PORT=3000
CLIENT_URL=http://localhost:5173
```

For deployment:

- Render needs `CURRENCY_API_KEY` and `CLIENT_URL`.
- Netlify needs `VITE_API_URL=https://your-render-service.onrender.com/api`.
- Never expose the key through a variable beginning with `VITE_`.

## Commands

Install and run both applications:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Test and build:

```bash
npm test
npm run build
```

The build command recreates `client/dist` and `server/dist` when they are needed.

## API routes

```text
GET /api/health
GET /api/currencies
GET /api/convert?from=USD&to=EUR&amount=100
GET /api/convert?from=USD&to=EUR&amount=100&date=2024-01-15
```

## Quick manual test

1. Confirm the currencies load into both dropdowns.
2. Perform a current conversion.
3. Swap the currencies and convert again.
4. Perform a historical conversion.
5. Refresh and confirm the history remains.
6. Confirm each history record shows a date and time.
7. Run `npm test` and `npm run build` before pushing.
