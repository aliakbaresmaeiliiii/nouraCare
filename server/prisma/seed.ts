import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.address.deleteMany();
  await prisma.district.deleteMany();
  await prisma.city.deleteMany();

  // Create Malaysia cities with districts
  const cities = [
    {
      name: 'Kuala Lumpur',
      state: 'Federal Territory',
      districts: [
        { name: 'Kuala Lumpur City Centre' },
        { name: 'Bangsar' },
        { name: 'Petaling Jaya' },
        { name: 'Subang Jaya' },
        { name: 'Shah Alam' },
      ]
    },
    {
      name: 'Penang',
      state: 'Penang',
      districts: [
        { name: 'George Town' },
        { name: 'Bayan Lepas' },
        { name: 'Butterworth' },
        { name: 'Bukit Mertajam' },
        { name: 'Nibong Tebal' },
      ]
    },
    {
      name: 'Johor Bahru',
      state: 'Johor',
      districts: [
        { name: 'Johor Bahru City' },
        { name: 'Skudai' },
        { name: 'Tebrau' },
        { name: 'Kulai' },
        { name: 'Batu Pahat' },
      ]
    },
    {
      name: 'Malacca',
      state: 'Malacca',
      districts: [
        { name: 'Malacca City' },
        { name: 'Alor Gajah' },
        { name: 'Jasin' },
        { name: 'Masjid Tanah' },
        { name: 'Merlimau' },
      ]
    },
    {
      name: 'Ipoh',
      state: 'Perak',
      districts: [
        { name: 'Ipoh City' },
        { name: 'Taiping' },
        { name: 'Kuala Kangsar' },
        { name: 'Lumut' },
        { name: 'Teluk Intan' },
      ]
    }
  ];

  for (const cityData of cities) {
    const city = await prisma.city.create({
      data: {
        name: cityData.name,
        state: cityData.state,
        districts: {
          create: cityData.districts
        }
      }
    });
    console.log(`✅ Created city: ${city.name} with ${cityData.districts.length} districts`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
