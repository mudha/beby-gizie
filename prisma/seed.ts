import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database Beby Gizie...');

  // 0. Clear existing data (order matters for foreign keys)
  console.log('--- Clearing existing data ---');
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.salesMethod.deleteMany();

  // 1. Create Sales Methods (Only OFFLINE)
  console.log('--- Seeding Sales Methods ---');
  await prisma.salesMethod.create({
    data: { name: 'Langsung', code: 'OFFLINE' },
  });

  // 2. Create branches
  console.log('--- Seeding Branches ---');
  const branchNames = [
    'Siwalan',
    'Mlarak',
    'Malo',
    'Bangsalan',
    'Tamansari',
    'Prayungan Sawoo',
    'Grogol',
  ];

  for (const name of branchNames) {
    const slug = name.toLowerCase().replace(/\s/g, '-');
    await prisma.branch.create({
      data: {
        id: `branch-${slug}`,
        name,
      },
    });
  }

  // 3. Create users
  console.log('--- Seeding Users ---');
  await prisma.user.create({
    data: {
      name: 'Admin Beby Gizie',
      username: 'admin',
      passwordHash: hashSync('admin123', 10),
      role: 'ADMIN',
      branchId: null,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Kasir Siwalan',
      username: 'kasir',
      passwordHash: hashSync('kasir123', 10),
      role: 'EMPLOYEE',
      branchId: 'branch-siwalan',
    },
  });

  // 4. Create products with prices
  console.log('--- Seeding Products ---');
  const products = [
    { name: 'Bubur Halus 3k', price: 3000 },
    { name: 'Bubur Halus 4k', price: 4000 },
    { name: 'Bubur Halus 5k', price: 5000 },
    { name: 'Bubur Kasar 3k', price: 3000 },
    { name: 'Bubur Kasar 4k', price: 4000 },
    { name: 'Bubur Kasar 5k', price: 5000 },
  ];

  const method = await prisma.salesMethod.findUnique({ where: { code: 'OFFLINE' } });

  for (const product of products) {
    const slug = product.name.toLowerCase().replace(/\s/g, '-');
    const created = await prisma.product.create({
      data: {
        id: `prod-${slug}`,
        name: product.name,
        isActive: true,
      },
    });

    if (method) {
      await prisma.productPrice.create({
        data: {
          productId: created.id,
          salesMethodId: method.id,
          price: product.price,
        },
      });
    }
  }

  console.log('✅ Seeding completed!');
  console.log('   📍 7 Cabang: Siwalan, Mlarak, Malo, Bangsalan, Tamansari, Prayungan Sawoo, Grogol');
  console.log('   🍲 6 Produk: Bubur Halus & Kasar (3k, 4k, 5k)');
  console.log('   👤 Admin: admin / admin123');
  console.log('   👤 Kasir: kasir / kasir123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
