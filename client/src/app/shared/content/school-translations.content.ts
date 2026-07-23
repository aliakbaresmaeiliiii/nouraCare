import { SCHOOL_WEEK_EN } from '@app/shared/content/school-week.en.content';
import { SCHOOL_WEEK_ZH } from '@app/shared/content/school-week.zh.content';
import { SCHOOL_WEEK_MS } from '@app/shared/content/school-week.ms.content';
import { SCHOOL_WEEK_FA } from '@app/shared/content/school-week.fa.content';

const SCHOOL_UI_EN: Record<string, string> = {
  'school.page.title': 'Baby development',
  'school.page.subtitle':
    'See how big baby is this week, what is changing, and slide to peek at other weeks.',
  'school.explore.viewing':
    'You are viewing week {{week}}. Your pregnancy is week {{actualWeek}}.',
  'school.explore.goToMyWeek': 'Go to my week',
  'school.week.previousAria': 'Previous week',
  'school.week.nextAria': 'Next week',
  'school.week.kicker': 'Pregnancy',
  'school.week.label': 'Week {{week}}',
  'school.week.of': 'of 40',
  'school.size.about': 'About this size',
  'school.size.growing': 'Growing',
  'school.size.defaultDesc': 'Your baby is growing beautifully.',
  'school.stat.weight': 'Weight',
  'school.stat.length': 'Length',
  'school.section.development': "This week's development",
  'school.section.didYouKnow': 'Did you know?',
  'school.empty.title': 'No active pregnancy',
  'school.empty.message':
    'When you mark pregnancy in the app, this tab shows week-by-week growth, size, and simple explanations you can read in a minute.',
  'school.empty.goHome': 'Go to home',
};

const SCHOOL_UI_ZH: Record<string, string> = {
  'school.page.title': '胎儿发育',
  'school.page.subtitle':
    '了解宝宝本周大小、身体变化，滑动可查看其他孕周。',
  'school.explore.viewing':
    '您正在查看第 {{week}} 周。您的孕周为第 {{actualWeek}} 周。',
  'school.explore.goToMyWeek': '回到我的孕周',
  'school.week.previousAria': '上一周',
  'school.week.nextAria': '下一周',
  'school.week.kicker': '孕期',
  'school.week.label': '第 {{week}} 周',
  'school.week.of': '/ 40 周',
  'school.size.about': '大约这么大',
  'school.size.growing': '成长中',
  'school.size.defaultDesc': '宝宝正在健康地成长。',
  'school.stat.weight': '体重',
  'school.stat.length': '身长',
  'school.section.development': '本周发育',
  'school.section.didYouKnow': '你知道吗？',
  'school.empty.title': '暂无孕期记录',
  'school.empty.message':
    '在应用中标记怀孕后，此标签将显示逐周成长、大小和简短说明，一分钟即可阅读。',
  'school.empty.goHome': '返回首页',
};

const SCHOOL_UI_MS: Record<string, string> = {
  'school.page.title': 'Perkembangan bayi',
  'school.page.subtitle':
    'Lihat saiz bayi minggu ini, perubahan yang berlaku, dan leret untuk minggu lain.',
  'school.explore.viewing':
    'Anda melihat minggu {{week}}. Kehamilan anda minggu {{actualWeek}}.',
  'school.explore.goToMyWeek': 'Pergi ke minggu saya',
  'school.week.previousAria': 'Minggu sebelumnya',
  'school.week.nextAria': 'Minggu seterusnya',
  'school.week.kicker': 'Kehamilan',
  'school.week.label': 'Minggu {{week}}',
  'school.week.of': 'daripada 40',
  'school.size.about': 'Kira-kira saiz ini',
  'school.size.growing': 'Sedang membesar',
  'school.size.defaultDesc': 'Bayi anda membesar dengan sihat.',
  'school.stat.weight': 'Berat',
  'school.stat.length': 'Panjang',
  'school.section.development': 'Perkembangan minggu ini',
  'school.section.didYouKnow': 'Tahukah anda?',
  'school.empty.title': 'Tiada kehamilan aktif',
  'school.empty.message':
    'Apabila anda tandakan kehamilan dalam aplikasi, tab ini memaparkan pertumbuhan minggu demi minggu, saiz, dan penjelasan ringkas.',
  'school.empty.goHome': 'Pergi ke laman utama',
};

const SCHOOL_UI_FA: Record<string, string> = {
  'school.page.title': 'رشد جنین',
  'school.page.subtitle':
    'اندازهٔ جنین این هفته، تغییرات و مرور هفته‌های دیگر را ببینید.',
  'school.explore.viewing':
    'هفته {{week}} را می‌بینید. هفتهٔ بارداری شما {{actualWeek}} است.',
  'school.explore.goToMyWeek': 'برو به هفتهٔ من',
  'school.week.previousAria': 'هفتهٔ قبل',
  'school.week.nextAria': 'هفتهٔ بعد',
  'school.week.kicker': 'بارداری',
  'school.week.label': 'هفته {{week}}',
  'school.week.of': 'از ۴۰',
  'school.size.about': 'حدوداً به این اندازه',
  'school.size.growing': 'در حال رشد',
  'school.size.defaultDesc': 'جنین شما زیبا در حال رشد است.',
  'school.stat.weight': 'وزن',
  'school.stat.length': 'قد',
  'school.section.development': 'رشد این هفته',
  'school.section.didYouKnow': 'می‌دانستید؟',
  'school.empty.title': 'بارداری فعال نیست',
  'school.empty.message':
    'وقتی بارداری را در برنامه علامت بزنید، این تب رشد هفته‌به‌هفته، اندازه و توضیحات کوتاه را نشان می‌دهد.',
  'school.empty.goHome': 'رفتن به خانه',
};

/** Merged school copy per app language (UI + week-specific strings). */
export const SCHOOL_TRANSLATIONS = {
  en: { ...SCHOOL_UI_EN, ...SCHOOL_WEEK_EN },
  zh: { ...SCHOOL_UI_ZH, ...SCHOOL_WEEK_ZH },
  ms: { ...SCHOOL_UI_MS, ...SCHOOL_WEEK_MS },
  fa: { ...SCHOOL_UI_FA, ...SCHOOL_WEEK_FA },
} as const;
