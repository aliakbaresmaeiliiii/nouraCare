/** Article detail UI, list titles, summaries, and stub copy (per language). */

const ARTICLE_INSIGHTS_TITLES_EN: Record<string, string> = {
  'insights.article.1': 'Your changing body: Up to 42 weeks',
  'insights.article.2': 'Pregnancy discharge decoded',
  'insights.article.3': 'How to prepare for labor',
  'insights.article.4': '9 life-changing masturbation tips',
  'insights.article.5': '8 bump-friendly sex positions',
  'insights.article.6': 'Pregnancy intimacy guide',
  'insights.article.7': 'Early pregnancy symptoms',
  'insights.article.8': 'Understanding pregnancy cramps',
  'insights.article.9': 'Pregnancy skin changes',
  'insights.article.10': 'How to eat safely while pregnant',
  'insights.article.11': 'How much coffee is too much?',
  'insights.article.12': 'Prenatal vitamins guide',
  'insights.article.13': "Baby's support system",
  'insights.article.14': 'How often should your baby move?',
  'insights.article.15': 'Getting ready for your little one',
};

const ARTICLE_INSIGHTS_TITLES_ZH: Record<string, string> = {
  'insights.article.1': '身体变化：直至第 42 周',
  'insights.article.2': '孕期分泌物解读',
  'insights.article.3': '如何为分娩做准备',
  'insights.article.4': '9 个改善自我关怀的小贴士',
  'insights.article.5': '8 种适合孕期的亲密姿势',
  'insights.article.6': '孕期亲密关系指南',
  'insights.article.7': '孕早期常见症状',
  'insights.article.8': '了解孕期痉挛',
  'insights.article.9': '孕期皮肤变化',
  'insights.article.10': '孕期如何安全饮食',
  'insights.article.11': '咖啡喝多少算过量？',
  'insights.article.12': '产前维生素指南',
  'insights.article.13': '宝宝的支持系统',
  'insights.article.14': '宝宝应该多久动一次？',
  'insights.article.15': '为小宝贝做好准备',
};

const ARTICLE_INSIGHTS_TITLES_MS: Record<string, string> = {
  'insights.article.1': 'Perubahan badan anda: Sehingga 42 minggu',
  'insights.article.2': 'Keputihan kehamilan ditafsirkan',
  'insights.article.3': 'Cara bersedia untuk bersalin',
  'insights.article.4': '9 tip penjagaan diri yang membantu',
  'insights.article.5': '8 posisi mesra bonggol',
  'insights.article.6': 'Panduan keintiman semasa hamil',
  'insights.article.7': 'Simptom awal kehamilan',
  'insights.article.8': 'Memahami kekejangan kehamilan',
  'insights.article.9': 'Perubahan kulit semasa hamil',
  'insights.article.10': 'Cara makan dengan selamat semasa hamil',
  'insights.article.11': 'Berapa banyak kopi terlalu banyak?',
  'insights.article.12': 'Panduan vitamin pranatal',
  'insights.article.13': 'Sistem sokongan bayi',
  'insights.article.14': 'Berapa kerap bayi perlu bergerak?',
  'insights.article.15': 'Bersedia untuk si kecil',
};

const ARTICLE_INSIGHTS_TITLES_FA: Record<string, string> = {
  'insights.article.1': 'تغییرات بدن شما: تا هفتهٔ ۴۲',
  'insights.article.2': 'ترشحات بارداری؛ معنی هر کدام',
  'insights.article.3': 'چطور برای زایمان آماده شوید',
  'insights.article.4': '۹ نکتهٔ مهم برای خودارضایی',
  'insights.article.5': '۸ وضعیت رابطه مناسب شکم بزرگ',
  'insights.article.6': 'راهنمای صمیمیت در بارداری',
  'insights.article.7': 'علائم اولیهٔ بارداری',
  'insights.article.8': 'درک گرفتگی‌های بارداری',
  'insights.article.9': 'تغییرات پوست در بارداری',
  'insights.article.10': 'چگونه در بارداری ایمن بخورید',
  'insights.article.11': 'چقدر قهوه زیاد است؟',
  'insights.article.12': 'راهنمای ویتامین‌های دوران بارداری',
  'insights.article.13': 'سامانهٔ حمایت از نوزاد',
  'insights.article.14': 'نوزاد باید چند وقت یک‌بار حرکت کند؟',
  'insights.article.15': 'آماده‌شدن برای نوزاد کوچک شما',
};

const ARTICLE_UI_EN: Record<string, string> = {
  'article.toolbarTitle': 'Article',
  'article.loading': 'Loading article...',
  'article.notFoundTitle': 'Article Not Found',
  'article.notFoundMessage':
    "The article you're looking for doesn't exist or has been removed.",
  'article.backToArticles': 'Back to Articles',
  'article.shareAria': 'Share article',
  'article.imageAlt': 'Article image',
  'article.tags': 'Tags',
  'article.addFavorite': 'Add to Favorites',
  'article.removeFavorite': 'Remove from Favorites',
  'article.share': 'Share Article',
  'article.relatedTitle': 'You might also like',
  'article.relatedHeading': 'Related Article',
  'article.relatedHint': 'Discover more helpful content',
  'article.inBrief': 'In brief',
  'article.readTime': '{{minutes}} min read',
  'article.authorDefault': 'NouraCare Editorial',
  'article.toast.linkCopied': 'Link copied to clipboard',
  'article.toast.copyFailed':
    'Could not copy automatically. Select the address bar to copy the link.',
  'article.category.pregnancy': 'Pregnancy',
  'article.category.intimacy': 'Intimacy',
  'article.category.symptoms': 'Symptoms',
  'article.category.nutrition': 'Nutrition',
  'article.category.baby': 'Baby',
  'article.stub.intro':
    'This article offers practical, evidence-informed guidance for your pregnancy journey. Read at your own pace and discuss any concerns with your care team.',
  'article.stub.body1':
    'Every pregnancy is unique. Use this overview as a starting point, then follow up with your midwife or doctor for advice tailored to you.',
  'article.stub.body2':
    'Save articles you find helpful to revisit later, and explore related topics in Insights for more tips and reassurance.',
  'article.tag.pregnancy': 'Pregnancy',
  'article.tag.health': 'Health',
  'article.tag.wellness': 'Wellness',
  'article.summary.2':
    'Learn what different discharge patterns can mean and when to contact your provider.',
  'article.summary.3':
    'Practical steps to prepare your body, mind, and support network for labor and birth.',
  'article.summary.4':
    'Comfortable, safe ways to explore pleasure and connection during pregnancy.',
  'article.summary.5':
    'Positions and tips designed for comfort as your bump grows.',
  'article.summary.6':
    'Communication, boundaries, and intimacy through each trimester.',
  'article.summary.7':
    'Common early signs, what is normal, and when to seek medical advice.',
  'article.summary.8':
    'Types of cramps, relief ideas, and warning signs to watch for.',
  'article.summary.9':
    'Skin changes you may notice and gentle care routines that help.',
  'article.summary.12':
    'Which supplements matter most and how to take them safely.',
  'article.summary.13':
    'How the placenta, umbilical cord, and fluids support your growing baby.',
  'article.summary.14':
    'Kick counts, patterns, and when to call your care team about movement.',
  'article.summary.15':
    'Checklists and calm planning for the weeks before baby arrives.',
};

