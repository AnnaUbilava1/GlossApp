import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const PRICES = {
  SEDAN: {
    COMPLETE: 30,
    OUTER: 17,
    INNER: 17,
    CHEMICAL: 400,
  },
  PREMIUM_CLASS: {
    COMPLETE: 32,
    OUTER: 18,
    INNER: 18,
    CHEMICAL: 450,
  },
  SMALL_JEEP: {
    COMPLETE: 35,
    OUTER: 20,
    INNER: 20,
    CHEMICAL: 500,
  },
  BIG_JEEP: {
    COMPLETE: 40,
    OUTER: 25,
    INNER: 25,
    CHEMICAL: 550, 
  },
  MICROBUS: {
    COMPLETE: 65,  
    OUTER: 40,     
    INNER: 40,    
    CHEMICAL: 600,
  },
};

async function main() {
  console.log('🌱 Seeding pricing from board...');

  for (const [carCategory, washes] of Object.entries(PRICES)) {
    for (const [washType, price] of Object.entries(washes)) {
      await prisma.pricing.upsert({
        where: {
          carCategory_washType: {
            carCategory,
            washType,
          },
        },
        update: { price },
        create: {
          carCategory,
          washType,
          price,
        },
      });
    }
  }

  console.log('✅ Pricing seeded.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding board prices:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });