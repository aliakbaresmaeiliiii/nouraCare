import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const uuidv4 = () => crypto.randomUUID();

// Resolve .env relative to this file: prisma/seed.ts -> server/.env
const seedDir = path.resolve(__dirname);
const envPaths = [
  path.resolve(seedDir, '..', '.env'),                  // server/.env when __dirname is server/prisma
  path.resolve(process.cwd(), '.env'),                 // cwd/.env
  path.resolve(process.cwd(), 'server', '.env'),      // when cwd is project root
];
const envPath = envPaths.find((p) => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
  // If dotenv didn't set DATABASE_URL, parse .env manually (e.g. encoding/BOM issues)
  if (!process.env.DATABASE_URL?.trim()) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) {
        const key = m[1];
        const val = m[2].replace(/^["']|["']$/g, '').trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} else {
  dotenv.config(); // fallback: default lookup
}

const envUrl = process.env.DATABASE_URL?.trim();
const databaseUrl =
  envUrl ||
  (process.env.DB_HOST &&
    `mysql://${encodeURIComponent(process.env.DB_USER || 'root')}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${(process.env.DB_NAME || 'CycleTracking').trim()}`);

if (!databaseUrl) {
  console.error('Tried .env paths:', envPaths);
  console.error('DATABASE_URL:', process.env.DATABASE_URL ? '(set)' : '(not set)');
  console.error('DB_HOST:', process.env.DB_HOST ?? '(not set)');
  throw new Error(
    'Missing database URL: set DATABASE_URL in .env, or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.',
  );
}

// Prisma 7 requires a driver adapter for MySQL (no url in schema)
process.env.DATABASE_URL = databaseUrl;
const url = new URL(databaseUrl.replace(/^mysql:\/\//, 'http://'));
const allowPkParam = url.searchParams.get('allowPublicKeyRetrieval');
const allowPublicKeyRetrieval =
  allowPkParam === 'false' || allowPkParam === '0'
    ? false
    : allowPkParam === 'true' || allowPkParam === '1'
      ? true
      : process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL?.trim().toLowerCase() ===
          'false' ||
        process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL?.trim().toLowerCase() === '0'
        ? false
        : true;
const adapter = new PrismaMariaDb({
  host: url.hostname || process.env.DB_HOST || '127.0.0.1',
  port: url.port ? parseInt(url.port, 10) : parseInt(process.env.DB_PORT || '3306', 10),
  user: decodeURIComponent(url.username) || process.env.DB_USER || 'root',
  password: decodeURIComponent(url.password) || process.env.DB_PASSWORD || '',
  database: url.pathname?.replace(/^\//, '') || process.env.DB_NAME || 'CycleTracking',
  connectionLimit: 5,
  connectTimeout: 15000,
  allowPublicKeyRetrieval,
});
const db = new PrismaClient({ adapter });

const now = () => new Date();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Forum categories
  const forumCategories = [
    { id: 'pregnancy-journey', name: 'Pregnancy Journey', description: 'Share your pregnancy experiences', slug: 'pregnancy-journey', color: '#FF6B6B', icon: 'pregnancy', order: 1, isActive: true },
    { id: 'first-trimester', name: 'First Trimester', description: 'Early pregnancy (weeks 1-12)', slug: 'first-trimester', color: '#FF9F43', icon: 'baby-bump', order: 2, isActive: true },
    { id: 'second-trimester', name: 'Second Trimester', description: 'Mid-pregnancy topics', slug: 'second-trimester', color: '#10AC84', icon: 'baby-heartbeat', order: 3, isActive: true },
    { id: 'third-trimester', name: 'Third Trimester', description: 'Late pregnancy and labor', slug: 'third-trimester', color: '#0ABDE3', icon: 'baby-carriage', order: 4, isActive: true },
    { id: 'newborn-care', name: 'Newborn Care', description: 'Caring for your newborn', slug: 'newborn-care', color: '#54A0FF', icon: 'baby-bottle', order: 5, isActive: true },
    { id: 'nutrition-diet', name: 'Nutrition & Diet', description: 'Healthy eating', slug: 'nutrition-diet', color: '#00D2D3', icon: 'nutrition', order: 6, isActive: true },
    { id: 'mental-health', name: 'Mental Health', description: 'Emotional wellbeing', slug: 'mental-health', color: '#FF6B9D', icon: 'mental-health', order: 7, isActive: true },
    { id: 'community-support', name: 'Community Support', description: 'General support', slug: 'community-support', color: '#FF6B9D', icon: 'community', order: 8, isActive: true },
  ];
  for (const c of forumCategories) {
    await db.forum_categories.upsert({
      where: { id: c.id },
      update: { ...c, updatedAt: now() },
      create: { ...c, createdAt: now(), updatedAt: now() },
    });
  }
  console.log(`✅ Forum categories: ${forumCategories.length}`);

  // 2. Cities & districts
  const cityTehran = await db.city.upsert({
    where: { id: 1 },
    update: { name: 'Tehran', state: 'Tehran' },
    create: { id: 1, name: 'Tehran', state: 'Tehran' },
  });
  const cityShiraz = await db.city.upsert({
    where: { id: 2 },
    update: { name: 'Shiraz', state: 'Fars' },
    create: { id: 2, name: 'Shiraz', state: 'Fars' },
  });
  const dist1 = await db.district.upsert({
    where: { id: 1 },
    update: { name: 'District 1', cityId: cityTehran.id },
    create: { id: 1, name: 'District 1', cityId: cityTehran.id },
  });
  const dist2 = await db.district.upsert({
    where: { id: 2 },
    update: { name: 'District 2', cityId: cityTehran.id },
    create: { id: 2, name: 'District 2', cityId: cityTehran.id },
  });
  console.log('✅ Cities & districts');

  // 3. Users
  const upsertUserByEmailOrPhone = async (args: {
    email: string;
    phoneNumber: string;
    fullName: string;
    role: 'ADMIN' | 'USER';
  }) => {
    const existing = await db.user.findFirst({
      where: { OR: [{ email: args.email }, { phoneNumber: args.phoneNumber }] },
    });
    if (existing) {
      return db.user.update({
        where: { id: existing.id },
        data: {
          email: args.email,
          phoneNumber: args.phoneNumber,
          fullName: args.fullName,
          role: args.role,
          status: 'ACTIVE',
          isVerified: true,
          updatedAt: now(),
        },
      });
    }
    return db.user.create({
      data: {
        email: args.email,
        phoneNumber: args.phoneNumber,
        fullName: args.fullName,
        role: args.role,
        status: 'ACTIVE',
        isVerified: true,
        createdAt: now(),
        updatedAt: now(),
      },
    });
  };
  const adminUser = await upsertUserByEmailOrPhone({
    email: 'admin@dorehealth.app',
    phoneNumber: '+989121111111',
    fullName: 'Admin User',
    role: 'ADMIN',
  });
  const seedUser = await upsertUserByEmailOrPhone({
    email: 'user@dorehealth.app',
    phoneNumber: '+989122222222',
    fullName: 'Seed User',
    role: 'USER',
  });
  console.log('✅ Users');

  // 4. User profiles
  await db.user_profile.upsert({
    where: { userId: adminUser.id },
    update: { updatedAt: now() },
    create: { userId: adminUser.id, bio: 'Admin profile', createdAt: now(), updatedAt: now() },
  });
  await db.user_profile.upsert({
    where: { userId: seedUser.id },
    update: { updatedAt: now() },
    create: { userId: seedUser.id, bio: 'Seed user profile', createdAt: now(), updatedAt: now() },
  });
  console.log('✅ User profiles');

  // 5. Post categories
  const postCats = [
    { id: 'pregnancy', name: 'Pregnancy', description: 'Pregnancy related posts', color: '#FF6B6B', icon: 'pregnancy', order: 1, isActive: true },
    { id: 'parenting', name: 'Parenting', description: 'Parenting tips', color: '#10AC84', icon: 'family', order: 2, isActive: true },
    { id: 'health', name: 'Health', description: 'Health & wellness', color: '#54A0FF', icon: 'health', order: 3, isActive: true },
  ];
  for (const c of postCats) {
    await db.post_categories.upsert({
      where: { id: c.id },
      update: { ...c, updatedAt: now() },
      create: { ...c, createdAt: now(), updatedAt: now() },
    });
  }
  console.log('✅ Post categories');

  // 6. Doctors — 500 deterministic UUIDs (idempotent upserts, Persian names)
  const DOCTOR_SEED_COUNT = 500;
  const deterministicDoctorUuid = (index: number) => {
    const hex = (index + 1).toString(16).padStart(12, '0');
    return `f0000000-0000-4000-8000-${hex}`;
  };
  const doctorSpecialties = [
    'Obstetrics & Gynecology',
    'Maternal-Fetal Medicine',
    'Reproductive Endocrinology',
    'Fertility Specialist',
    'Prenatal Care',
    'High-Risk Pregnancy',
    'Pediatrics',
    'Neonatology',
    'Midwifery',
    'Lactation Consultant',
    'Perinatal Psychiatry',
    'Genetic Counseling',
    'Obstetric Anesthesiology',
    "Women's Health Nutrition",
    'Pelvic Floor Physical Therapy',
    'Pediatric Cardiology',
    'Endocrinology',
    'Dermatology',
    'Clinical Psychology',
    'Radiology',
    'Ultrasound Specialist',
    'General Practice',
    'Internal Medicine',
    'Urology',
    'Infectious Disease',
    'Emergency Medicine',
  ] as const;
  const doctorCities = [
    'Tehran',
    'Shiraz',
    'Mashhad',
    'Isfahan',
    'Tabriz',
    'Karaj',
    'Ahvaz',
    'Qom',
    'Kerman',
    'Rasht',
  ] as const;
  const consultRotation = ['ONLINE', 'IN_PERSON', 'BOTH'] as const;
  const persianFirstNames = [
    'فاطمه', 'زهرا', 'مریم', 'سارا', 'نرگس', 'لیلا', 'مینا', 'شیدا', 'پریسا', 'نسرین',
    'الهام', 'ریحانه', 'سمیه', 'طاهره', 'مهسا', 'نگار', 'فریبا', 'گیتی', 'هانیه', 'یسنا',
    'امیر', 'علی', 'محمد', 'حسین', 'رضا', 'مهدی', 'سعید', 'کامران', 'بهرام', 'داریوش',
    'آرش', 'پویا', 'نیما', 'سینا', 'امین', 'فرهاد', 'کیوان', 'مانی', 'پیمان', 'شایان',
  ];
  const persianLastNames = [
    'احمدی', 'محمدی', 'حسینی', 'رضایی', 'کریمی', 'جعفری', 'موسوی', 'علوی', 'نجفی', 'صادقی',
    'اکبری', 'قاسمی', 'رحیمی', 'شریفی', 'مهدوی', 'باقری', 'امینی', 'طاهری', 'نوری', 'زارعی',
    'غلامی', 'فیروزی', 'یزدی', 'کرمی', 'هاشمی', 'سلطانی', 'نظری', 'پورمحمد', 'خسروی', 'آذری',
    'تهرانی', 'اصفهانی', 'شیرازی', 'مشهدی', 'تبریزی', 'رنجبر', 'اسدی', 'عزیزی', 'مرادی', 'لطیفی',
  ];
  const buildPersianDoctorName = (index: number): string => {
    const first = persianFirstNames[index % persianFirstNames.length];
    const last =
      persianLastNames[
        Math.floor(index / persianFirstNames.length) % persianLastNames.length
      ];
    return `دکتر ${first} ${last}`;
  };

  const upsertDoctor = async (i: number) => {
    const id = deterministicDoctorUuid(i);
    const n = i + 1;
    const specialty = doctorSpecialties[i % doctorSpecialties.length];
    const consultationType = consultRotation[i % consultRotation.length];
    const doctorData = {
      fullName: buildPersianDoctorName(i),
      specialty,
      experienceYears: 5 + (i % 20),
      about: `Board-certified specialist in ${specialty}. Seed profile #${n} for development and demos.`,
      rating: 4.2 + (i % 8) * 0.1,
      profileImageUrl: 'assets/images/user-avatar.png',
      clinicName: `کلینیک نورا ${n}`,
      location: doctorCities[i % doctorCities.length],
      contactEmail: `doctor.seed${n}@dorehealth.app`,
      contactPhone: `+98912${String(1_000_000 + n).slice(1)}`,
      consultationType,
      fee: 1_500_000 + (i % 10) * 250_000,
      licenseNumber: String(100000 + n).padStart(6, '0'),
      isVerified: true,
      verifiedAt: now(),
      updatedAt: now(),
    };
    await db.doctors.upsert({
      where: { id },
      update: doctorData,
      create: { id, ...doctorData, createdAt: now() },
    });
  };

  const batchSize = 50;
  for (let start = 0; start < DOCTOR_SEED_COUNT; start += batchSize) {
    const end = Math.min(start + batchSize, DOCTOR_SEED_COUNT);
    await Promise.all(
      Array.from({ length: end - start }, (_, offset) => upsertDoctor(start + offset)),
    );
  }
  console.log(`✅ Doctors (${DOCTOR_SEED_COUNT} seed records)`);

  // 7. Addresses (no unique key except id; create if none)
  const hasAddress = await db.address.findFirst({ where: { userId: adminUser.id } });
  if (!hasAddress) {
    await db.address.create({
      data: {
        userId: adminUser.id,
        cityId: cityTehran.id,
        districtId: dist1.id,
        addressLine: '123 Main St',
      },
    });
  }
  console.log('✅ Addresses');

  // 8. Onboarding data
  await db.onboarding_data.upsert({
    where: { userId: seedUser.id },
    update: { updatedAt: now() },
    create: {
      userId: seedUser.id,
      onboardingStep: 3,
      isCompleted: true,
      createdAt: now(),
      updatedAt: now(),
    },
  }).catch(() => {});
  console.log('✅ Onboarding data');

  // 9. Secret chat + chat members (create once by name or use existing)
  let chatId: string;
  const existingChat = await db.secret_chats.findFirst({ where: { createdById: adminUser.id } });
  if (existingChat) {
    chatId = existingChat.id;
  } else {
    chatId = uuidv4();
    await db.secret_chats.create({
      data: {
        id: chatId,
        name: 'Seed Chat',
        isGroup: false,
        createdById: adminUser.id,
        updatedAt: now(),
      },
    });
  }
  const existingMember = await db.chat_members.findFirst({ where: { chatId, userId: seedUser.id } });
  if (!existingMember) {
    await db.chat_members.create({
      data: { id: uuidv4(), chatId, userId: seedUser.id, role: 'MEMBER' },
    });
  }
  console.log('✅ Secret chats & members');

  // 10. Forums, thread, post (create if not exist)
  let forumId: string;
  let threadId: string;
  let postId: string;
  const existingForum = await db.forums.findFirst({ where: { createdById: adminUser.id } });
  if (existingForum) {
    forumId = existingForum.id;
    const thread = await db.forum_threads.findFirst({ where: { forumId } });
    if (!thread) {
      threadId = uuidv4();
      await db.forum_threads.create({
        data: { id: threadId, title: 'Welcome thread', content: 'Welcome!', forumId, authorId: adminUser.id, updatedAt: now() },
      });
    } else {
      threadId = thread.id;
    }
    let post = await db.forum_posts.findFirst({ where: { threadId } });
    if (!post) {
      postId = uuidv4();
      await db.forum_posts.create({
        data: { id: postId, content: 'First post.', threadId, authorId: seedUser.id, updatedAt: now() },
      });
    } else {
      postId = post.id;
    }
  } else {
    forumId = uuidv4();
    threadId = uuidv4();
    postId = uuidv4();
    await db.forums.create({
      data: {
        id: forumId,
        title: 'Welcome Forum',
        description: 'General welcome and introductions',
        categoryId: 'pregnancy-journey',
        createdById: adminUser.id,
        isPublic: true,
        isActive: true,
        updatedAt: now(),
      },
    });
    await db.forum_threads.create({
      data: {
        id: threadId,
        title: 'Welcome thread',
        content: 'Welcome to the community!',
        forumId,
        authorId: adminUser.id,
        updatedAt: now(),
      },
    });
    await db.forum_posts.create({
      data: {
        id: postId,
        content: 'First post in welcome thread.',
        threadId,
        authorId: seedUser.id,
        updatedAt: now(),
      },
    });
  }
  console.log('✅ Forums, threads, posts');

  // 11. Forum comment (one per post if missing)
  let forumCommentId: string | null = null;
  const hasComment = await db.forum_comments.findFirst({ where: { postId } });
  if (!hasComment) {
    forumCommentId = uuidv4();
    await db.forum_comments.create({
      data: {
        id: forumCommentId,
        comment: 'Thanks for sharing!',
        postId,
        authorId: adminUser.id,
        updatedAt: now(),
      },
    });
  } else {
    forumCommentId = hasComment.id;
  }
  if (forumCommentId) {
    await db.forum_comments.update({
      where: { id: forumCommentId },
      data: { likeCount: 1 },
    });
  }
  console.log('✅ Forum comments');

  // 12. Chat message + message read
  let msgId: string | null = null;
  const hasMsg = await db.chat_messages.findFirst({ where: { chatId } });
  if (!hasMsg) {
    msgId = uuidv4();
    await db.chat_messages.create({
      data: {
        id: msgId,
        content: 'Hello from seed',
        chatId,
        senderId: adminUser.id,
        messageType: 'TEXT',
        updatedAt: now(),
      },
    });
  } else {
    msgId = hasMsg.id;
  }
  if (msgId) {
    const existingRead = await db.message_reads.findFirst({ where: { messageId: msgId, userId: seedUser.id } });
    if (!existingRead) {
      await db.message_reads.create({
        data: { id: uuidv4(), messageId: msgId, userId: seedUser.id },
      });
    }
  }
  console.log('✅ Chat messages & reads');

  // 13. Posts, post_likes, post_media (in secret chat)
  let feedPostId: string | null = null;
  const hasPost = await db.posts.findFirst({ where: { chatId } });
  if (!hasPost) {
    feedPostId = uuidv4();
    await db.posts.create({
      data: {
        id: feedPostId,
        content: 'Seed post content',
        chatId,
        authorId: seedUser.id,
        categoryId: 'pregnancy',
        updatedAt: now(),
      },
    });
  } else {
    feedPostId = hasPost.id;
  }
  if (feedPostId) {
    const existingLike = await db.post_likes.findFirst({ where: { postId: feedPostId, userId: adminUser.id } });
    if (!existingLike) {
      await db.post_likes.create({
        data: { id: uuidv4(), postId: feedPostId, userId: adminUser.id },
      });
    }
    const hasMedia = await db.post_media.findFirst({ where: { postId: feedPostId } });
    if (!hasMedia) {
      await db.post_media.create({
        data: {
          id: uuidv4(),
          postId: feedPostId,
          url: 'https://example.com/seed-image.jpg',
          type: 'IMAGE',
          order: 0,
        },
      });
    }
  }
  console.log('✅ Posts, likes & media');

  // 14. Period log & trackday
  const hasPeriodLog = await db.period_logs.findFirst({ where: { userId: seedUser.id } });
  if (!hasPeriodLog) {
    await db.period_logs.create({
      data: {
        userId: seedUser.id,
        lastPeriodDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: now(),
      },
    });
  }
  const today = new Date(new Date().toISOString().slice(0, 10));
  await db.trackday.upsert({
    where: { userId_date: { userId: seedUser.id, date: today } },
    update: { updatedAt: now() },
    create: {
      userId: seedUser.id,
      date: today,
      mood: 'Good',
      updatedAt: now(),
    },
  });
  console.log('✅ Period logs & trackday');

  // 15. Pregnancy planning
  const hasPlan = await db.pregnancy_planning.findFirst({ where: { userId: seedUser.id } });
  if (!hasPlan) {
    await db.pregnancy_planning.create({
      data: {
        userId: seedUser.id,
        lastPeriodDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        cycleLength: 28,
        averagePeriodDuration: 5,
        updatedAt: now(),
      },
    });
  }
  console.log('✅ Pregnancy planning');

  // 16. Refresh token (one for admin)
  const hasToken = await db.refresh_tokens.findFirst({ where: { userId: adminUser.id } });
  if (!hasToken) {
    await db.refresh_tokens.create({
      data: {
        id: uuidv4(),
        token: uuidv4(),
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log('✅ Refresh tokens');

  console.log('🎉 Database seeding completed for all tables!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });