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
    // Federal Territories
    {
      name: 'Kuala Lumpur',
      state: 'Federal Territory',
      districts: [
        { name: 'Kuala Lumpur City Centre' },
        { name: 'Bangsar' },
        { name: 'Ampang' },
        { name: 'Cheras' },
        { name: 'Setapak' },
        { name: 'Wangsa Maju' },
        { name: 'Titiwangsa' },
        { name: 'Lembah Pantai' },
        { name: 'Seputeh' },
        { name: 'Bandar Tun Razak' }
      ]
    },
    {
      name: 'Putrajaya',
      state: 'Federal Territory',
      districts: [
        { name: 'Presint 1' },
        { name: 'Presint 2' },
        { name: 'Presint 3' },
        { name: 'Presint 4' },
        { name: 'Presint 5' },
        { name: 'Presint 6' },
        { name: 'Presint 7' },
        { name: 'Presint 8' },
        { name: 'Presint 9' },
        { name: 'Presint 10' }
      ]
    },
    {
      name: 'Labuan',
      state: 'Federal Territory',
      districts: [
        { name: 'Labuan Town' },
        { name: 'Rancha-Rancha' },
        { name: 'Batu Arang' },
        { name: 'Layang-Layangan' },
        { name: 'Bukit Kalam' }
      ]
    },

    // Selangor
    {
      name: 'Shah Alam',
      state: 'Selangor',
      districts: [
        { name: 'Shah Alam City Centre' },
        { name: 'Seksyen 1-24' },
        { name: 'Kota Kemuning' },
        { name: 'Bukit Jelutong' },
        { name: 'Setia Alam' }
      ]
    },
    {
      name: 'Petaling Jaya',
      state: 'Selangor',
      districts: [
        { name: 'Petaling Jaya City Centre' },
        { name: 'SS2' },
        { name: 'Taman Tun Dr Ismail' },
        { name: 'Ara Damansara' },
        { name: 'Kota Damansara' }
      ]
    },
    {
      name: 'Subang Jaya',
      state: 'Selangor',
      districts: [
        { name: 'Subang Jaya City Centre' },
        { name: 'USJ' },
        { name: 'Putra Heights' },
        { name: 'Puchong' },
        { name: 'Seri Kembangan' }
      ]
    },
    {
      name: 'Klang',
      state: 'Selangor',
      districts: [
        { name: 'Klang Town' },
        { name: 'Port Klang' },
        { name: 'Pandamaran' },
        { name: 'Teluk Pulai' },
        { name: 'Bandar Bukit Tinggi' }
      ]
    },
    {
      name: 'Kajang',
      state: 'Selangor',
      districts: [
        { name: 'Kajang Town' },
        { name: 'Sungai Chua' },
        { name: 'Taman Prima Saujana' },
        { name: 'Bandar Teknologi Kajang' },
        { name: 'Semenyih' }
      ]
    },

    // Penang
    {
      name: 'George Town',
      state: 'Penang',
      districts: [
        { name: 'George Town City Centre' },
        { name: 'Gurney Drive' },
        { name: 'Tanjung Tokong' },
        { name: 'Tanjung Bungah' },
        { name: 'Batu Ferringhi' }
      ]
    },
    {
      name: 'Butterworth',
      state: 'Penang',
      districts: [
        { name: 'Butterworth Town' },
        { name: 'Seberang Jaya' },
        { name: 'Perai' },
        { name: 'Bukit Mertajam' },
        { name: 'Nibong Tebal' }
      ]
    },

    // Johor
    {
      name: 'Johor Bahru',
      state: 'Johor',
      districts: [
        { name: 'Johor Bahru City Centre' },
        { name: 'Skudai' },
        { name: 'Tebrau' },
        { name: 'Kulai' },
        { name: 'Batu Pahat' }
      ]
    },
    {
      name: 'Pasir Gudang',
      state: 'Johor',
      districts: [
        { name: 'Pasir Gudang Industrial' },
        { name: 'Taman Pasir Putih' },
        { name: 'Taman Kota Masai' },
        { name: 'Taman Rinting' },
        { name: 'Masai' }
      ]
    },
    {
      name: 'Kluang',
      state: 'Johor',
      districts: [
        { name: 'Kluang Town' },
        { name: 'Simpang Renggam' },
        { name: 'Kahang' },
        { name: 'Paloh' },
        { name: 'Rengam' }
      ]
    },

    // Perak
    {
      name: 'Ipoh',
      state: 'Perak',
      districts: [
        { name: 'Ipoh City Centre' },
        { name: 'Taiping' },
        { name: 'Kuala Kangsar' },
        { name: 'Lumut' },
        { name: 'Teluk Intan' }
      ]
    },
    {
      name: 'Taiping',
      state: 'Perak',
      districts: [
        { name: 'Taiping Town' },
        { name: 'Kuala Sepetang' },
        { name: 'Simpang' },
        { name: 'Trong' },
        { name: 'Pokok Assam' }
      ]
    },

    // Kedah
    {
      name: 'Alor Setar',
      state: 'Kedah',
      districts: [
        { name: 'Alor Setar City Centre' },
        { name: 'Kuala Kedah' },
        { name: 'Pokok Sena' },
        { name: 'Kubang Pasu' },
        { name: 'Pendang' }
      ]
    },
    {
      name: 'Sungai Petani',
      state: 'Kedah',
      districts: [
        { name: 'Sungai Petani Town' },
        { name: 'Bedong' },
        { name: 'Gurun' },
        { name: 'Merbok' },
        { name: 'Sik' }
      ]
    },

    // Kelantan
    {
      name: 'Kota Bharu',
      state: 'Kelantan',
      districts: [
        { name: 'Kota Bharu City Centre' },
        { name: 'Kubang Kerian' },
        { name: 'Ketereh' },
        { name: 'Pasir Mas' },
        { name: 'Tumpat' }
      ]
    },

    // Terengganu
    {
      name: 'Kuala Terengganu',
      state: 'Terengganu',
      districts: [
        { name: 'Kuala Terengganu City Centre' },
        { name: 'Marang' },
        { name: 'Dungun' },
        { name: 'Kemaman' },
        { name: 'Setiu' }
      ]
    },

    // Pahang
    {
      name: 'Kuantan',
      state: 'Pahang',
      districts: [
        { name: 'Kuantan City Centre' },
        { name: 'Gambang' },
        { name: 'Pekan' },
        { name: 'Rompin' },
        { name: 'Maran' }
      ]
    },
    {
      name: 'Temerloh',
      state: 'Pahang',
      districts: [
        { name: 'Temerloh Town' },
        { name: 'Mentakab' },
        { name: 'Triang' },
        { name: 'Jerantut' },
        { name: 'Raub' }
      ]
    },

    // Negeri Sembilan
    {
      name: 'Seremban',
      state: 'Negeri Sembilan',
      districts: [
        { name: 'Seremban City Centre' },
        { name: 'Nilai' },
        { name: 'Port Dickson' },
        { name: 'Rembau' },
        { name: 'Jempol' }
      ]
    },

    // Malacca
    {
      name: 'Malacca City',
      state: 'Malacca',
      districts: [
        { name: 'Malacca City Centre' },
        { name: 'Alor Gajah' },
        { name: 'Jasin' },
        { name: 'Masjid Tanah' },
        { name: 'Merlimau' }
      ]
    },

    // Sabah
    {
      name: 'Kota Kinabalu',
      state: 'Sabah',
      districts: [
        { name: 'Kota Kinabalu City Centre' },
        { name: 'Likas' },
        { name: 'Inanam' },
        { name: 'Penampang' },
        { name: 'Putatan' }
      ]
    },
    {
      name: 'Sandakan',
      state: 'Sabah',
      districts: [
        { name: 'Sandakan Town' },
        { name: 'Beluran' },
        { name: 'Kinabatangan' },
        { name: 'Telupid' },
        { name: 'Tongod' }
      ]
    },
    {
      name: 'Tawau',
      state: 'Sabah',
      districts: [
        { name: 'Tawau Town' },
        { name: 'Lahad Datu' },
        { name: 'Kunak' },
        { name: 'Semporna' },
        { name: 'Kalabakan' }
      ]
    },

    // Sarawak
    {
      name: 'Kuching',
      state: 'Sarawak',
      districts: [
        { name: 'Kuching City Centre' },
        { name: 'Padawan' },
        { name: 'Bau' },
        { name: 'Lundu' },
        { name: 'Samarahan' }
      ]
    },
    {
      name: 'Miri',
      state: 'Sarawak',
      districts: [
        { name: 'Miri City Centre' },
        { name: 'Marudi' },
        { name: 'Beluru' },
        { name: 'Telang Usan' },
        { name: 'Subis' }
      ]
    },
    {
      name: 'Sibu',
      state: 'Sarawak',
      districts: [
        { name: 'Sibu Town' },
        { name: 'Kanowit' },
        { name: 'Selangau' },
        { name: 'Julau' },
        { name: 'Pakan' }
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
