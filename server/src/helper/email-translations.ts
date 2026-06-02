export type EmailLocale = 'en' | 'fa' | 'zh' | 'ms';

export type OtpEmailPurpose = 'verification' | 'sign-in';

export interface OtpEmailContent {
  lang: string;
  dir: 'rtl' | 'ltr';
  subject: string;
  preheader: string;
  badge: string;
  headline: string;
  greeting: string;
  body: string;
  codeLabel: string;
  expiry: string;
  closing: string;
  teamName: string;
  footerNote: string;
  copyright: string;
}

const CONTENT: Record<
  EmailLocale,
  Record<OtpEmailPurpose, Omit<OtpEmailContent, 'lang' | 'dir'>>
> = {
  en: {
    verification: {
      subject: '{{APP_NAME}} – Verify your email',
      preheader: 'Your verification code is {{TOKEN}}',
      badge: 'Email verification',
      headline: 'Verify your email address',
      greeting: 'Hello,',
      body: 'You are one step away from getting started. Enter the code below in the app to confirm your email address.',
      codeLabel: 'Your verification code',
      expiry: 'This code expires in 15 minutes. If you did not create an account, you can ignore this email.',
      closing: 'Warm regards,',
      teamName: 'The {{APP_NAME}} Team',
      footerNote: 'Need help? Reply to this email or contact our support team.',
      copyright: '© {{YEAR}} {{APP_NAME}}. All rights reserved.',
    },
    'sign-in': {
      subject: '{{APP_NAME}} – Your sign-in code',
      preheader: 'Your sign-in code is {{TOKEN}}',
      badge: 'Sign in',
      headline: 'Your sign-in code',
      greeting: 'Hello,',
      body: 'Use the code below to sign in to your account. Never share this code with anyone.',
      codeLabel: 'Your sign-in code',
      expiry: 'This code expires in 10 minutes. If you did not request it, you can safely ignore this email.',
      closing: 'Warm regards,',
      teamName: 'The {{APP_NAME}} Team',
      footerNote: 'Need help? Reply to this email or contact our support team.',
      copyright: '© {{YEAR}} {{APP_NAME}}. All rights reserved.',
    },
  },
  fa: {
    verification: {
      subject: '{{APP_NAME}} – تأیید ایمیل',
      preheader: 'کد تأیید شما: {{TOKEN}}',
      badge: 'تأیید ایمیل',
      headline: 'تأیید آدرس ایمیل',
      greeting: 'سلام،',
      body: 'فقط یک قدم تا شروع مانده! کد زیر را در برنامه وارد کنید تا آدرس ایمیل شما تأیید شود.',
      codeLabel: 'کد تأیید شما',
      expiry:
        'این کد تا ۱۵ دقیقه دیگر معتبر است. اگر حسابی ایجاد نکرده‌اید، این ایمیل را نادیده بگیرید.',
      closing: 'با احترام،',
      teamName: 'تیم {{APP_NAME}}',
      footerNote: 'سوالی دارید؟ به این ایمیل پاسخ دهید یا با پشتیبانی تماس بگیرید.',
      copyright: '© {{YEAR}} {{APP_NAME}} — تمامی حقوق محفوظ است.',
    },
    'sign-in': {
      subject: '{{APP_NAME}} – کد ورود',
      preheader: 'کد ورود شما: {{TOKEN}}',
      badge: 'ورود به حساب',
      headline: 'کد ورود شما',
      greeting: 'سلام،',
      body: 'برای ورود به حساب خود، کد زیر را در برنامه وارد کنید. این کد را با دیگران به اشتراک نگذارید.',
      codeLabel: 'کد ورود',
      expiry:
        'این کد تا ۱۰ دقیقه دیگر معتبر است. اگر درخواست ورود نداده‌اید، این ایمیل را نادیده بگیرید.',
      closing: 'با احترام،',
      teamName: 'تیم {{APP_NAME}}',
      footerNote: 'سوالی دارید؟ به این ایمیل پاسخ دهید یا با پشتیبانی تماس بگیرید.',
      copyright: '© {{YEAR}} {{APP_NAME}} — تمامی حقوق محفوظ است.',
    },
  },
  zh: {
    verification: {
      subject: '{{APP_NAME}} – 验证您的邮箱',
      preheader: '您的验证码是 {{TOKEN}}',
      badge: '邮箱验证',
      headline: '验证您的邮箱地址',
      greeting: '您好，',
      body: '只差一步即可开始使用。请在应用中输入以下验证码以确认您的邮箱。',
      codeLabel: '您的验证码',
      expiry: '此验证码将在 15 分钟后失效。如非您本人操作，请忽略此邮件。',
      closing: '此致，',
      teamName: '{{APP_NAME}} 团队',
      footerNote: '需要帮助？请回复此邮件或联系客服。',
      copyright: '© {{YEAR}} {{APP_NAME}}。保留所有权利。',
    },
    'sign-in': {
      subject: '{{APP_NAME}} – 登录验证码',
      preheader: '您的登录验证码是 {{TOKEN}}',
      badge: '登录',
      headline: '您的登录验证码',
      greeting: '您好，',
      body: '请使用以下验证码登录您的账户。请勿与他人分享此验证码。',
      codeLabel: '登录验证码',
      expiry: '此验证码将在 10 分钟后失效。如非您本人操作，请忽略此邮件。',
      closing: '此致，',
      teamName: '{{APP_NAME}} 团队',
      footerNote: '需要帮助？请回复此邮件或联系客服。',
      copyright: '© {{YEAR}} {{APP_NAME}}。保留所有权利。',
    },
  },
  ms: {
    verification: {
      subject: '{{APP_NAME}} – Sahkan e-mel anda',
      preheader: 'Kod pengesahan anda ialah {{TOKEN}}',
      badge: 'Pengesahan e-mel',
      headline: 'Sahkan alamat e-mel anda',
      greeting: 'Hai,',
      body: 'Anda hanya selangkah lagi untuk bermula. Masukkan kod di bawah dalam aplikasi untuk mengesahkan e-mel anda.',
      codeLabel: 'Kod pengesahan anda',
      expiry:
        'Kod ini tamat tempoh dalam 15 minit. Jika anda tidak mendaftar, abaikan e-mel ini.',
      closing: 'Salam mesra,',
      teamName: 'Pasukan {{APP_NAME}}',
      footerNote: 'Perlukan bantuan? Balas e-mel ini atau hubungi sokongan kami.',
      copyright: '© {{YEAR}} {{APP_NAME}}. Hak cipta terpelihara.',
    },
    'sign-in': {
      subject: '{{APP_NAME}} – Kod log masuk anda',
      preheader: 'Kod log masuk anda ialah {{TOKEN}}',
      badge: 'Log masuk',
      headline: 'Kod log masuk anda',
      greeting: 'Hai,',
      body: 'Gunakan kod di bawah untuk log masuk ke akaun anda. Jangan kongsi kod ini dengan sesiapa.',
      codeLabel: 'Kod log masuk',
      expiry:
        'Kod ini tamat tempoh dalam 10 minit. Jika anda tidak memintanya, abaikan e-mel ini.',
      closing: 'Salam mesra,',
      teamName: 'Pasukan {{APP_NAME}}',
      footerNote: 'Perlukan bantuan? Balas e-mel ini atau hubungi sokongan kami.',
      copyright: '© {{YEAR}} {{APP_NAME}}. Hak cipta terpelihara.',
    },
  },
};

