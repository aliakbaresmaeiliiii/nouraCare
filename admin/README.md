# DoreHealth Admin

Internal operations console for DoreHealth. Separate from the Ionic consumer app.

## Run locally

1. Start the API (`server/`) on port `3000`.
2. Promote an admin (seed already creates `admin@dorehealth.app`, or set `ADMIN_EMAILS` and re-seed / update role in DB).
3. From this folder:

```bash
npm start
```

Open [http://localhost:4300](http://localhost:4300).

Sign in with the same email OTP flow as the main app. Only users with `role = ADMIN` can enter.

## What it covers (phase 1)

- Dashboard overview (users, signups, doctors, appointments, community)
- User search / suspend / promote admin
- Doctor verification
- Appointment list
- Forum moderation (pin / lock / delete)
- Subscription tier summary

Health data stays aggregate-only (no cycle logs or symptoms in admin).

## Production

Build with `npm run build:prod`. Point `environment.prod.ts` `apiBaseUrl` at your API and add the admin origin to `CORS_ORIGINS`.
