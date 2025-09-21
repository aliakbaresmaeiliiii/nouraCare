import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  {
    id: 'trying-to-conceive',
    name: 'Trying to conceive',
    description: 'Questions and support for conception journey',
    color: '#FF6B9D',
    icon: '💕',
    order: 1,
  },
  {
    id: 'pregnancy-tests',
    name: 'Pregnancy tests',
    description: 'Testing experiences and questions',
    color: '#4ECDC4',
    icon: '🧪',
    order: 2,
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    description: 'Tracking and understanding ovulation',
    color: '#45B7D1',
    icon: '📅',
    order: 3,
  },
  {
    id: 'pregnancy',
    name: 'Pregnancy',
    description: 'General pregnancy discussions',
    color: '#96CEB4',
    icon: '🤱',
    order: 4,
  },
  {
    id: '1st-trimester',
    name: '1st trimester',
    description: 'First trimester experiences and questions',
    color: '#FFEAA7',
    icon: '🌱',
    order: 5,
  },
  {
    id: '2nd-trimester',
    name: '2nd trimester',
    description: 'Second trimester discussions',
    color: '#FD79A8',
    icon: '🌸',
    order: 6,
  },
  {
    id: '3rd-trimester',
    name: '3rd trimester',
    description: 'Third trimester experiences',
    color: '#E17055',
    icon: '🌺',
    order: 7,
  },
  {
    id: 'parenthood',
    name: 'Parenthood',
    description: 'Life with your little one',
    color: '#A29BFE',
    icon: '👶',
    order: 8,
  },
  {
    id: 'postpartum',
    name: 'Postpartum',
    description: 'Recovery and postpartum life',
    color: '#FD79A8',
    icon: '🌼',
    order: 9,
  },
  {
    id: 'relationships',
    name: 'Relationships',
    description: 'Partner and family relationships',
    color: '#FDCB6E',
    icon: '💑',
    order: 10,
  },
];

async function seedCategories() {
  console.log('🌱 Seeding post categories...');

  try {
    // Use upsert to avoid duplicates
    for (const category of categories) {
      await prisma.postCategory.upsert({
        where: { id: category.id },
        update: {
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          order: category.order,
        },
        create: category,
      });
    }

    console.log('✅ Categories seeded successfully!');
    console.log(`
📊 Created/Updated ${categories.length} categories:
${categories.map(c => `- ${c.icon} ${c.name}`).join('\n')}

🧪 Test the categories API:
- GET /api/v1/secret-chats/categories (get all categories)
- GET /api/v1/secret-chats/categories/trying-to-conceive (get specific category)
- GET /api/v1/secret-chats/{chatId}/posts?categoryId=pregnancy (filter posts by category)
    `);

  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedCategories };
