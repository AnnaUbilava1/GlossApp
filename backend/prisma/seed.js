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

  // Create default pricing matrix
  const carTypes = ['SEDAN', 'PREMIUM_CLASS', 'SMALL_JEEP', 'BIG_JEEP', 'MICROBUS'];
  const washTypes = ['OUTER', 'INNER', 'COMPLETE', 'ENGINE', 'CHEMICAL'];
  const defaultPrices = {
    SEDAN: { OUTER: 17, INNER: 17, COMPLETE: 30, ENGINE: 60, CHEMICAL: 400 },
    PREMIUM_CLASS: { OUTER: 18, INNER: 18, COMPLETE: 32, ENGINE: 70, CHEMICAL: 450 },
    SMALL_JEEP: { OUTER: 20, INNER: 20, COMPLETE: 35, ENGINE: 80, CHEMICAL: 500 },
    BIG_JEEP: { OUTER: 25, INNER: 25, COMPLETE: 40, ENGINE: 90, CHEMICAL: 550 },
    MICROBUS: { OUTER: 40, INNER: 40, COMPLETE: 65, ENGINE: 100, CHEMICAL: 600 },
  };

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

