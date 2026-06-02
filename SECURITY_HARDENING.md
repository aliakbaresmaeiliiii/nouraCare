# گزارش امنیت‌سازی NouraCare

این سند خلاصهٔ کارهایی است که برای آماده‌سازی بک‌اند و کلاینت (قبل از انتشار در Google Play / App Store) انجام شده است.

---

## خلاصهٔ یک‌خطی

قبل از این تغییرات، ورود با ایمیل بدون اثبات هویت، APIهای سلامت بدون احراز هویت، و توکن‌های ناامن وجود داشت.  
الان: **احراز هویت سراسری، ورود با کد ایمیل، توکن‌های امن، و محافظت از داده‌های کاربر** پیاده شده است.

---

## ۱. تغییرات بک‌اند (NestJS — پوشه `server/`)

### ۱.۱ گارد JWT سراسری

| قبل | بعد |
|-----|-----|
| هر کنترلر خودش تصمیم می‌گرفت محافظت شود یا نه | تقریباً **همهٔ APIها** نیاز به JWT دارند |
| بسیاری از routeها بدون auth باز بودند | routeهای عمومی با دکوراتور `@Public()` مشخص شده‌اند |

**فایل‌های کلیدی:**
- `server/src/auth/guards/global-jwt-auth.guard.ts`
- `server/src/auth/decorators/public.decorator.ts`
- `server/src/app.module.ts` (ثبت به‌عنوان `APP_GUARD`)

**Routeهای عمومی (بدون توکن):**
- `POST /auth/register`, `sign-in`, `social-login`, `refresh`, `verify-email`, `resend-verification`
- خواندن انجمن (forum)، لیست پزشکان، شهرها (geo)
- onboarding قبل از ثبت‌نام (`/onboarding/save`, ...)
- پیش‌نمایش referral (`/growth/referral/:code/preview`)

---

### ۱.۲ قفل کردن APIهای حساس (IDOR برطرف شد)

قبلاً هر کسی با دانستن `userId` می‌توانست دادهٔ دیگران را بخواند/ویرایش کند.

| کنترلر | مسیر | محافظت |
|--------|------|--------|
| `ProfileController` | `/profile/:id/*` | JWT + فقط مالک همان `:id` |
| `TrackDayController` | `/track-day/:userId/*` | JWT + فقط مالک |
| `UserController` | `/user/:id/*` | JWT + فقط مالک |
| `GeoController` | `/geo/users/:id/addresses` | JWT + فقط مالک |
| `UserController` | `DELETE /user/me` | JWT — حذف حساب خود کاربر |

**فایل کمکی:** `server/src/auth/utils/assert-user-ownership.util.ts`

---

### ۱.۳ ورود با ایمیل — دیگر فقط ایمیل کافی نیست

**قبل:** `POST /auth/sign-in` با `{ "email": "..." }` → بلافاصله توکن می‌داد.

**الان (دو مرحله):**

```
مرحله ۱:  POST /auth/sign-in  { "email": "user@example.com" }
          → کد ۶ رقمی به ایمیل ارسال می‌شود
          → پاسخ: { "otpSent": true, "message": "..." }

مرحله ۲:  POST /auth/sign-in  { "email": "...", "otp": "123456" }
          → accessToken + refreshToken
```

**شرط:** کاربر باید `isVerified: true` باشد (ایمیل قبلاً تأیید شده).

**فایل:** `server/src/auth/auth.service.ts` → متد `login()`

---

### ۱.۴ ثبت‌نام و تأیید ایمیل

- **ثبت‌نام** دیگر توکن برنمی‌گرداند؛ فقط `{ user, requiresVerification: true }`
- **تأیید ایمیل** (`POST /auth/verify-email`) بعد از کد درست → توکن صادر می‌کند
- کد OTP از ۴ رقم به **۶ رقم** ارتقا یافته

---

### ۱.۵ Social Login (Google / Apple) — تأیید سمت سرور

**قبل:** کلاینت فقط `email` می‌فرستاد → سرور باور می‌کرد.

**الان:** سرور توکن را با Google/Apple چک می‌کند:

