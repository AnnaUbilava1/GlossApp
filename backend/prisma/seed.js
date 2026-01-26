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
  for (const name of washers) {
    await prisma.washer.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Created washers');

  // Create default pricing matrix
  const carTypes = ['sedan', 'suv', 'truck', 'motorcycle'];
  const serviceTypes = ['basic', 'premium', 'deluxe'];
  const defaultPrices = {
    sedan: { basic: 20, premium: 35, deluxe: 50 },
    suv: { basic: 25, premium: 40, deluxe: 60 },
    truck: { basic: 30, premium: 45, deluxe: 70 },
    motorcycle: { basic: 15, premium: 25, deluxe: 35 },
  };

  for (const carType of carTypes) {
    for (const serviceType of serviceTypes) {
      await prisma.pricing.upsert({
        where: {
          carType_serviceType: {
            carType,
            serviceType,
          },
        },
        update: {},
        create: {
          carType,
          serviceType,
          price: defaultPrices[carType][serviceType],
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

