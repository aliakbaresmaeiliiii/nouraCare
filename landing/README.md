# DoreHealth Landing (`landing/`)

Multi-language marketing site for **DoreHealth (دوره)**.

Deployed as **static files** (same idea as Angular `dist`) — no Node, no PM2.

## Develop

```bash
cd landing
npm install
npm run dev
```

## Production (like Angular dist)

```bash
cd landing
npm run build:deploy
```

That creates **`deploy-out/`** (HTML/CSS/JS/images).

### On the server

1. Stop the old Node landing if you started it:

```bash
pm2 delete dorehealth-landing
```

2. Upload **contents** of `deploy-out/` to e.g. `/home/dorehealth/landing`

3. Point nginx `dorehealth.ir` to that folder (static), see `deploy/nginx/dorehealth-landing.conf`:

```nginx
root /home/dorehealth/landing;
location = / { return 302 /fa/; }
location / { try_files $uri $uri/ $uri.html /fa/index.html; }
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### User flow

- `dorehealth.ir` → landing  
- “Open web app” → `app.dorehealth.ir` (Ionic app / your current `/home/dorehealth/web`)

## Locales

`fa` (default) · `en` · `zh` · `ms`