const RTL_LOCALES: EmailLocale[] = ['fa'];

export function normalizeEmailLocale(locale?: string | null): EmailLocale {
  if (!locale?.trim()) {
    return 'en';
  }

  const code = locale.trim().toLowerCase().split('-')[0];

  if (code === 'fa' || code === 'per' || code === 'persian') {
    return 'fa';
  }
  if (code === 'zh') {
    return 'zh';
  }
  if (code === 'ms') {
    return 'ms';
  }

  return 'en';
}

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(vars[key] ?? ''),
  );
}

export function getOtpEmailContent(
  locale: EmailLocale,
  purpose: OtpEmailPurpose,
  vars: { appName: string; token: string; year: number },
): OtpEmailContent {
  const base = CONTENT[locale][purpose];
  const interpolationVars = {
    APP_NAME: vars.appName,
    TOKEN: vars.token,
    YEAR: vars.year,
  };

  return {
    lang: locale === 'fa' ? 'fa' : locale,
    dir: RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr',
    subject: interpolate(base.subject, interpolationVars),
    preheader: interpolate(base.preheader, interpolationVars),
    badge: interpolate(base.badge, interpolationVars),
    headline: interpolate(base.headline, interpolationVars),
    greeting: interpolate(base.greeting, interpolationVars),
    body: interpolate(base.body, interpolationVars),
    codeLabel: interpolate(base.codeLabel, interpolationVars),
    expiry: interpolate(base.expiry, interpolationVars),
    closing: interpolate(base.closing, interpolationVars),
    teamName: interpolate(base.teamName, interpolationVars),
    footerNote: interpolate(base.footerNote, interpolationVars),
    copyright: interpolate(base.copyright, interpolationVars),
  };
}