const ARTICLE_UI_ZH: Record<string, string> = {
  'article.toolbarTitle': '文章',
  'article.loading': '正在加载文章…',
  'article.notFoundTitle': '未找到文章',
  'article.notFoundMessage': '您查找的文章不存在或已被移除。',
  'article.backToArticles': '返回文章列表',
  'article.shareAria': '分享文章',
  'article.imageAlt': '文章配图',
  'article.tags': '标签',
  'article.addFavorite': '加入收藏',
  'article.removeFavorite': '取消收藏',
  'article.share': '分享文章',
  'article.relatedTitle': '您可能还喜欢',
  'article.relatedHeading': '相关文章',
  'article.relatedHint': '发现更多实用内容',
  'article.inBrief': '简要概述',
  'article.readTime': '{{minutes}} 分钟阅读',
  'article.authorDefault': 'NouraCare 编辑部',
  'article.toast.linkCopied': '链接已复制到剪贴板',
  'article.toast.copyFailed': '无法自动复制，请在地址栏手动复制链接。',
  'article.category.pregnancy': '孕期',
  'article.category.intimacy': '亲密关系',
  'article.category.symptoms': '症状',
  'article.category.nutrition': '营养',
  'article.category.baby': '宝宝',
  'article.stub.intro':
    '本文提供实用、有依据的孕期指导。请按自己的节奏阅读，如有疑问请咨询医护团队。',
  'article.stub.body1':
    '每次怀孕都不相同。请将本文作为起点，并向助产士或医生获取个性化建议。',
  'article.stub.body2':
    '收藏有用的文章以便回顾，并在“洞察”中探索更多相关主题。',
  'article.tag.pregnancy': '孕期',
  'article.tag.health': '健康',
  'article.tag.wellness': '身心健康',
  'article.summary.2': '了解不同分泌物可能意味着什么，以及何时联系医生。',
  'article.summary.3': '为分娩做好身体、心理和支持网络准备的实用步骤。',
  'article.summary.4': '孕期安全、舒适的愉悦与亲密探索方式。',
  'article.summary.5': '随着腹部增大仍舒适的姿势与技巧。',
  'article.summary.6': '各孕期的沟通、界限与亲密关系。',
  'article.summary.7': '常见早孕迹象、正常范围及何时就医。',
  'article.summary.8': '痉挛类型、缓解方法及需警惕的信号。',
  'article.summary.9': '可能出现的皮肤变化及温和护理方法。',
  'article.summary.12': '哪些补充剂最重要以及如何安全服用。',
  'article.summary.13': '胎盘、脐带和羊水如何支持宝宝成长。',
  'article.summary.14': '数胎动、规律变化及何时因胎动联系医护。',
  'article.summary.15': '宝宝到来前几周的清单与从容准备。',
};

const ARTICLE_UI_MS: Record<string, string> = {
  'article.toolbarTitle': 'Artikel',
  'article.loading': 'Memuatkan artikel…',
  'article.notFoundTitle': 'Artikel Tidak Dijumpai',
  'article.notFoundMessage':
    'Artikel yang anda cari tidak wujud atau telah dialih keluar.',
  'article.backToArticles': 'Kembali ke Artikel',
  'article.shareAria': 'Kongsi artikel',
  'article.imageAlt': 'Imej artikel',
  'article.tags': 'Tag',
  'article.addFavorite': 'Tambah ke Kegemaran',
  'article.removeFavorite': 'Buang dari Kegemaran',
  'article.share': 'Kongsi Artikel',
  'article.relatedTitle': 'Anda mungkin juga suka',
  'article.relatedHeading': 'Artikel Berkaitan',
  'article.relatedHint': 'Temui lebih banyak kandungan berguna',
  'article.inBrief': 'Ringkasnya',
  'article.readTime': '{{minutes}} min bacaan',
  'article.authorDefault': 'Editorial NouraCare',
  'article.toast.linkCopied': 'Pautan disalin ke papan keratan',
  'article.toast.copyFailed':
    'Tidak dapat menyalin secara automatik. Pilih bar alamat untuk menyalin pautan.',
  'article.category.pregnancy': 'Kehamilan',
  'article.category.intimacy': 'Keintiman',
  'article.category.symptoms': 'Simptom',
  'article.category.nutrition': 'Pemakanan',
  'article.category.baby': 'Bayi',
  'article.stub.intro':
    'Artikel ini menawarkan panduan praktikal berasaskan bukti untuk perjalanan kehamilan anda. Baca mengikut kadar anda sendiri dan bincang sebarang kebimbangan dengan pasukan penjagaan anda.',
  'article.stub.body1':
    'Setiap kehamilan adalah unik. Gunakan gambaran ini sebagai permulaan, kemudian susuli dengan bidan atau doktor anda untuk nasihat yang disesuaikan.',
  'article.stub.body2':
    'Simpan artikel yang membantu untuk dibaca semula, dan terokai topik berkaitan dalam Insights.',
  'article.tag.pregnancy': 'Kehamilan',
  'article.tag.health': 'Kesihatan',
  'article.tag.wellness': 'Kesejahteraan',
  'article.summary.2':
    'Ketahui maksud corak keputihan berbeza dan bila menghubungi penyedia penjagaan anda.',
  'article.summary.3':
    'Langkah praktikal untuk menyediakan badan, minda, dan rangkaian sokongan untuk bersalin.',
  'article.summary.4':
    'Cara selesa dan selamat untuk meneroka keseronokan dan hubungan semasa hamil.',
  'article.summary.5':
    'Posisi dan tip direka untuk keselesaan apabila bonggol membesar.',
  'article.summary.6':
    'Komunikasi, sempadan, dan keintiman sepanjang setiap trimester.',
  'article.summary.7':
    'Tanda awal biasa, apa yang normal, dan bila mendapatkan nasihat perubatan.',
  'article.summary.8':
    'Jenis kekejangan, idea relief, dan tanda amaran untuk diperhatikan.',
  'article.summary.9':
    'Perubahan kulit yang mungkin anda perasan dan rutin penjagaan lembut yang membantu.',
  'article.summary.12':
    'Suplemen mana yang paling penting dan cara mengambilnya dengan selamat.',
  'article.summary.13':
    'Bagaimana plasenta, tali pusat, dan cecair menyokong bayi yang membesar.',
  'article.summary.14':
    'Kiraan tendangan, corak, dan bila menghubungi pasukan penjagaan tentang pergerakan.',
  'article.summary.15':
    'Senarai semak dan perancangan tenang untuk minggu sebelum bayi tiba.',
};

