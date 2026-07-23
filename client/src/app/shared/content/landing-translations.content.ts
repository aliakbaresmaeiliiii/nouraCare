/** Landing / marketing site copy — keys prefixed with `landing.` */

const LANDING_EN: Record<string, string> = {
  'landing.nav.features': 'Features',
  'landing.nav.product': 'Product',
  'landing.nav.faq': 'FAQ',
  'landing.nav.signIn': 'Sign in',
  'landing.nav.openApp': 'Open app',
  'landing.nav.toggleMenu': 'Toggle menu',
  'landing.nav.primary': 'Primary',
  'landing.nav.language': 'Language',

  'landing.hero.brand': 'Dore',
  'landing.hero.title': 'Cycle clarity for every stage of womanhood',
  'landing.hero.lede':
    'Track periods, understand fertility, and prepare for pregnancy in one calm, privacy-first health companion.',
  'landing.hero.startFree': 'Start free',
  'landing.hero.seeHow': 'See how it works',
  'landing.hero.chipCycle': 'Cycle day 14',
  'landing.hero.chipFertile': 'Fertile window',
  'landing.hero.chipNext': 'Next period · 12d',

  'landing.features.eyebrow': 'Features',
  'landing.features.title': 'Everything you need to understand your body',
  'landing.features.lede':
    'From daily tracking to long-term planning — one companion across cycle, fertility, and pregnancy.',
  'landing.features.1.title': 'Smart cycle tracking',
  'landing.features.1.body':
    'Log periods, symptoms, and patterns with a timeline that stays readable and private.',
  'landing.features.2.title': 'Fertility insights',
  'landing.features.2.body':
    'See fertile windows and predictions that adapt as your history grows.',
  'landing.features.3.title': 'Pregnancy journey',
  'landing.features.3.body':
    'Week-by-week guidance, tools, and reminders when you are ready for the next chapter.',
  'landing.features.4.title': 'Care when you need it',
  'landing.features.4.body':
    'Browse specialists, book consultations, and keep health context in one place.',
  'landing.features.5.title': 'Community & learning',
  'landing.features.5.body':
    'Ask questions, follow school content, and learn at your own pace.',
  'landing.features.6.title': 'Built for trust',
  'landing.features.6.body':
    'Account controls, privacy settings, and a calm interface designed for daily use.',

  'landing.shots.eyebrow': 'Product',
  'landing.shots.title': 'A calm interface for daily health decisions',
  'landing.shots.lede':
    'Designed for clarity on mobile — the places you open most, without noise.',
  'landing.shots.1.title': 'Today',
  'landing.shots.1.caption': 'Your cycle at a glance — phase, timing, and next steps.',
  'landing.shots.2.title': 'Insights',
  'landing.shots.2.caption': 'Patterns and guidance that stay grounded in your data.',
  'landing.shots.3.title': 'Care',
  'landing.shots.3.caption': 'Tools, school content, and consultations in one flow.',

  'landing.faq.eyebrow': 'FAQ',
  'landing.faq.title': 'Questions, answered simply',
  'landing.faq.1.q': 'Is Dore free to start?',
  'landing.faq.1.a':
    'Yes. You can create an account and begin tracking right away. Premium tools can be added later if you need them.',
  'landing.faq.2.q': 'Does it work for pregnancy and postpartum too?',
  'landing.faq.2.a':
    'Dore supports cycle tracking, fertility planning, pregnancy week journeys, and postpartum modes so your plan can grow with you.',
  'landing.faq.3.q': 'Is my health data private?',
  'landing.faq.3.a':
    'Your account is protected with secure authentication. You control profile and privacy settings inside the app.',
  'landing.faq.4.q': 'Can I use Dore on my phone?',
  'landing.faq.4.a':
    'Dore is a mobile-first web and Android experience. Open the app from this site and continue on your device.',

  'landing.cta.title': 'Ready to feel more in sync?',
  'landing.cta.body': 'Open Dore and set up your profile in a few minutes.',
  'landing.cta.getStarted': 'Get started',
  'landing.cta.hasAccount': 'I already have an account',

  'landing.footer.tagline': "Women's health, tracked with care.",
  'landing.footer.features': 'Features',
  'landing.footer.product': 'Product',
  'landing.footer.faq': 'FAQ',
  'landing.footer.signIn': 'Sign in',
  'landing.footer.privacy': 'Privacy',
  'landing.footer.terms': 'Terms',
  'landing.footer.copy': '© {{year}} Dore Health. All rights reserved.',
  'landing.footer.nav': 'Footer',
};

