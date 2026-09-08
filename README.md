# TA Solutions Currency Converter

A mobile-first currency converter built with React, Bootstrap, and NestJS. It loads every currency supported by FreeCurrencyAPI, keeps a persistent local conversion history, and supports historical exchange rates.

## Features

- Dynamic supported-currency dropdowns from the API
- Live and historical conversions
- Secure API-key usage through the NestJS backend
- Loading states and helpful API errors
- Persistent conversion history (browser `localStorage`)
- Swap currencies, clear history, and accessible form controls
- Responsive, mobile-first Bootstrap interface

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A [FreeCurrencyAPI](https://freecurrencyapi.com/) API key

## Run locally

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `server/.env` and add your API key:

   ```env
   CURRENCY_API_KEY=your_key_here
   PORT=3000
   CLIENT_URL=http://localhost:5173
   ```

3. Start both applications:

   ```bash
   npm run dev
   ```

4. Open <http://localhost:5173>. The NestJS API runs at <http://localhost:3000/api>.

## Test and build

```bash
npm test
npm run build
```

You can also verify the backend health endpoint at <http://localhost:3000/api/health>.

## Deployment

The repository includes `render.yaml` for the NestJS backend and `netlify.toml` for the React frontend.

### 1. Deploy the backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Render detects `render.yaml`. Set the secret `CURRENCY_API_KEY` when prompted.
4. After deployment, copy the public backend URL, for example `https://your-service.onrender.com`.
5. In the Render service environment, set `CLIENT_URL` to your final Netlify URL once it exists. Multiple comma-separated URLs are supported.

### 2. Deploy the frontend on Netlify

1. Choose **Add new site > Import an existing project** and connect the same repository.
2. Netlify reads `netlify.toml` automatically.
3. Add an environment variable named `VITE_API_URL` with the value `https://your-service.onrender.com/api`.
4. Deploy, then update Render's `CLIENT_URL` with this Netlify site URL and redeploy the backend.

Note: Render free services may take a short time to wake after inactivity. The UI displays a loader while it connects.

## Push to GitHub

Create an empty public GitHub repository, then run from this folder:

```bash
git init
git add .
git commit -m "Build full-stack currency converter"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit `server/.env`; it is excluded by `.gitignore`.

## API routes

- `GET /api/health`
- `GET /api/currencies`
- `GET /api/convert?from=USD&to=EUR&amount=100`
- `GET /api/convert?from=USD&to=EUR&amount=100&date=2024-01-15`