const ARTICLE_UI_FA: Record<string, string> = {
  'article.toolbarTitle': 'مقاله',
  'article.loading': 'در حال بارگذاری مقاله…',
  'article.notFoundTitle': 'مقاله یافت نشد',
  'article.notFoundMessage':
    'مقاله‌ای که می‌خواهید وجود ندارد یا حذف شده است.',
  'article.backToArticles': 'بازگشت به مقالات',
  'article.shareAria': 'اشتراک‌گذاری مقاله',
  'article.imageAlt': 'تصویر مقاله',
  'article.tags': 'برچسب‌ها',
  'article.addFavorite': 'افزودن به علاقه‌مندی‌ها',
  'article.removeFavorite': 'حذف از علاقه‌مندی‌ها',
  'article.share': 'اشتراک‌گذاری مقاله',
  'article.relatedTitle': 'شاید این‌ها را هم بپسندید',
  'article.relatedHeading': 'مقالهٔ مرتبط',
  'article.relatedHint': 'محتوای مفید بیشتری کشف کنید',
  'article.inBrief': 'خلاصه',
  'article.readTime': '{{minutes}} دقیقه مطالعه',
  'article.authorDefault': 'تحریریهٔ NouraCare',
  'article.toast.linkCopied': 'پیوند در کلیپ‌بورد کپی شد',
  'article.toast.copyFailed':
    'کپی خودکار ممکن نشد. برای کپی، نوار آدرس را انتخاب کنید.',
  'article.category.pregnancy': 'بارداری',
  'article.category.intimacy': 'صمیمیت',
  'article.category.symptoms': 'علائم',
  'article.category.nutrition': 'تغذیه',
  'article.category.baby': 'نوزاد',
  'article.stub.intro':
    'این مقاله راهنمای عملی مبتنی بر شواهد برای مسیر بارداری شماست. با آرامش بخوانید و نگرانی‌ها را با تیم مراقبتی در میان بگذارید.',
  'article.stub.body1':
    'هر بارداری منحصربه‌فرد است. این مرور را نقطهٔ شروع بدانید و برای توصیهٔ شخصی با ماما یا پزشک خود مشورت کنید.',
  'article.stub.body2':
    'مقالات مفید را ذخیره کنید و در بخش بینش موضوعات مرتبط را ببینید.',
  'article.tag.pregnancy': 'بارداری',
  'article.tag.health': 'سلامت',
  'article.tag.wellness': 'تندرستی',
  'article.summary.2':
    'بیاموزید الگوهای مختلف ترشحات چه معنی دارند و چه زمانی با پزشک تماس بگیرید.',
  'article.summary.3':
    'گام‌های عملی برای آماده‌سازی جسم، ذهن و شبکهٔ حمایت برای زایمان.',
  'article.summary.4':
    'راه‌های راحت و ایمن برای لذت و ارتباط در بارداری.',
  'article.summary.5':
    'وضعیت‌ها و نکات مناسب وقتی شکم بزرگ می‌شود.',
  'article.summary.6':
    'ارتباط، مرزها و صمیمیت در هر سه‌ماهه.',
  'article.summary.7':
    'نشانه‌های رایج اوایل بارداری، حد طبیعی و زمان مراجعهٔ پزشکی.',
  'article.summary.8':
    'انواع گرفتگی، راه‌های تسکین و علائم هشدار.',
  'article.summary.9':
    'تغییرات پوستی که ممکن است ببینید و مراقبت‌های ملایم.',
  'article.summary.12':
    'کدام مکمل‌ها مهم‌ترند و چگونه ایمن مصرف شوند.',
  'article.summary.13':
    'چگونه جفت، بند ناف و مایعات از رشد جنین حمایت می‌کنند.',
  'article.summary.14':
    'شمارش لگد، الگوها و زمان تماس با تیم مراقبت دربارهٔ حرکت.',
  'article.summary.15':
    'چک‌لیست و برنامه‌ریزی آرام برای هفته‌های قبل از تولد.',
};