const LANDING_FA: Record<string, string> = {
  'landing.nav.features': 'امکانات',
  'landing.nav.product': 'محصول',
  'landing.nav.faq': 'سؤالات متداول',
  'landing.nav.signIn': 'ورود',
  'landing.nav.openApp': 'ورود به اپ',
  'landing.nav.toggleMenu': 'باز و بسته کردن منو',
  'landing.nav.primary': 'اصلی',
  'landing.nav.language': 'زبان',

  'landing.hero.brand': 'دوره',
  'landing.hero.title': 'شفافیت چرخه برای هر مرحله از زندگی زنانه',
  'landing.hero.lede':
    'پیگیری پریود، درک باروری و آمادگی برای بارداری در یک همراه آرام و حریم‌محور برای سلامت شما.',
  'landing.hero.startFree': 'شروع رایگان',
  'landing.hero.seeHow': 'نحوه کار را ببینید',
  'landing.hero.chipCycle': 'روز ۱۴ چرخه',
  'landing.hero.chipFertile': 'پنجره باروری',
  'landing.hero.chipNext': 'پریود بعدی · ۱۲ روز',

  'landing.features.eyebrow': 'امکانات',
  'landing.features.title': 'هرآنچه برای شناخت بدنتان نیاز دارید',
  'landing.features.lede':
    'از پیگیری روزانه تا برنامه‌ریزی بلندمدت — یک همراه در چرخه، باروری و بارداری.',
  'landing.features.1.title': 'پیگیری هوشمند چرخه',
  'landing.features.1.body':
    'ثبت پریود، علائم و الگوها با خط زمانی خوانا و خصوصی.',
  'landing.features.2.title': 'بینش‌های باروری',
  'landing.features.2.body':
    'پنجره باروری و پیش‌بینی‌هایی که با رشد سابقه شما دقیق‌تر می‌شوند.',
  'landing.features.3.title': 'مسیر بارداری',
  'landing.features.3.body':
    'راهنمایی هفته‌به‌هفته، ابزارها و یادآورها وقتی برای فصل بعد آماده‌اید.',
  'landing.features.4.title': 'مراقبت وقتی نیاز دارید',
  'landing.features.4.body':
    'مشاهده متخصصان، رزرو مشاوره و نگه‌داشتن زمینه سلامت در یک جا.',
  'landing.features.5.title': 'جامعه و یادگیری',
  'landing.features.5.body':
    'سؤال بپرسید، محتوای مدرسه را دنبال کنید و با سرعت خودتان یاد بگیرید.',
  'landing.features.6.title': 'ساخته‌شده برای اعتماد',
  'landing.features.6.body':
    'کنترل حساب، تنظیمات حریم خصوصی و رابط آرامی برای استفاده روزانه.',

  'landing.shots.eyebrow': 'محصول',
  'landing.shots.title': 'رابطی آرام برای تصمیم‌های روزانه سلامت',
  'landing.shots.lede':
    'طراحی‌شده برای وضوح روی موبایل — جاهایی که بیشتر باز می‌کنید، بدون شلوغی.',
  'landing.shots.1.title': 'امروز',
  'landing.shots.1.caption': 'چرخه در یک نگاه — فاز، زمان‌بندی و گام بعدی.',
  'landing.shots.2.title': 'بینش‌ها',
  'landing.shots.2.caption': 'الگوها و راهنمایی متکی بر داده‌های شما.',
  'landing.shots.3.title': 'مراقبت',
  'landing.shots.3.caption': 'ابزارها، محتوای آموزشی و مشاوره در یک جریان.',

  'landing.faq.eyebrow': 'سؤالات متداول',
  'landing.faq.title': 'پاسخ‌های ساده به پرسش‌ها',
  'landing.faq.1.q': 'آیا شروع با دوره رایگان است؟',
  'landing.faq.1.a':
    'بله. می‌توانید حساب بسازید و فوراً پیگیری را شروع کنید. ابزارهای ویژه را بعداً در صورت نیاز اضافه کنید.',
  'landing.faq.2.q': 'برای بارداری و پس از زایمان هم مناسب است؟',
  'landing.faq.2.a':
    'دوره از پیگیری چرخه، برنامه‌ریزی باروری، مسیر هفتگی بارداری و حالت پس از زایمان پشتیبانی می‌کند تا برنامه‌تان با شما رشد کند.',
  'landing.faq.3.q': 'آیا داده‌های سلامتم خصوصی است؟',
  'landing.faq.3.a':
    'حساب شما با احراز هویت امن محافظت می‌شود. تنظیمات پروفایل و حریم خصوصی را داخل اپ کنترل می‌کنید.',
  'landing.faq.4.q': 'می‌توانم دوره را روی گوشی استفاده کنم؟',
  'landing.faq.4.a':
    'دوره تجربه‌ای موبایل‌محور برای وب و اندروید است. از همین سایت وارد اپ شوید و روی دستگاه ادامه دهید.',

  'landing.cta.title': 'آماده‌اید بیشتر هماهنگ شوید؟',
  'landing.cta.body': 'دوره را باز کنید و ظرف چند دقیقه پروفایل‌تان را بسازید.',
  'landing.cta.getStarted': 'شروع کنید',
  'landing.cta.hasAccount': 'قبلاً حساب دارم',

  'landing.footer.tagline': 'سلامت زنان، با مراقبت پیگیری می‌شود.',
  'landing.footer.features': 'امکانات',
  'landing.footer.product': 'محصول',
  'landing.footer.faq': 'سؤالات متداول',
  'landing.footer.signIn': 'ورود',
  'landing.footer.privacy': 'حریم خصوصی',
  'landing.footer.terms': 'شرایط استفاده',
  'landing.footer.copy': '© {{year}} دوره هلث. همه حقوق محفوظ است.',
  'landing.footer.nav': 'پاورقی',
};

