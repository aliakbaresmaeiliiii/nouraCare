# DoreHealth production deployment

Production domains:
- Marketing landing: `https://dorehealth.ir` (Next.js in `landing/`)
- App PWA: `https://app.dorehealth.ir` or `https://dorehealth.app` (Ionic in `client/`)
- API: `https://api.dorehealth.ir`

## 1. Server `.env`

Copy `server/.env.example` → `server/.env` and set:

```env
NODE_ENV=production
JWT_SECRET=<openssl rand -hex 32>
DB_PASSWORD=<strong-password>
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=dorehealth
DB_NAME=dorehealth
GOOGLE_CLIENT_IDS=1088321651982-l914r5o4bj5c73cua6qdcg0ttjnd8hbh.apps.googleusercontent.com
APPLE_CLIENT_IDS=com.tecknnycs.dorehealth,com.tecknnycs.dorehealth.signin
CORS_ORIGINS=capacitor://localhost,https://localhost,https://dorehealth.ir,https://www.dorehealth.ir,https://app.dorehealth.ir
BASE_URL=https://api.dorehealth.ir
PORT=3000
HOST=0.0.0.0
```

**Important:** include `https://app.dorehealth.ir` in `CORS_ORIGINS` or the web app cannot call the API.

**Phone OTP:** set `SMS_IR_API_KEY`, `SMS_IR_LINE_NUMBER`, and a real `SMS_IR_VERIFY_TEMPLATE_ID` (sms.ir verify template). Without these, email login still works but phone login returns “SMS sign-in is not configured”. Param name (`SMS_IR_VERIFY_PARAM_NAME`) must match the template placeholder (`OTP` vs `Code`).

## 2. Docker (API + MySQL)

```bash
cd deploy
cp .env.example .env   # edit secrets — include SMS_IR_* for phone login
docker compose up -d --build
```

API: `http://localhost:3000/api/v1/` (put nginx TLS in front for production).

On a healthy phone-OTP setup, API logs should show `sms.ir ready (line=..., verifyTemplate=...)`, not `sms.ir is NOT configured`.

## 3. nginx + TLS (recommended)

1. Point DNS `api.dorehealth.ir` → your VPS IP.
2. Install nginx + certbot.
3. Copy `deploy/nginx/dorehealth-api.conf` → `/etc/nginx/sites-available/`
4. `sudo certbot --nginx -d api.dorehealth.ir`
5. `sudo nginx -t && sudo systemctl reload nginx`

## 4. Landing (marketing site)

```bash
cd landing
npm install
npm run build
PORT=3001 npm start
```

Use `deploy/nginx/dorehealth-landing.conf` to terminate TLS on `dorehealth.ir` and proxy to port `3001`.

## 5. Client production build

Edit `client/src/environments/environment.prod.ts`:
- `PROD_API_ORIGIN`
- `googleIOSClientId` (from Google Cloud iOS OAuth client)
- `appleServiceId` / `appleRedirectUrl` (Apple Developer)

```bash
cd client
npm run build:prod
npm run cap:sync:prod
```

## 6. Store checklist

- [ ] HTTPS API live
- [ ] Privacy policy URL (`environment.prod.ts` → `privacyPolicyUrl`)
- [ ] Google Play Data safety + App Store Privacy labels
- [ ] Sign in with Apple enabled in Apple Developer for bundle `com.tecknnycs.dorehealth`
- [ ] Test: register, email OTP login, phone OTP login, Google, Apple, delete account

See also: `SECURITY_HARDENING.md`
