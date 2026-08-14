# Pacekeeper

Night-out BAC tracker using the Widmark formula.
Profile hardcoded to 75 kg male. Adjust constants in src/utils/bac.js.

## Run locally

```
npm install && npm run dev
```

## Deploy to Vercel (recommended)

Push to GitHub → import at vercel.com → done (auto-detected as Vite).
Change vite.config.js base to '/' before deploying to Vercel.

## Deploy to GitHub Pages

```
npm install --save-dev gh-pages
```

Add to package.json: `"deploy": "npm run build && gh-pages -d dist"`

Run: `npm run deploy`

## Disclaimer

BAC estimates are for harm-reduction guidance only. Not for legal decisions (driving, etc.).
