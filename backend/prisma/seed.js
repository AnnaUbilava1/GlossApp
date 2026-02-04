// Seed script to populate initial data
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@glossapp.com' },
    update: {},
    create: {
      email: 'admin@glossapp.com',
      password: hashedPassword,
      role: 'admin',
      name: 'Admin User',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create default staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@glossapp.com' },
    update: {},
    create: {
      email: 'staff@glossapp.com',
      password: staffPassword,
      role: 'staff',
      name: 'Staff User',
    },
  });
  console.log('✅ Created staff user:', staff.email);

  // Create sample washers
  const washers = ['Washer 1', 'Washer 2', 'Washer 3'];
  for (const username of washers) {
    await prisma.washer.upsert({
      where: { username },
      update: {},
      create: { 
        username,
        name: username, // Optional name field
        active: true,
      },
    });
  }
  console.log('✅ Created washers');

  // Seed car types (schema codes + default display names)
  const carTypes = ['SEDAN', 'PREMIUM_CLASS', 'SMALL_JEEP', 'BIG_JEEP', 'MICROBUS'];
  const carTypeLabels = {
    SEDAN: { ka: 'სედანი', en: 'Sedan' },
    PREMIUM_CLASS: { ka: 'პრემიუმ კლასი', en: 'Premium' },
    SMALL_JEEP: { ka: 'ჯიპი', en: 'Jeep' },
    BIG_JEEP: { ka: 'დიდი ჯიპი', en: 'Big Jeep' },
    MICROBUS: { ka: 'მინივენი', en: 'Minivan' },
  };

  for (const code of carTypes) {
    const labels = carTypeLabels[code];
    await prisma.carType.upsert({
      where: { code },
      update: {},
      create: {
        code,
        displayNameKa: labels.ka,
        displayNameEn: labels.en,
        isActive: true,
        sortOrder: 0,
      },
    });
  }
  console.log('✅ Seeded car types');

  // Seed wash types (schema codes + default display names)
  const washTypes = ['COMPLETE', 'OUTER', 'INNER', 'ENGINE', 'CHEMICAL', 'CUSTOM'];
  const washTypeLabels = {
    COMPLETE: { ka: 'სრული რეცხვა', en: 'Complete Wash' },
    OUTER: { ka: 'გარე რეცხვა', en: 'Outer Wash' },
    INNER: { ka: 'სალონის რეცხვა', en: 'Interior Wash' },
    ENGINE: { ka: 'ძრავის რეცხვა', en: 'Engine Wash' },
    CHEMICAL: { ka: 'ქიმიური რეცხვა', en: 'Chemical Wash' },
    CUSTOM: { ka: 'სხვა სერვისი', en: 'Custom Service' },
  };

  for (const code of washTypes) {
    const labels = washTypeLabels[code];
    await prisma.washType.upsert({
      where: { code },
      update: {},
      create: {
        code,
        displayNameKa: labels.ka,
        displayNameEn: labels.en,
        isActive: code !== 'CUSTOM', // CUSTOM is available but typically hidden
        sortOrder: 0,
      },
    });
  }
  console.log('✅ Seeded wash types');



  for (const carCategory of carTypes) {
    for (const washType of washTypes) {
      await prisma.pricing.upsert({
        where: {
          carCategory_washType: {
            carCategory,
            washType,
          },
        },
        update: {},
        create: {
          carCategory,
          washType,
          price: defaultPrices[carCategory][washType],
        },
      });
    }
  }
  console.log('✅ Created pricing matrix');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

