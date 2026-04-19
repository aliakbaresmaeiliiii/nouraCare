# NouraCare (Gahvareh repository) — project source for documentation

This document summarizes the **Gahvareh** monorepo: a mobile-first **women’s and family health** product shipped as **NouraCare** (Ionic + Angular client, NestJS API, MySQL via Prisma). Use it as primary source material for product briefs, architecture decks, onboarding docs, and security reviews.

---

## 1. Product intent and audience

- **Working name / package**: Client npm package is `nouracare-app`; Capacitor **app id** is `com.tecknnycs.nouracare`, **app name** `NouraCare`.
- **Positioning** (from `client/package.json` and internal specs): a **family-friendly** app with keywords including **Islamic** and **family**, focused on **cycle tracking**, **pregnancy**, **symptoms**, **community**, and **trustworthy** health-adjacent experiences.
- **Design direction** (see `docs/calm-private-health-tracker/`): **Calm, private health tracker** — Malaysia-oriented MVP framing: **no gamification**, mobile-first, emphasis on **privacy**, **trust**, cycle timeline, pregnancy tracker, symptom logging.

---

## 2. Repository layout

| Path | Role |
|------|------|
| `client/` | Ionic 8 + Angular 21 SPA/PWA; Capacitor Android wrapper; Tailwind 4; Mapbox; real-time client deps (`socket.io-client`). |
| `server/` | NestJS 11 API; Prisma 7 + **MySQL**; JWT/auth; scheduled jobs; static uploads. |
| `docs/` | Product/spec markdown (e.g. calm-private-health-tracker phases, UX principles). |

There is **no single root `package.json`**; install and run **client** and **server** separately.

---

## 3. Technology stack

### Client (`client/`)

- **Framework**: Angular **21**, Ionic **8**, **standalone** components (per `angular.json` schematics).
- **Build**: `ngx-build-plus` browser builder, **module federation** dev script (`run:all`).
- **Styling**: SCSS + **Tailwind CSS 4** (PostCSS).
- **Native**: **Capacitor 8** (Android present); plugins include App, Haptics, Keyboard, Share, Status Bar; **@capgo/capacitor-social-login** (Google enabled in `capacitor.config.ts`).
- **Maps / geo UI**: Mapbox GL; Neshan API referenced in environment config (Iran-region maps — verify product region vs. Malaysia spec).
- **Auth libraries**: `angular-auth-oidc-client` (reserved for OIDC); app also uses custom JWT flow (interceptors, guards).
- **Other**: Swiper, Three.js, ngx-image-cropper, RxJS 7.

### Server (`server/`)

- **Framework**: NestJS **11**, Express platform, global prefix **`api/v1`**.
- **ORM**: Prisma **7**, datasource **MySQL** (`schema.prisma`).
- **Auth**: `@nestjs/jwt`, Passport (JWT strategy), bcrypt for passwords, refresh tokens in DB.
- **Infra**: `@nestjs/schedule`; static files under `/uploads/` from `server/public/uploads`; **CORS** allows all origins in `main.ts` (tighten for production).
- **Email**: Nodemailer + Mailgun transport; Handlebars HTML templates under `server/public/template/email/`.
- **Firebase** appears as a server dependency (push or admin usage — confirm in `AuthModule` / services).

### Database

- **Primary store**: MySQL, modeled in `server/prisma/schema.prisma`.
- Migrations live under `server/prisma/migrations/`; optional `db push` / `seed` documented in `server/README.md` (Malaysia cities seed).

---

## 4. Backend modules (NestJS)

`AppModule` wires:

| Module | Purpose (high level) |
|--------|----------------------|
| `PrismaModule` | DB access |
| `AuthModule` | Registration, login, JWT, email verification |
| `UserModule` | Profiles, period tracker DTOs, user APIs |
| `GeoModule` | Cities, districts, user addresses (`GET/POST` patterns in server README) |
| `OnboardingModule` | First-run onboarding; persists `onboarding_data` |
| `TrackDayModule` | Daily mood/energy/symptoms (`trackday` model) |
| `DoctorsModule` | Doctor listings, profiles, consultation metadata |
| `SecretChatsModule` | Private chats: posts, media, comments, likes, messages, reads |
| `ForumModule` | Public-style forums: categories, forums, threads, posts, comments, likes |
| `ReproductiveModule` | Single source of truth for **reproductive state** + cycle/pregnancy/planning |
| `HealthEngagementModule` | Engagement scores, notification throttling, `user_app_open`, health notification log |
| `SubscriptionModule` | Freemium / trial / premium tiers (`user_subscription`) |
| `GrowthModule` | Referral codes, referrals, growth points, check-in streaks (see `user_engagement`) |

