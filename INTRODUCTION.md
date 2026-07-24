# DoreHealth (دوره)

**Understand your body, every day** · **همراه سلامتی تو**

DoreHealth is a women’s health platform that helps users understand their bodies privately — from menstrual cycles and daily symptoms to pregnancy, postpartum, menopause, education, community, and specialist consultations.

Women’s health starts with understanding your body. With DoreHealth, track your cycle, symptoms, pregnancy, and daily wellness with gentle reminders, while keeping privacy at the center of the product.

---

## Who it’s for

| Audience | What they get |
|----------|----------------|
| **Women & families** | Cycle, fertility, pregnancy, postpartum, and menopause tools in one app |
| **Health seekers** | Education (Dore School), insights, AI assistant, and moderated community |
| **Patients** | Online / in-person doctor consultations and appointments |
| **Operators** | Admin consoles for users, doctors, forums, subscriptions, and platform health |
| **Markets** | Primary UX in Persian (FA); also EN / ZH / MS; Jalali calendar support; production at [dorehealth.ir](https://dorehealth.ir) |

---

## Product pillars

1. **Cycle intelligence** — personal calendar, predictions, fertile days, adaptive cycle length  
2. **Daily wellness** — mood, energy, symptoms, notes, smart reminders  
3. **Life-stage modes** — cycle, planning, pregnant, postpartum, menopause  
4. **Expert care** — verified doctors, appointments, consultation fees & slots  
5. **Education** — articles, courses, tools (nutrition, sleep, pregnancy skills, videos)  
6. **Community** — forums, secret chats, friends, moderated spaces  
7. **Growth & premium** — referrals, check-ins, freemium → Premium  

---

## Platform map

| Package | Role | Stack |
|---------|------|--------|
| `client/` | Consumer app (Ionic) + in-app `/admin` | Angular 21, Ionic 8, Capacitor 8, Tailwind, Chart.js, PWA |
| `admin/` | Standalone ops console (port 4300) | Angular 21 |
| `server/` | REST API | NestJS 11, Prisma 7, MySQL, JWT, Socket.io |
| `landing/` | Marketing website | Next.js 16, React 19, Tailwind 4 |
| `deploy/` | Production Docker + nginx | API + MySQL, TLS for `api.dorehealth.ir` |

**Production domains**

- App: `https://dorehealth.ir`  
- API: `https://api.dorehealth.ir`  

---

## All features

### 1. Auth & account

- Welcome / sign-in, email OTP login  
- Register + email verification  
- Google & Apple social login  
- JWT access + refresh tokens; logout / logout-all  
- Profile: view/edit, avatar, saved info, reproductive status  
- Settings: privacy, data usage, help, privacy policy, terms, version check  
- Account: export data, delete account  

### 2. Onboarding

- Reproductive status selection  
- Cycle or pregnancy setup  
- Session save / complete flows  

### 3. Cycle & period tracking

- Period date picker and edit period  
- Cycle calendar  
- Adaptive cycle length and prediction error tracking  
- Fertile-day insights  
- Daily cycle insights (rule-based or AI-sourced cache)  

### 4. Symptoms & daily tracking

- Symptom tracker, detail, and history  
- Track-day: mood, energy, symptoms, notes  
- Pattern spotting for smarter reminders  

### 5. Reproductive life stages

| State | Focus |
|-------|--------|
| **Cycle** | Menstrual tracking & predictions |
| **Planning** | Fertility / pregnancy planning |
| **Pregnant** | Week-by-week journey, tools |
| **Postpartum** | Recovery and postpartum journey |
| **Menopause** | Perimenopause / menopause data & tips |

**Pregnancy tools (examples)**

- Week detail, checklists, kick counter, growth charts  
- Lullabies, baby names, recipes, growth quiz  
- Hospital bag checklist, newborn layette, memory album  

### 6. Dashboard & insights

- Unified dashboard driven by reproductive state (computed, not a separate “UI mode” store)  
- Insights tab for patterns and daily guidance  
- Home / Tools / Insights navigation  

### 7. Notifications & engagement

- Notifications inbox  
- Gentle reminders (period, medication, appointments)  
- Habit / health notification throttling (e.g. max 1/day)  
- App opens, engagement score/tier  
- Daily check-in streaks  

### 8. Doctors & consultations

- Doctor list, category, profile, favorites  
- Verified specialists (license, experience, rating)  
- Online and in-person consultation types  
- Book / cancel / confirm appointments  
- Fees and available slots  

### 9. Community

- **Forums:** categories, threads, posts, comments, likes; pin / lock / delete moderation  
- **Secret chats:** private groups, members (ADMIN / MODERATOR / MEMBER), posts/media, messaging, read receipts  
- Friends / blocked users  
- AI women’s health chatbot  

### 10. Education & content (Dore School)

- Articles (`/article/:id`)  
- School tab and tools menu  
- Nutrition, sleep, pregnancy skills, videos, collections  
- Games / toys intros where applicable  

### 11. Shop & monetization

- Shop, cart, product detail  
- Payment page + result  
- Subscription tiers: **FREE** / **PREMIUM_TRIAL** / **PREMIUM** (month / year)  
- Usage-day paywall threshold for premium features  
- DoreHealth Pro upsell  

### 12. Growth & referrals

- Invite friends / referral codes  
- Growth points and share summary  
- Public referral preview  

### 13. Privacy & security

- Privacy-first product positioning  
- Ownership checks (anti-IDOR) on user data  
- Global JWT guard, rate limiting, Helmet  
- OTP hardening (see `SECURITY_HARDENING.md`)  
- Admin health views are **aggregate-only** (no raw cycle logs or symptoms)  

### 14. Delivery surfaces

- Capacitor Android native app  
- Progressive Web App (Firebase Hosting / Add to Home Screen)  
- Next.js marketing landing  

### 15. Admin & operations

**Standalone admin (`admin/`)** — ops console:

- Dashboard overview (users, signups, doctors, appointments, community)  
- User search / suspend / promote  
- Doctor verification  
- Appointment list  
- Forum moderation (pin / lock / delete)  
- Subscription tier summary  

**In-app admin (`client/.../features/admin`)** — richer console at `/admin`:

- Dashboard, analytics, users, health, reports, audit logs, settings  
- Additional stub / roadmap pages (sessions, retention, revenue, payments, notifications, roles, system status, API monitoring, integrations, feature flags)  

---

## Business domains

How the product is organized in code and operations.

### Identity & access

- Users, profiles, email verification, refresh tokens  
- Roles: `USER`, `ADMIN`, `SUPER_ADMIN`  
- Status: `ACTIVE` / `INACTIVE` / `SUSPENDED`  
- Seed promotion via `ADMIN_EMAILS` / `SUPER_ADMIN_EMAILS`  
- Last `SUPER_ADMIN` cannot be demoted  

### Reproductive health (core domain)

- Single source of truth: `reproductive_state`  
- Related data: cycle, pregnancy, planning, menopause, onboarding  
- Dashboard and daily insights derived from state + logs  
- Domain docs: `server/REPRODUCTIVE_STATE_FLOW.md`, `server/ONBOARDING_FLOW.md`  

### Cycle intelligence

- Period logs, track-day entries, adaptive predictions  
- Daily insights (`RULE` or `AI` source)  

### Doctors marketplace

- Doctor profiles, verification, fees, slots  
- Appointments with status lifecycle (pending → confirmed / cancelled, etc.)  

### Community moderation

- Public forums and private secret chats  
- Pin / lock / delete threads; chat member roles  

### Engagement & growth

- App opens, engagement tiers, notification feedback  
- Referrals, check-ins, streaks, share  

### Subscriptions & billing

- Freemium model with trial and premium intervals  
- Admin subscription summary; some billing paths may still be mock/stub  

### Geo

- Cities, districts, addresses (Iran-focused seed; e.g. Tehran, Shiraz)  

### Platform ops

- Aggregate metrics for health/status  
- Dual admin UIs for day-to-day operations  

---

## Roles

| Role | Who | Access |
|------|-----|--------|
| `USER` | Default consumer | Full app features for their own data |
| `ADMIN` | Operations staff | Admin API + admin consoles |
| `SUPER_ADMIN` | Top operator | Same admin access; seed default `admin@dorehealth.app` |

Secret-chat member roles (community only): `ADMIN` / `MODERATOR` / `MEMBER`.

---

## Core data model (high level)

**Users & access:** `user`, `user_profile`, `refresh_tokens`  

**Health:** `reproductive_state`, `cycle_data`, `daily_cycle_insight`, `period_logs`, `trackday`, `pregnancy`, `pregnancy_planning`, `menopause_data`, `onboarding_data`  

**Engagement / growth / billing:** `user_app_open`, `user_engagement`, `health_notification_log`, `referral_code`, `referral`, `user_subscription`  

**Doctors:** `doctors`, `doctor_appointment`  

**Community:** forums stack (`forum_categories` → threads → posts → comments/likes), secret chats (`secret_chats`, `chat_members`, `chat_messages`, …), posts/media  

**Geo:** `city`, `district`, `address`  

---

## Main API areas (`/api/v1`)

| Area | Examples |
|------|----------|
| Auth | register, OTP, sign-in, social-login, refresh, logout, verify-email |
| Me / profile | dashboard, reproductive state, menstrual dashboard, daily insight |
| Subscriptions | get / trial / subscribe |
| Engagement & growth | open, summary, check-in, referral |
| Track-day & geo | CRUD track-day; cities / districts / addresses |
| Doctors | list, detail, appointments schedule/book/cancel/confirm |
| Forums & secret chats | full community CRUD |
| Onboarding | session save / complete |
| Admin (`/admin/*`) | me, dashboard overview, users, doctors, appointments, forums, subscriptions, health aggregates |

---

## Tech stack summary

- **Client:** Angular 21 · Ionic 8 · Capacitor 8 · Tailwind 4 · Chart.js · PWA / Firebase  
- **Admin:** Angular 21  
- **Server:** NestJS 11 · Prisma 7 · MySQL 8 · JWT / Passport · Mail / SMS · Firebase · Throttling · Helmet  
- **Landing:** Next.js 16 · React 19 · Tailwind 4  
- **Deploy:** Docker Compose · nginx · TLS · GitHub Actions CI  

---

## Main product features (marketing)

| Feature | Description |
|---------|-------------|
| Period tracking | Personal cycle calendar, next-period predictions, fertile-day insights |
| Symptom logging | Daily mood, energy, and symptoms for patterns and smart reminders |
| Pregnancy mode | Week-by-week tracking, kick counter, growth charts, birth prep tools |
| Expert consultations | Women’s health specialists, personalized guidance |
| Education library | Articles and courses on cycles, pregnancy, nutrition, mental wellness |
| Supportive community | Safe, moderated spaces for women on similar journeys |

**Also:** gentle reminders · privacy-first design · fertility & pregnancy planning · hospital bag & newborn checklists · baby name picker · AI health assistant  

---

## Related docs

| Doc | Topic |
|-----|--------|
| `landing/README.md` | Marketing site |
| `admin/README.md` | Standalone admin console |
| `deploy/README.md` | Production deploy, domains, store checklist |
| `client/pwa/README.md` | PWA rationale |
| `SECURITY_HARDENING.md` | Auth, OTP, JWT, ownership |
| `server/REPRODUCTIVE_STATE_FLOW.md` | Reproductive health architecture |
| `server/ONBOARDING_FLOW.md` | Onboarding session model |
| `server/src/forum/README.md` | Forums |
| `server/src/secret-chats/README.md` | Secret chats |

---

## Quick start (dev)

```bash
# API
cd server && npm install && npm run start:dev

# Consumer app
cd client && npm install && npm start

# Standalone admin (API must be on :3000)
cd admin && npm install && npm start

# Landing
cd landing && npm install && npm run dev
```

---

*DoreHealth — women’s health, every day. دوره — همراه سلامتی تو.*