| Provider | کلاینت می‌فرستد | سرور چک می‌کند |
|----------|-----------------|----------------|
| Google | `idToken` و/یا `accessToken` | Google tokeninfo / userinfo |
| Apple | `idToken` (اجباری) | امضای JWT با کلید عمومی Apple |

**فایل:** `server/src/auth/services/social-token.service.ts`

> **نکته:** Apple Sign-In در کلاینت هنوز باید `idToken` واقعی از Capacitor بفرستد؛ ورود Apple فقط با ایمیل دستی دیگر کار نمی‌کند.

---

### ۱.۶ Refresh Token — باگ‌ها برطرف شد

| مشکل قبلی | راه‌حل |
|-----------|--------|
| refresh token به‌صورت UUID بود ولی استراتژی JWT decode می‌کرد | فرمت جدید: `{userId}.{uuid}` |
| توکن قدیمی بعد از refresh لغو نمی‌شد | **Rotation:** توکن قبلی revoke می‌شود |
| `createRefreshToken` await نمی‌شد | الان await شده |
| hash در DB | همچنان bcrypt (خوب است) |

**فایل‌ها:**
- `server/src/auth/refresh-token.service.ts`
- `server/src/auth/strategies/refresh-token.strategy.ts`

**نکته:** کاربرانی که refresh token قدیمی (بدون `{userId}.`) دارند باید **یک بار دوباره login** کنند.

---

### ۱.۷ Rate Limiting

روی endpointهای auth محدودیت درخواست (با `@nestjs/throttler`):
- ثبت‌نام: ۵ بار / دقیقه
- sign-in، verify، social: ۱۰ بار / دقیقه

---

### ۱.۸ تنظیمات production

**فایل:** `server/src/auth/config/env.ts`

- رمز DB و JWT دیگر hardcode نیست
- در `NODE_ENV=production` بدون `JWT_SECRET` و `DB_PASSWORD` سرور بالا نمی‌آید

**نمونه env:** `server/.env.example`

```env
JWT_SECRET=یک-رشته-تصادفی-طولانی
DB_PASSWORD=رمز-دیتابیس
GOOGLE_CLIENT_IDS=client-id.apps.googleusercontent.com
CORS_ORIGINS=capacitor://localhost,https://api.example.com
BASE_URL=https://api.example.com
```

---

### ۱.۹ CORS و Validation

- **CORS:** در production فقط originهای `CORS_ORIGINS` مجازند
- **ValidationPipe:** `whitelist: true` — فیلدهای اضافی در body رد می‌شوند

**فایل:** `server/src/main.ts`

---

## ۲. تغییرات کلاینت (Angular — پوشه `client/`)

### ۲.۱ صفحه Login — دو مرحله

1. کاربر ایمیل می‌زند → «Sign In»
2. کد ۶ رقمی از ایمیل → «Verify code» → ورود

**فایل‌ها:**
- `client/src/app/auth/login/login.component.ts`
- `client/src/app/auth/login/login.component.html`

---

### ۲.۲ Google Sign-In

کلاینت حالا `accessToken` (وب) یا `idToken` (موبایل) را به API می‌فرستد.

**فایل:** `client/src/app/auth/services/google-sign-in.service.ts`

---

### ۲.۳ ذخیره Refresh Token

`refreshToken` داخل `localStorage.userInfo` ذخیره می‌شود تا interceptor بتواند token را تازه کند.

**فایل:** `client/src/app/auth/services/auth.ts` → `handleTokenResponse()`

---

### ۲.۴ Verify Email

بعد از تأیید موفق، توکن‌ها از پاسخ API ذخیره و کاربر به home می‌رود.

**فایل:** `client/src/app/auth/verify-email/verify-email.component.ts`

---

### ۲.۵ حذف حساب (Settings)

دکمه Delete Account واقعاً `DELETE /user/me` را صدا می‌زند.

**فایل‌ها:**
- `client/src/app/shared/services/user.ts` → `deleteMyAccount()`
- `client/src/app/settings/settings.component.ts`

---

### ۲.۶ تایپ‌ها

`TokenResponse` حالا فیلدهای اختیاری دارد: `otpSent`, `accessToken?`, `refreshToken?`

**فایل:** `client/src/app/auth/models/token.interface.ts`