const LANDING_ZH: Record<string, string> = {
  ...LANDING_EN,
  'landing.nav.features': '功能',
  'landing.nav.product': '产品',
  'landing.nav.faq': '常见问题',
  'landing.nav.signIn': '登录',
  'landing.nav.openApp': '打开应用',
  'landing.hero.brand': 'Dore',
  'landing.hero.title': '覆盖女性生命每一阶段的周期清晰度',
  'landing.hero.lede':
    '在一个平静、以隐私为先的健康伙伴中追踪经期、了解生育力并准备怀孕。',
  'landing.hero.startFree': '免费开始',
  'landing.hero.seeHow': '了解工作方式',
  'landing.features.eyebrow': '功能',
  'landing.features.title': '了解身体所需的一切',
  'landing.cta.getStarted': '开始使用',
  'landing.cta.hasAccount': '我已有账户',
};

const LANDING_MS: Record<string, string> = {
  ...LANDING_EN,
  'landing.nav.features': 'Ciri',
  'landing.nav.product': 'Produk',
  'landing.nav.faq': 'Soalan lazim',
  'landing.nav.signIn': 'Log masuk',
  'landing.nav.openApp': 'Buka aplikasi',
  'landing.hero.brand': 'Dore',
  'landing.hero.title': 'Kejelasan kitaran untuk setiap peringkat kewanitaan',
  'landing.hero.lede':
    'Jejaki haid, fahami kesuburan, dan bersedia untuk kehamilan dalam satu teman kesihatan yang tenang dan mengutamakan privasi.',
  'landing.hero.startFree': 'Mula percuma',
  'landing.hero.seeHow': 'Lihat cara ia berfungsi',
  'landing.features.eyebrow': 'Ciri',
  'landing.features.title': 'Semua yang anda perlukan untuk memahami badan anda',
  'landing.cta.getStarted': 'Mulakan',
  'landing.cta.hasAccount': 'Saya sudah ada akaun',
};

export const LANDING_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: LANDING_EN,
  fa: LANDING_FA,
  zh: LANDING_ZH,
  ms: LANDING_MS,
};