**HTTP entry**: `server/src/main.ts` — listens on `PORT` (default **3000**), host `0.0.0.0`; global API prefix `api/v1`. Note: code reads TLS cert files but currently creates an **HTTP** Nest app (HTTPS options present but not passed — verify deployment intent).

---

## 5. Reproductive health architecture (authoritative backend design)

Documented in `server/REPRODUCTIVE_STATE_FLOW.md`:

- **`reproductive_state`** is the **only** source of truth for the user’s current **mode** (`CYCLE`, `PLANNING`, `PREGNANT`, `POSTPARTUM`).
- **Domain tables** hold details, not UI mode: `pregnancy`, `pregnancy_planning`, `cycle_data` (includes adaptive cycle length and prediction error JSON for smarter period prediction).
- **Intended API pattern**:
  - `POST /onboarding` — initialize state and upsert domain rows.
  - `GET /me/dashboard` — unified dashboard payload from state + computed fields.
  - `PATCH /me/state` — controlled transitions (e.g. closing pregnancy with `endDate` when leaving `PREGNANT`).
- **Rule**: Do not infer current mode from domain tables alone; do not duplicate mode on `pregnancy` / planning / cycle rows.

---

## 6. Major Prisma models (data overview)

Representative entities (not exhaustive):

- **Users & profile**: `user`, `user_profile`, `refresh_tokens`, addresses via `address` + `city` + `district`.
- **Tracking**: `trackday`, `period_logs`, symptom-related text fields on track days.
- **Reproductive**: `reproductive_state`, `pregnancy`, `pregnancy_planning`, `cycle_data`.
- **Community**: `forum_categories`, `forums`, `forum_threads`, `forum_posts`, `forum_comments`, likes.
- **Secret social**: `secret_chats`, `chat_members`, `posts`, `post_media`, `post_likes`, nested comment models in forum vs secret-chat naming (see schema for `forum_comment_likes` vs chat message models).
- **Messaging**: `chat_messages`, `message_reads`.
- **Engagement & monetization**: `user_engagement`, `user_app_open`, `health_notification_log`, `user_subscription`, `referral_code`, `referral`.
- **Providers**: `doctors`.

Enum highlights: `reproductive_state_state`, `user_subscription_tier` (`FREE`, `PREMIUM_TRIAL`, `PREMIUM`), `user_role`, `user_status`.

---

## 7. Client application structure

### Routing (`client/src/app/app.routes.ts`)

- **Initial route guard** drives first-launch vs authenticated landing (`initialRouteGuard`).
- **Auth routes**: `auth/sign-in`, `auth/verify-email`.
- **Onboarding / welcome**: `onboarding`, `welcome`.
- **Main shell**: `tabs` → `LayoutComponent` (authenticated) with children:
  - `tabs/home`, `tabs/insights`, `tabs/secret-chats`, `tabs/consultation`, `tabs/school`, `tabs/about`.
- **Health & cycle**: `period-date-picker`, `period-edit`, `cycle-calendar`, `symptoms-tracker`, `symptoms-detail`, `symptoms-history`, `week-detail`, `pregnancy-planning`, `pregnancy-journey`, `postpartum`, `reproductive-status`.
- **Social / content**: `forums`, `forums/topic/:id`, `forums/create-post`, `article/:id`, `notifications`, `chatbot`.
- **Account & settings**: `profile`, `edit-profile`, `settings`, `saved-information`, `my-friends`, `blocked-users`, `invite-friends`, `my-favorites`, `check-version`.
- **Directory / tools**: `doctors`, `doctor/:id`, `tools` (if routed elsewhere — component exists).
- **Special**: `pregnancy` path loads **`ReactWrapperComponent`** — hybrid shell for a React island (embed or federated UI); confirm build pipeline for production.