---

## ۳. جریان‌های کاربری (Flow)

### ثبت‌نام جدید
```
Register → ایمیل + کد تأیید → Verify Email → Home (با توکن)
```

### ورود با ایمیل
```
Sign In (email) → کد در ایمیل → Verify code → Home
```

### ورود با Google
```
Google popup → idToken/accessToken → social-login API → Home
```

### Refresh توکن (خودکار)
```
API برگرداند 401 → interceptor → POST /auth/refresh → توکن جدید → تکرار درخواست
```

### خروج
```
POST /auth/logout + refreshToken → revoke در DB
```

---

## ۴. چیزهایی که هنوز باید قبل از انتشار انجام دهید

| مورد | وضعیت | اقدام |
|------|--------|-------|
| HTTPS روی API | ❌ | nginx / Cloudflare / hosting با TLS |
| `environment.prod.ts` | ❌ | آدرس API را `https://` کنید |
| `.env` production | ❌ | از `.env.example` پر کنید |
| Apple Sign-In native | ⚠️ | `idToken` از Capacitor به API |
| چرخش secret قدیمی | ⚠️ | اگر JWT/DB password قبلاً لو رفته، rotate کنید |
| CORS برای اپ موبایل | ⚠️ | `capacitor://localhost` و دامنه production |

---

## ۵. فهرست فایل‌های تغییر یافته (مرجع سریع)

### Backend
```
server/src/app.module.ts
server/src/main.ts
server/src/auth/auth.service.ts
server/src/auth/auth.controller.ts
server/src/auth/auth.module.ts
server/src/auth/config/env.ts
server/src/auth/config/jwt.config.ts
server/src/auth/refresh-token.service.ts
server/src/auth/strategies/refresh-token.strategy.ts
server/src/auth/services/social-token.service.ts
server/src/auth/guards/global-jwt-auth.guard.ts
server/src/auth/decorators/public.decorator.ts
server/src/auth/utils/assert-user-ownership.util.ts
server/src/auth/dto/social-login.dto.ts
server/src/users/user.controller.ts
server/src/users/profile.controller.ts
server/src/users/user.service.ts
server/src/track-day/track-day.controller.ts
server/src/geo/geo.controller.ts
server/src/forum/*.controller.ts (Public روی GETها)
server/.env.example
```

### Frontend
```
client/src/app/auth/login/*
client/src/app/auth/services/auth.ts
client/src/app/auth/services/google-sign-in.service.ts
client/src/app/auth/verify-email/*
client/src/app/auth/models/token.interface.ts
client/src/app/auth/interceptor/jwt.interceptor.ts
client/src/app/shared/services/user.ts
client/src/app/settings/settings.component.ts
```

---

## ۶. تست دستی پیشنهادی

1. **ثبت‌نام** → کد ایمیل → verify → ورود به home
2. **Login** → فقط ایمیل بدون OTP → نباید توکن بدهد
3. **Login** → ایمیل + OTP → توکن بدهد
4. **Google** → ورود موفق با توکن
5. **API بدون توکن** → `GET /track-day/1/...` → باید 401 بدهد
6. **API با توکن کاربر A روی userId=B** → باید 403 بدهد
7. **Refresh** → بعد از expire access token، درخواست بعدی خودکار refresh شود
8. **Delete account** از Settings → کاربر logout و حساب حذف شود

---

## ۷. سوالات متداول

**Q: چرا login دو مرحله شد؟**  
A: ورود فقط با ایمیل برای اپ سلامت خطرناک بود؛ هر کسی با دانستن ایمیل وارد می‌شد.

**Q: refresh token قدیمی کار می‌کند؟**  
A: خیر — فرمت عوض شده؛ یک بار re-login لازم است.

**Q: Apple روی موبایل کار نمی‌کند؟**  
A: تا وقتی `idToken` از Sign in with Apple به API نفرستید، سرور رد می‌کند (عمدی).

**Q: env development بدون JWT_SECRET؟**  
A: در dev یک secret پیش‌فرض موقت هست؛ production اجباری است.

---

*آخرین به‌روزرسانی: ژوئن ۲۰۲۶ — پس از پیاده‌سازی security hardening*
