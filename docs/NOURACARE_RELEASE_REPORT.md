# گزارش کامل NouraCare — امنیت و انتشار

**پروژه:** NouraCare  
**Bundle ID:** com.tecknnycs.nouracare  
**تاریخ:** ژوئن ۲۰۲۶  

---

## خلاصهٔ یک‌خطی

قبل از این تغییرات، ورود با ایمیل بدون اثبات هویت، APIهای سلامت بدون احراز هویت، و توکن‌های ناامن وجود داشت.  
الان: **احراز هویت سراسری، ورود با کد ایمیل، توکن‌های امن، محافظت از داده‌های کاربر، Apple/Google Sign-In، و قالب deploy** پیاده شده است.

---

## ۱. تغییرات بک‌اند (NestJS)

### ۱.۱ گارد JWT سراسری

| قبل | بعد |
|-----|-----|
| هر کنترلر خودش تصمیم می‌گرفت | تقریباً همه APIها JWT می‌خواهند |
| بسیاری route بدون auth | route عمومی با `@Public()` |

**Routeهای عمومی:** register, sign-in, social-login, refresh, verify-email, forum (خواندن), doctors, geo cities, onboarding, referral preview

### ۱.۲ APIهای حساس قفل شد (IDOR)

| مسیر | محافظت |
|------|--------|
| `/profile/:id/*` | JWT + مالک |
| `/track-day/:userId/*` | JWT + مالک |
| `/user/:id/*` | JWT + مالک |
| `DELETE /user/me` | JWT — حذف حساب |

### ۱.۳ ورود ایمیل — OTP دو مرحله‌ای

1. `POST /auth/sign-in` + email → کد ۶ رقمی ایمیل  
2. `POST /auth/sign-in` + email + otp → accessToken + refreshToken  

### ۱.۴ Social Login — تأیید سرور

- Google: `idToken` / `accessToken`  
- Apple: `idToken` (امضای JWT با کلید Apple)  

### ۱.۵ Refresh Token

- فرمت: `{userId}.{uuid}`  
- Rotation: توکن قدیمی revoke  
- Hash با bcrypt در DB  

### ۱.۶ Rate limiting, CORS, Validation, env امن

---

## ۲. تغییرات کلاینت (Angular / Capacitor)

- Login: email → OTP  
- Google: ارسال token به API  
- Apple: `AppleSignInService` + `SocialLoginInitService`  
- Verify email: ذخیره token بعد از تأیید  
- Settings: حذف حساب (`DELETE /user/me`)  
- `environment.prod.ts`: HTTPS API, Apple/Google IDs  
- `capacitor.config.prod.ts`: بدون cleartext  

**اسکریپت‌ها:**
- `npm run build:prod`  
- `npm run cap:sync:prod`  

---

## ۳. Deploy (پوشه deploy/)

- `docker-compose.yml` — API + MySQL  
- `Dockerfile`  
- `nginx/nouracare-api.conf` — HTTPS  
- `README.md` — راهنمای deploy  
- `server/.env.example` — متغیرهای محیطی  

---

## ۴. کارهای باقی‌مانده (شما)

| مورد | اقدام |
|------|--------|
| دامنه واقعی | `PROD_API_ORIGIN` در environment.prod.ts |
| `.env` | JWT_SECRET, DB_PASSWORD, CORS, BASE_URL |
| HTTPS | nginx + certbot یا Cloudflare |
| Apple Developer | Sign in with Apple برای bundle |
| Google Cloud | iOS OAuth client |
| Store | Privacy URL, Data safety forms |

---

## ۵. چک‌لیست تست

1. ثبت‌نام → verify email → home  
2. Login بدون OTP → بدون token  
3. Login با OTP → token  
4. Google / Apple login  
5. API بدون token → 401  
6. دسترسی به userId دیگر → 403  
7. Refresh token خودکار  
8. Delete account  

---

## ۶. فایل‌های مرجع در پروژه

- `SECURITY_HARDENING.md` — جزئیات فارسی  
- `deploy/README.md` — راهنمای deploy انگلیسی  
- `docs/NOURACARE_RELEASE_REPORT.pdf` — همین سند به صورت PDF  

---

*NouraCare — Security & Release Report — June 2026*
