import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database Beby Gizie (Offline Only)...');

  // 1. Create Sales Methods (Only OFFLINE)
  console.log('--- Seeding Sales Methods ---');
  const methods = [
    { name: 'Langsung', code: 'OFFLINE' },
  ];

  for (const m of methods) {
    await prisma.salesMethod.upsert({
      where: { code: m.code },
      update: { name: m.name },
      create: { name: m.name, code: m.code },
    });
  }

  // 2. Create branches
  console.log('--- Seeding Branches ---');
  const cabang1 = await prisma.branch.upsert({
    where: { id: 'branch-utama' },
    update: {},
    create: {
      id: 'branch-utama',
      name: 'Pusat Gizie',
    },
  });

  const cabang2 = await prisma.branch.upsert({
    where: { id: 'branch-booth-1' },
    update: {},
    create: {
      id: 'branch-booth-1',
      name: 'Booth Organik 01',
    },
  });

  // 3. Create users
  console.log('--- Seeding Users ---');
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin Beby Gizie',
      username: 'admin',
      passwordHash: hashSync('admin123', 10),
      role: 'ADMIN',
      branchId: null,
    },
  });

  const karyawan = await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      name: 'Kasir Utama',
      username: 'kasir',
      passwordHash: hashSync('kasir123', 10),
      role: 'EMPLOYEE',
      branchId: cabang1.id,
    },
  });

  // 4. Create products
  console.log('--- Seeding Products ---');
  const products = [
    { name: 'Bubur Beras Putih Organik', price: 10000 },
    { name: 'Bubur Beras Merah Organik', price: 12000 },
    { name: 'Bubur Tim Ayam Kampung', price: 15000 },
    { name: 'Bubur Tim Daging Sapi', price: 18000 },
    { name: 'Bubur Kacang Hijau', price: 8000 },
  ];

  for (const product of products) {
    const slug = product.name.toLowerCase().replace(/\s/g, '-');
    await prisma.product.upsert({
      where: { id: `prod-${slug}` },
      update: { name: product.name },
      create: {
        id: `prod-${slug}`,
        name: product.name,
        isActive: true,
      },
    });

    // Add default price for OFFLINE
    const method = await prisma.salesMethod.findUnique({ where: { code: 'OFFLINE' } });
    if (method) {
      await prisma.productPrice.upsert({
        where: { productId_salesMethodId: { productId: `prod-${slug}`, salesMethodId: method.id } },
        update: { price: product.price },
        create: {
          productId: `prod-${slug}`,
          salesMethodId: method.id,
          price: product.price,
        },
      });
    }
  }

  // 5. Create sample transactions (Only OFFLINE)
  console.log('--- Seeding Sample Transactions ---');
  const today = new Date();
  
  const trx1 = await prisma.transaction.create({
    data: {
      transactionNumber: `BG-${formatDate(today)}-0001`,
      branchId: cabang1.id,
      salesMethod: 'OFFLINE',
      totalAmount: 22000,
      createdByUserId: karyawan.id,
      createdAt: today,
      items: {
        create: [
          {
            productId: 'prod-bubur-beras-merah-organik',
            productNameSnapshot: 'Bubur Beras Merah Organik',
            priceSnapshot: 12000,
            quantity: 1,
            subtotal: 12000,
          },
          {
            productId: 'prod-bubur-beras-putih-organik',
            productNameSnapshot: 'Bubur Beras Putih Organik',
            priceSnapshot: 10000,
            quantity: 1,
            subtotal: 10000,
          },
        ],
      },
    },
  });

  console.log('✅ Seeding completed!');
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