### Cross-cutting client concerns

- **Guards**: `authGuard` on protected routes; JWT **interceptor** attaches tokens.
- **Services** (under `shared/services/`): onboarding, reproductive status, forum, doctors, track data, period history, theme, language, translation, connectivity, notifications unread, etc.
- **i18n**: Angular XLF locales (`messages.en.xlf`, `messages.zh.xlf`, `messages.ms.xlf`) with `build:en` / `build:zh` / `build:ms` and matching serve configs in `angular.json`.

### API base URL

- `client/src/environments/environment.ts` sets `apiEndPoint` and `urlProfileImg` to a **LAN IP** in development; **`proxy.conf.json`** proxies `/api` to another host/port for `ng serve`.
- **Security note for maintainers**: environment files in-repo may contain **Mapbox, Neshan, Google OAuth, Firebase** identifiers. **Do not commit production secrets**; rotate any keys that have been exposed in git history; for NotebookLM uploads, use **redacted** copies.

---

## 8. Forum and secret chats (feature-level)

- **Forum** (`server/src/forum/README.md`): hierarchical **categories → forums → threads → posts**, with likes and nested behavior; seed categories listed (Pregnancy Journey, TTC, New Parents, etc.). Routes are mounted under the global `api/v1` prefix in the running app (README examples may omit prefix — verify controllers).
- **Secret chats** (`server/src/secret-chats/README.md`): Instagram-like **feeds inside private chats** (posts, media, comments, likes) plus **chat messages** and read receipts; file uploads to `public/uploads/posts` and `messages`; documents test endpoints that should be removed in production.

---

## 9. Mobile (Android)

- Capacitor **`webDir`**: `dist/app` (matches Angular `outputPath`).
- Android project under `client/android/`; scripts `cap:sync`, `cap:clean-sync`, `android:clean` in `client/package.json`.
- `server/MOBILE_TROUBLESHOOTING.md` exists for device/network issues.

---

## 10. How to run locally (typical)

### Server

```bash
cd server
npm install
npx prisma generate
npx prisma db push   # or migrate deploy
npm run seed         # optional sample geo data
npm run start:dev    # http://0.0.0.0:3000  (default)
```

### Client

```bash
cd client
npm install
npm start            # ng serve with proxy (see proxy.conf.json)
# or ionic serve / per-locale serve scripts in package.json
```

Align **client `apiEndPoint`** or **proxy target** with the actual server host/port.

---

## 11. Testing and quality

- **Client**: Karma/Jasmine (`ng test`), ESLint (`ng lint`).
- **Server**: Jest unit tests; e2e config under `server/test/`.

---

## 12. Related internal specifications (deep dives)

Upload alongside this file for richer NotebookLM output:

- `docs/calm-private-health-tracker/01-ux-principles-and-tone.md`
- `docs/calm-private-health-tracker/02-core-user-flows.md`
- `docs/calm-private-health-tracker/03-privacy-and-trust-spec.md`
- `docs/calm-private-health-tracker/04-delivery-phases-and-success-metrics.md`
- `server/REPRODUCTIVE_STATE_FLOW.md`
- `server/src/forum/README.md`
- `server/src/secret-chats/README.md`
- `server/README.md` (NouraCare backend section + Prisma)

---

## 13. Glossary

| Term | Meaning |
|------|---------|
| **NouraCare** | Product / app name surfaced to users and stores. |
| **Gahvareh** | Repository / workspace name (may differ from marketing name). |
| **Reproductive state** | Backend enum-driven mode: cycle, planning, pregnant, postpartum. |
| **Track day** | Per-day logging of mood, energy, symptoms, notes. |
| **Secret chats** | Private communities with feed + messaging, distinct from public forums. |

---

## 14. Disclaimer for generated docs (NotebookLM / LLM)

This overview is derived from **static code and docs** in the repository. It may omit routes added after this file was written, mis-describe runtime behavior, or summarize security posture incorrectly. Always verify against current `app.routes.ts`, `app.module.ts`, and `schema.prisma` before relying on generated documentation for compliance or security.

---

*End of NotebookLM source document.*