export const ARTICLE_TRANSLATIONS = {
  en: {
    ...ARTICLE_INSIGHTS_TITLES_EN,
    ...ARTICLE_UI_EN,
  },
  zh: {
    ...ARTICLE_INSIGHTS_TITLES_ZH,
    ...ARTICLE_UI_ZH,
  },
  ms: {
    ...ARTICLE_INSIGHTS_TITLES_MS,
    ...ARTICLE_UI_MS,
  },
  fa: {
    ...ARTICLE_INSIGHTS_TITLES_FA,
    ...ARTICLE_UI_FA,
  },
} as const;

/** Category slug per article id (insights catalog). */
export const ARTICLE_CATEGORY_BY_ID: Record<string, string> = {
  '1': 'pregnancy',
  '2': 'pregnancy',
  '3': 'pregnancy',
  '4': 'intimacy',
  '5': 'intimacy',
  '6': 'intimacy',
  '7': 'symptoms',
  '8': 'symptoms',
  '9': 'symptoms',
  '10': 'nutrition',
  '11': 'nutrition',
  '12': 'nutrition',
  '13': 'baby',
  '14': 'baby',
  '15': 'baby',
};

/** Hero images aligned with Insights cards. */
export const ARTICLE_IMAGE_BY_ID: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=400&fit=crop',
  '2': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
  '3': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop',
  '4': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop',
  '5': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
  '6': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=400&fit=crop',
  '7': 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=800&h=400&fit=crop',
  '8': 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=400&fit=crop',
  '9': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
  '10': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop',
  '11': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=400&fit=crop',
  '12': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop',
  '13': 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=400&fit=crop',
  '14': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
  '15': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=400&fit=crop',
};

export const ARTICLE_PUBLISH_DATE_BY_ID: Record<string, string> = {
  '1': '2024-01-20',
  '2': '2024-01-18',
  '3': '2024-01-17',
  '4': '2024-01-16',
  '5': '2024-01-14',
  '6': '2024-01-13',
  '7': '2024-01-12',
  '8': '2024-01-11',
  '9': '2024-01-10',
  '10': '2024-01-15',
  '11': '2024-01-10',
  '12': '2024-01-08',
  '13': '2024-01-07',
  '14': '2024-01-06',
  '15': '2024-01-05',
};

export const ARTICLE_READ_MINUTES_BY_ID: Record<string, number> = {
  '1': 7,
  '10': 5,
  '11': 4,
};

export const VALID_ARTICLE_IDS = new Set([
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15',
]);
