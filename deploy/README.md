# NouraCare production deployment

Replace `api.nouracare.com` with your domain everywhere below.

## 1. Server `.env`

Copy `server/.env.example` → `server/.env` and set:

```env
NODE_ENV=production
JWT_SECRET=<openssl rand -hex 32>
DB_PASSWORD=<strong-password>
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=nouracare
DB_NAME=nouracare
GOOGLE_CLIENT_IDS=1088321651982-l914r5o4bj5c73cua6qdcg0ttjnd8hbh.apps.googleusercontent.com
APPLE_CLIENT_IDS=com.tecknnycs.nouracare,com.tecknnycs.nouracare.signin
CORS_ORIGINS=capacitor://localhost,https://localhost,https://api.nouracare.com
BASE_URL=https://api.nouracare.com
PORT=3000
HOST=0.0.0.0
```

## 2. Docker (API + MySQL)

```bash
cd deploy
cp .env.example .env   # edit secrets
docker compose up -d --build
```

API: `http://localhost:3000/api/v1/` (put nginx TLS in front for production).

## 3. nginx + TLS (recommended)

1. Point DNS `api.nouracare.com` → your VPS IP.
2. Install nginx + certbot.
3. Copy `deploy/nginx/nouracare-api.conf` → `/etc/nginx/sites-available/`
4. `sudo certbot --nginx -d api.nouracare.com`
5. `sudo nginx -t && sudo systemctl reload nginx`

## 4. Client production build

Edit `client/src/environments/environment.prod.ts`:
- `PROD_API_ORIGIN`
- `googleIOSClientId` (from Google Cloud iOS OAuth client)
- `appleServiceId` / `appleRedirectUrl` (Apple Developer)

```bash
cd client
npm run build:prod
npm run cap:sync:prod
```

## 5. Store checklist

- [ ] HTTPS API live
- [ ] Privacy policy URL (`environment.prod.ts` → `privacyPolicyUrl`)
- [ ] Google Play Data safety + App Store Privacy labels
- [ ] Sign in with Apple enabled in Apple Developer for bundle `com.tecknnycs.nouracare`
- [ ] Test: register, email OTP login, Google, Apple, delete account

See also: `SECURITY_HARDENING.md`
